
import logging
import os
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth import logout as django_logout
from django.db import transaction
from django.utils import timezone
from accounts.services.jibit import (
    JibitError,
    shahkar_match,
    postal_lookup,
)

from accounts.serializers import PostalLookupSerializer
from drf_spectacular.utils import OpenApiResponse, extend_schema

from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.views import APIView

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.cookies import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    clear_auth_cookies,
    set_access_cookie,
    set_auth_cookies,
)

from accounts.models import (
    OtpToken,
    PasswordResetToken,
)

from accounts.serializers import (
    ChangePasswordSerializer,
    CompleteRegisterSerializer,
    LoginOtpSerializer,
    PasswordLoginSerializer,
    PasswordResetCompleteSerializer,
    PasswordResetSendOtpSerializer,
    PasswordResetVerifyOtpSerializer,
    ProfileUpdateSerializer,
    SendOtpSerializer,
    UserSerializer,
    VerifyOtpSerializer,
    build_tokens_for_user,
)

from accounts.services.jibit import JibitError, shahkar_match
from accounts.services.sms import MeliPayamakError, send_otp_sms
from accounts.utils import error_response, success_response


logger = logging.getLogger(__name__)
User = get_user_model()


# ============================================================
# CONSTANTS
# ============================================================

OTP_LENGTH = 5
OTP_EXPIRY_SECONDS = 120
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
RESET_TOKEN_EXPIRY_SECONDS = 600


# ============================================================
# HELPERS
# ============================================================

def _generate_otp(length=OTP_LENGTH):
    return "".join(
        str(secrets.randbelow(10))
        for _ in range(length)
    )


def _serializer_errors_to_list(errors):
    result = []

    for field, messages in errors.items():
        if isinstance(messages, (list, tuple)):
            for message in messages:
                result.append({
                    "field": field,
                    "message": str(message),
                })
        else:
            result.append({
                "field": field,
                "message": str(messages),
            })

    return result


def _validation_error(serializer):
    return error_response(
        message="اطلاعات ارسالی معتبر نیست.",
        errors=_serializer_errors_to_list(serializer.errors),
        status_code=400,
    )


def _user_is_blocked(user):
    return (
        not user.is_active
        or user.account_status == User.AccountStatus.SUSPENDED
    )



def _issue_login_response(user, message="ورود موفق."):
    tokens = build_tokens_for_user(user)

    response = success_response(
        message=message,
        data={
            "is_logged_in": True,
            "is_registered": True,
            "next_step": (
                "dashboard"
                if user.has_profile
                else "complete_register"
            ),
            "user": UserSerializer(user).data,
        },
    )

    return set_auth_cookies(
        response,
        tokens["access"],
        tokens["refresh"],
    )



def _find_valid_otp(phone, code):
    otp = (
        OtpToken.objects.filter(
            phone=phone,
            purpose=OtpToken.Purpose.LOGIN,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if not otp:
        return None, error_response(
            message="کد تأیید یافت نشد.",
            status_code=400,
        )

    if otp.is_expired:
        otp.is_used = True
        otp.save(update_fields=["is_used"])

        return None, error_response(
            message="کد تأیید منقضی شده است.",
            status_code=400,
        )

    if otp.attempts >= OTP_MAX_ATTEMPTS:
        otp.is_used = True
        otp.save(update_fields=["is_used"])

        return None, error_response(
            message="تعداد تلاش بیش از حد مجاز است.",
            status_code=429,
        )

    if not secrets.compare_digest(str(otp.code), str(code)):
        otp.attempts += 1

        if otp.attempts >= OTP_MAX_ATTEMPTS:
            otp.is_used = True
            otp.save(update_fields=["attempts", "is_used"])
        else:
            otp.save(update_fields=["attempts"])

        remaining = max(
            0,
            OTP_MAX_ATTEMPTS - otp.attempts,
        )

        return None, error_response(
            message=f"کد اشتباه است. {remaining} تلاش باقی مانده.",
            status_code=400,
        )

    return otp, None


def _send_otp(phone):
    recent = (
        OtpToken.objects.filter(
            phone=phone,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if recent:
        elapsed = (
            timezone.now() - recent.created_at
        ).total_seconds()

        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            wait = max(
                1,
                int(OTP_RESEND_COOLDOWN_SECONDS - elapsed),
            )

            return error_response(
                message=f"لطفاً {wait} ثانیه دیگر تلاش کنید.",
                errors=[{
                    "field": "phone",
                    "code": "otp_resend_cooldown",
                    "message": f"ارسال مجدد تا {wait} ثانیه دیگر امکان‌پذیر نیست.",
                }],
                status_code=429,
            )

    code = _generate_otp()

    otp = OtpToken.objects.create(
        phone=phone,
        code=code,
        purpose=OtpToken.Purpose.LOGIN,
        expires_at=timezone.now() + timedelta(
            seconds=OTP_EXPIRY_SECONDS
        ),
    )

    try:
        tracking_id = send_otp_sms(phone, code)

        if not tracking_id:
            raise MeliPayamakError(
                "EMPTY_TRACKING_ID",
                "شناسه پیگیری دریافت نشد.",
            )

    except MeliPayamakError as exc:
        otp.delete()

        logger.error(
            "OTP SMS error: %s",
            exc.code,
        )

        return error_response(
            message="ارسال پیامک ناموفق بود.",
            errors=[{
                "code": str(exc.code),
                "message": exc.message,
            }],
            status_code=503,
        )

    except Exception:
        otp.delete()

        logger.exception("Unexpected OTP error")

        return error_response(
            message="خطای داخلی هنگام ارسال پیامک.",
            status_code=500,
        )

    OtpToken.objects.filter(
        phone=phone,
        is_used=False,
    ).exclude(
        pk=otp.pk
    ).update(
        is_used=True
    )

    return success_response(
        message="کد تأیید ارسال شد.",
        data={
            "expires_in": OTP_EXPIRY_SECONDS,
        },
    )


# ============================================================
# 1. SEND OTP
# ============================================================

@extend_schema(
    tags=["احراز هویت"],
    summary="ارسال کد تأیید",
    request=SendOtpSerializer,
    responses={
        200: OpenApiResponse(description="کد ارسال شد"),
        429: OpenApiResponse(description="محدودیت ارسال"),
    },
)
class SendOtpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = SendOtpSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        phone = serializer.validated_data["phone"]

        return _send_otp(phone)


# ============================================================
# 2. VERIFY OTP / REGISTER
# ============================================================

@extend_schema(
    tags=["احراز هویت"],
    summary="تأیید کد ورود یا ثبت‌نام",
    request=VerifyOtpSerializer,
)
class VerifyOtpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = VerifyOtpSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        with transaction.atomic():
            otp, error = _find_valid_otp(phone, code)

            if error is not None:
                return error

            user, created = User.objects.get_or_create(
                phone=phone,
                defaults={
                    "phone_verified": True,
                    "is_active": True,
                },
            )

            if _user_is_blocked(user):
                return error_response(
                    message="حساب کاربری غیرفعال یا تعلیق شده است.",
                    status_code=403,
                )

            otp.is_used = True
            otp.save(update_fields=["is_used"])

            user.phone_verified = True
            user.last_login = timezone.now()

            user.save(
                update_fields=[
                    "phone_verified",
                    "last_login",
                ]
            )

        tokens = build_tokens_for_user(user)

        if not user.has_profile:
            response = success_response(
                message="کد تأیید شد.",
                data={
                    "next_step": "complete_register",
                },
            )
        else:
            response = success_response(
                message="ورود موفق.",
                data={
                    "next_step": "dashboard",
                    "user": UserSerializer(user).data,
                },
            )

        return set_auth_cookies(
            response,
            tokens["access"],
            tokens["refresh"],
        )


# ============================================================
# 3. COMPLETE REGISTRATION
# ============================================================


@extend_schema(
    tags=["احراز هویت"],
    summary="تکمیل ثبت‌نام",
    request=CompleteRegisterSerializer,
)
class CompleteRegisterView(APIView):
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def post(self, request):
        user = request.user

        if user.has_profile:
            return error_response(
                message="پروفایل شما قبلاً تکمیل شده است.",
                status_code=409,
            )

        serializer = CompleteRegisterSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        national_code = serializer.validated_data[
            "national_code"
        ]

        try:
            shahkar_match(
                national_code,
                user.phone,
            )

        except JibitError as exc:
            return error_response(
                message=str(exc),
                errors=[{
                    "field": "national_code",
                    "message": str(exc),
                }],
                status_code=400,
            )

        try:
            postal_address = postal_lookup(
                serializer.validated_data["postal_code"]
            )

        except JibitError as exc:
            return error_response(
                message=str(exc),
                errors=[{
                    "field": "postal_code",
                    "message": str(exc),
                }],
                status_code=400,
            )

        serializer.context["postal_address"] = postal_address

        new_avatar = serializer.validated_data.get(
            "avatar"
        )

        old_avatar_path = None

        if new_avatar and user.avatar:
            try:
                old_avatar_path = user.avatar.path
            except (ValueError, NotImplementedError):
                pass

        user = serializer.save()
        user.refresh_from_db()

        if old_avatar_path:
            try:
                if os.path.isfile(old_avatar_path):
                    os.remove(old_avatar_path)
            except OSError:
                logger.warning(
                    "Could not remove previous avatar"
                )

        return success_response(
            message="ثبت‌نام با موفقیت تکمیل شد.",
            data={
                "user": UserSerializer(user).data,
                "next_step": "dashboard",
            },
            status_code=201,
        )



# ============================================================
# 4. PASSWORD LOGIN
# ============================================================

@extend_schema(
    tags=["احراز هویت"],
    summary="ورود با رمز عبور",
    request=PasswordLoginSerializer,
)
class PasswordLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordLoginSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            errors = _serializer_errors_to_list(
                serializer.errors
            )

            phone_errors = serializer.errors.get("phone", [])
            password_errors = serializer.errors.get("password", [])

            is_not_registered = any(
                getattr(error, "code", None)
                == "user_not_registered"
                for error in phone_errors
            )

            is_invalid_password = any(
                getattr(error, "code", None)
                == "invalid_password"
                for error in password_errors
            )

            if is_not_registered:
                message = "این شماره موبایل هنوز ثبت‌نام نکرده است."
                status_code = 404
                is_registered = False
                error_code = "user_not_registered"

            elif is_invalid_password:
                message = "رمز عبور اشتباه است."
                status_code = 401
                is_registered = True
                error_code = "invalid_password"

            else:
                message = "اطلاعات ارسالی معتبر نیست."
                status_code = 400
                is_registered = None
                error_code = "validation_error"

            response = error_response(
                message=message,
                errors=errors,
                status_code=status_code,
            )

            response.data["data"] = {
                "is_logged_in": False,
                "is_registered": is_registered,
                "error_code": error_code,
                "next_step": (
                    "register"
                    if is_not_registered
                    else None
                ),
            }

            return response

        user = serializer.validated_data["user"]

        if _user_is_blocked(user):
            response = error_response(
                message="حساب کاربری غیرفعال یا تعلیق شده است.",
                status_code=403,
            )

            response.data["data"] = {
                "is_logged_in": False,
                "is_registered": True,
                "error_code": "account_blocked",
                "next_step": None,
            }

            return response

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        return _issue_login_response(user)




# ============================================================
# 5. CHANGE PASSWORD
# ============================================================

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["احراز هویت"],
        summary="تغییر رمز عبور",
        request=ChangePasswordSerializer,
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        serializer.save()

        return success_response(
            message="رمز عبور با موفقیت تغییر کرد."
        )


# ============================================================
# 6. PASSWORD RESET - SEND OTP
# ============================================================

@extend_schema(
    tags=["فراموشی رمز"],
    summary="ارسال کد بازیابی رمز",
    request=PasswordResetSendOtpSerializer,
)
class PasswordResetSendOtpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetSendOtpSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        phone = serializer.validated_data["phone"]

        user = User.objects.filter(
            phone=phone,
            is_active=True,
        ).first()

        if not user:
            return error_response(
                message="کاربری با این شماره یافت نشد.",
                status_code=404,
            )

        return _send_otp(phone)


# ============================================================
# 7. PASSWORD RESET - VERIFY OTP
# ============================================================

@extend_schema(
    tags=["فراموشی رمز"],
    summary="تأیید کد بازیابی رمز",
    request=PasswordResetVerifyOtpSerializer,
)
class PasswordResetVerifyOtpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetVerifyOtpSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        with transaction.atomic():
            otp, error = _find_valid_otp(phone, code)

            if error is not None:
                return error

            user = User.objects.filter(
                phone=phone
            ).first()

            if not user:
                return error_response(
                    message="کاربری با این شماره یافت نشد.",
                    status_code=404,
                )

            if _user_is_blocked(user):
                return error_response(
                    message="حساب کاربری غیرفعال است.",
                    status_code=403,
                )

            otp.is_used = True
            otp.save(update_fields=["is_used"])

            PasswordResetToken.objects.filter(
                user=user,
                is_used=False,
            ).update(is_used=True)

            reset_token = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(
                    seconds=RESET_TOKEN_EXPIRY_SECONDS
                ),
            )

        return success_response(
            message="کد تأیید شد.",
            data={
                "reset_token": str(reset_token.token),
                "expires_in": RESET_TOKEN_EXPIRY_SECONDS,
                "phone": phone,
            },
        )


# ============================================================
# 8. PASSWORD RESET - COMPLETE
# ============================================================

@extend_schema(
    tags=["فراموشی رمز"],
    summary="تنظیم رمز عبور جدید",
    request=PasswordResetCompleteSerializer,
)
class PasswordResetCompleteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetCompleteSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        token_value = serializer.validated_data["token"]
        new_password = serializer.validated_data[
            "new_password"
        ]

        with transaction.atomic():
            try:
                reset_token = (
                    PasswordResetToken.objects
                    .select_for_update()
                    .get(token=token_value)
                )

            except PasswordResetToken.DoesNotExist:
                return error_response(
                    message="توکن بازیابی نامعتبر است.",
                    status_code=400,
                )

            if reset_token.is_used:
                return error_response(
                    message="این توکن قبلاً استفاده شده است.",
                    status_code=400,
                )

            if reset_token.is_expired:
                reset_token.is_used = True
                reset_token.save(
                    update_fields=["is_used"]
                )

                return error_response(
                    message="توکن بازیابی منقضی شده است.",
                    status_code=400,
                )

            user = reset_token.user

            user.set_password(new_password)
            user.save(update_fields=["password"])

            reset_token.is_used = True
            reset_token.save(
                update_fields=["is_used"]
            )

            PasswordResetToken.objects.filter(
                user=user,
                is_used=False,
            ).update(is_used=True)

        return success_response(
            message="رمز عبور با موفقیت تغییر کرد.",
            data={
                "phone": user.phone,
            },
        )


# ============================================================
# 9. CURRENT USER / ME
# ============================================================

@extend_schema(
    tags=["پروفایل"],
    summary="اطلاعات کاربر جاری",
)
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return success_response(
            message="اطلاعات کاربر",
            data={
                "user": UserSerializer(user).data,
                "next_step": (
                    "dashboard"
                    if user.has_profile
                    else "complete_register"
                ),
            },
        )


# ============================================================
# 10. LOGIN WITH OTP
# ============================================================

@extend_schema(
    tags=["احراز هویت"],
    summary="ورود کاربران ثبت‌نام‌شده با OTP",
    request=LoginOtpSerializer,
)
class LoginWithOtpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginOtpSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        with transaction.atomic():
            otp, error = _find_valid_otp(phone, code)

            if error is not None:
                return error

            user = User.objects.filter(
                phone=phone
            ).first()

            if not user:
                return error_response(
                    message="ابتدا ثبت‌نام کنید.",
                    errors=[{
                        "code": "user_not_registered",
                        "message": "کاربری با این شماره وجود ندارد.",
                    }],
                    status_code=400,
                )

            if _user_is_blocked(user):
                return error_response(
                    message="حساب کاربری غیرفعال است.",
                    status_code=403,
                )

            if not user.has_profile:
                return error_response(
                    message="پروفایل شما کامل نیست.",
                    errors=[{
                        "code": "incomplete_profile",
                        "next_step": "complete_register",
                        "register_endpoint": "/accounts/complete-register/",
                    }],
                    status_code=400,
                )

            otp.is_used = True
            otp.save(update_fields=["is_used"])

            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

        return _issue_login_response(user)


# ============================================================
# 11. LOGOUT
# ============================================================

@extend_schema(
    tags=["احراز هویت"],
    summary="خروج از حساب",
    request=None,
)
class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_value = request.COOKIES.get(
            REFRESH_COOKIE
        )

        if refresh_value:
            try:
                refresh_token = RefreshToken(
                    refresh_value
                )

                refresh_token.blacklist()

            except (TokenError, AttributeError):
                logger.warning(
                    "Refresh token invalid or blacklist unavailable"
                )

            except Exception:
                logger.exception(
                    "Failed to blacklist refresh token"
                )

        django_logout(request)

        response = success_response(
            message="خروج موفق."
        )

        return clear_auth_cookies(response)


# ============================================================
# 12. REFRESH ACCESS TOKEN
# ============================================================

@extend_schema(
    tags=["احراز هویت"],
    summary="تمدید توکن دسترسی",
    request=None,
)
class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_value = request.COOKIES.get(
            REFRESH_COOKIE
        )

        if not refresh_value:
            return error_response(
                message="رفرش توکن یافت نشد.",
                status_code=401,
            )

        try:
            refresh_token = RefreshToken(
                refresh_value
            )

            access_token = str(
                refresh_token.access_token
            )

        except TokenError:
            response = error_response(
                message="رفرش توکن نامعتبر یا منقضی است.",
                status_code=401,
            )

            return clear_auth_cookies(response)

        response = success_response(
            message="توکن دسترسی تمدید شد."
        )

        return set_access_cookie(
            response,
            access_token,
        )


# ============================================================
# 13. PROFILE
# ============================================================

# ============================================================
# 13. PROFILE — GET + PUT
# ============================================================

@extend_schema(
    tags=["پروفایل"],
    summary="دریافت و ویرایش اطلاعات پروفایل",
)
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def _get_profile_data(self, request, user):
        avatar_url = None

        if user.avatar:
            avatar_url = request.build_absolute_uri(
                user.avatar.url
            )

        from panel.serializers import role_profile_data
        return {
            **role_profile_data(user, {"request": request}),
            "id": user.id,
            "phone": user.phone,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.full_name,
            "national_code": user.national_code,
            "birth_date": user.birth_date,
            "avatar": avatar_url,
            "province": user.province,
            "city": user.city,
            "postal_code": user.postal_code,
            "address": user.address,
            "user_type": user.user_type,
            "user_type_display":
                user.get_user_type_display(),
            "role": user.role,
            "role_display":
                user.get_role_display(),
            "account_status": user.account_status,
            "account_status_display":
                user.get_account_status_display(),
            "verification_status":
                user.verification_status,
            "verification_status_display":
                user.get_verification_status_display(),
            "phone_verified": user.phone_verified,
            "national_code_verified":
                user.national_code_verified,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "admin_level": user.admin_level,
            "has_profile": user.has_profile,
            "last_login": user.last_login,
            "date_joined": user.date_joined,
        }

    @extend_schema(
        tags=["پروفایل"],
        summary="دریافت اطلاعات کامل پروفایل",
        responses={200: UserSerializer},
    )
    def get(self, request):
        return success_response(
            message="اطلاعات پروفایل",
            data=self._get_profile_data(
                request,
                request.user,
            ),
        )

    @extend_schema(
        tags=["پروفایل"],
        summary="ویرایش اطلاعات پروفایل",
        request=ProfileUpdateSerializer,
        responses={200: UserSerializer},
    )
    def put(self, request):
        user = request.user

        serializer = ProfileUpdateSerializer(
            instance=user,
            data=request.data,
            context={
                "request": request,
            },
        )

        if not serializer.is_valid():
            errors = _serializer_errors_to_list(
                serializer.errors
            )

            message = (
                errors[0]["message"]
                if errors
                else "اطلاعات ارسالی معتبر نیست."
            )

            return error_response(
                message=message,
                errors=errors,
                status_code=400,
            )

        if "postal_code" in serializer.validated_data:
            try:
                postal_address = postal_lookup(
                    serializer.validated_data["postal_code"]
                )

            except JibitError as exc:
                return error_response(
                    message=str(exc),
                    errors=[{
                        "field": "postal_code",
                        "message": str(exc),
                    }],
                    status_code=400,
                )

            serializer.context[
                "postal_address"
            ] = postal_address

        user = serializer.save()
        user.refresh_from_db()

        return success_response(
            message="اطلاعات پروفایل با موفقیت ویرایش شد.",
            data=self._get_profile_data(
                request,
                user,
            ),
        )




@extend_schema(
    tags=["پروفایل"],
    summary="استعلام آدرس با کد پستی از جیبیت",
    parameters=[PostalLookupSerializer],
)
class PostalLookupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = PostalLookupSerializer(
            data=request.query_params
        )

        if not serializer.is_valid():
            errors = _serializer_errors_to_list(
                serializer.errors
            )

            return error_response(
                message=(
                    errors[0]["message"]
                    if errors
                    else "کد پستی نامعتبر است."
                ),
                errors=errors,
                status_code=400,
            )

        try:
            result = postal_lookup(
                serializer.validated_data["postal_code"]
            )

        except JibitError as exc:
            return error_response(
                message=str(exc),
                errors=[{
                    "field": "postal_code",
                    "message": str(exc),
                }],
                status_code=400,
            )

        return success_response(
            message="آدرس کد پستی دریافت شد.",
            data=result,
        )





# ============================================================
# BUSINESS AUDIT EVENTS (SERVER-SIDE, AUTHENTICATED)
# ============================================================
class RecordActivityEventView(APIView):
    permission_classes = [IsAuthenticated]
    ALLOWED_EVENTS = {"profile.view", "dashboard.open", "property.view", "property.search", "notification.read"}

    def post(self, request):
        from accounts.models import ActivityLog
        event = request.data.get("event")
        if event not in self.ALLOWED_EVENTS:
            return error_response("رویداد نامعتبر است.", status_code=400)
        ActivityLog.objects.create(
            actor=request.user, event=event, category="business",
            method="EVENT", path=request.path[:500], status_code=200,
            ip_address=request.META.get("REMOTE_ADDR") or None,
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            metadata={},
        )
        return success_response("رویداد ثبت شد.", data={"recorded": True})

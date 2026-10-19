import logging
import os
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.cookies import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from accounts.models import OtpToken, PasswordResetToken
from accounts.serializers import (
    ChangePasswordSerializer,
    CompleteRegisterSerializer,
    PasswordLoginSerializer,
    PasswordResetCompleteSerializer,
    PasswordResetSendOtpSerializer,
    PasswordResetVerifyOtpSerializer,
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


# ==================================================================
# تنظیمات OTP
# ==================================================================
OTP_LENGTH = 5
OTP_EXPIRY_SECONDS = 120
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
RESET_TOKEN_EXPIRY_SECONDS = 600  # 10 دقیقه


def _generate_otp(length: int = OTP_LENGTH) -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def _serializer_errors_to_list(errors: dict) -> list:
    result = []
    for field, msgs in errors.items():
        if isinstance(msgs, (list, tuple)):
            for msg in msgs:
                result.append({"field": field, "message": str(msg)})
        else:
            result.append({"field": field, "message": str(msgs)})
    return result


# ==================================================================
# 1) ارسال OTP (ثبت‌نام / ورود)
# ==================================================================
@extend_schema(
    tags=["احراز هویت"],
    summary="مرحله ۱ — ارسال کد تایید",
    request=SendOtpSerializer,
    responses={
        200: OpenApiResponse(description="کد ارسال شد."),
        400: OpenApiResponse(description="شماره نامعتبر."),
        429: OpenApiResponse(description="محدودیت ارسال."),
        503: OpenApiResponse(description="خطای پیامک."),
    },
)
class SendOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOtpSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=400,
            )

        phone = serializer.validated_data["phone"]

        recent = (
            OtpToken.objects.filter(phone=phone, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if recent:
            elapsed = (timezone.now() - recent.created_at).total_seconds()
            if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                wait = max(1, int(OTP_RESEND_COOLDOWN_SECONDS - elapsed))
                return error_response(
                    message=f"لطفاً {wait} ثانیه دیگر تلاش کنید.",
                    errors=[{
                        "field": "phone",
                        "code": "otp_resend_cooldown",
                        "message": f"امکان ارسال مجدد تا {wait} ثانیه دیگر وجود ندارد.",
                    }],
                    status_code=429,
                )

        code = _generate_otp()
        otp = OtpToken.objects.create(
            phone=phone,
            code=code,
            purpose=OtpToken.Purpose.LOGIN,
            expires_at=timezone.now() + timedelta(seconds=OTP_EXPIRY_SECONDS),
        )

        try:
            tracking_id = send_otp_sms(phone, code)
            if not tracking_id:
                raise MeliPayamakError("EMPTY_TRACKING_ID", "شناسه پیگیری برنگشت.")
        except MeliPayamakError as exc:
            otp.delete()
            logger.error("OTP failed for %s: %s", phone, exc.code)
            return error_response(
                message="ارسال پیامک ناموفق بود.",
                errors=[{"code": str(exc.code), "message": exc.message}],
                status_code=503,
            )
        except Exception:
            otp.delete()
            logger.exception("Unexpected OTP error.")
            return error_response(
                message="خطای داخلی هنگام ارسال پیامک.",
                errors=[{"code": "internal_error", "message": "بعداً دوباره تلاش کنید."}],
                status_code=500,
            )

        OtpToken.objects.filter(phone=phone, is_used=False).exclude(pk=otp.pk).update(is_used=True)

        return success_response(
            message="کد تأیید ارسال شد.",
            data={"expires_in": OTP_EXPIRY_SECONDS},
        )


# ==================================================================
# 2) تایید OTP
# ==================================================================
class VerifyOtpView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["احراز هویت"],
        summary="مرحله ۲ — تایید کد",
        description=(
            "کد را تایید می‌کند. "
            "اگر کاربر قبلاً پروفایل داشت → `state` خلاصه + `next_step: dashboard`. "
            "اگر جدید بود → فقط پیام «کد تایید شد» + `next_step: complete_register`. "
            "کوکی‌ها ست می‌شوند."
        ),
        request=VerifyOtpSerializer,
        responses={
            200: OpenApiResponse(description="کد تایید شد."),
            400: OpenApiResponse(description="کد اشتباه یا منقضی."),
            403: OpenApiResponse(description="حساب غیرفعال."),
            429: OpenApiResponse(description="تعداد تلاش بیش از حد."),
        },
    )
    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=400,
            )

        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        otp = (
            OtpToken.objects.filter(
                phone=phone, purpose=OtpToken.Purpose.LOGIN, is_used=False
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            return error_response(message="کد تایید یافت نشد.", status_code=400)

        if otp.is_expired:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return error_response(message="کد تایید منقضی شده است.", status_code=400)

        if otp.attempts >= OTP_MAX_ATTEMPTS:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return error_response(
                message="تعداد تلاش بیش از حد مجاز.", status_code=429
            )

        if otp.code != code:
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            remaining = OTP_MAX_ATTEMPTS - otp.attempts
            return error_response(
                message=f"کد اشتباه است. {remaining} تلاش باقی مانده.", status_code=400
            )

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={"phone_verified": True, "is_active": True},
        )

        if not user.is_active or user.account_status == User.AccountStatus.SUSPENDED:
            return error_response(
                message="حساب کاربری غیرفعال یا تعلیق شده است.", status_code=403
            )

        if not user.phone_verified:
            user.phone_verified = True

        user.last_login = timezone.now()
        user.save(update_fields=["phone_verified", "last_login"])

        tokens = build_tokens_for_user(user)

        if not user.has_profile:
            response = success_response(
                message="کد تایید شد.",
                data={"next_step": "complete_register"},
            )
            return set_auth_cookies(response, tokens["access"], tokens["refresh"])

        response = success_response(
            message="ورود موفق.",
            data={
                "next_step": "dashboard",
                "user": {
                    "id": user.id,
                    "phone": user.phone,
                    "full_name": user.full_name,
                    "role": user.role,
                    "role_display": user.get_role_display(),
                    "account_status": user.account_status,
                    "verification_status": user.verification_status,
                },
            },
        )
        return set_auth_cookies(response, tokens["access"], tokens["refresh"])


# ==================================================================
# 3) تکمیل ثبت‌نام (با آواتار)
# ==================================================================
@extend_schema(
    tags=["احراز هویت"],
    summary="مرحله ۳ — تکمیل ثبت‌نام",
    description=(
        "اطلاعات شخصی، مکان، رمز عبور، نوع کاربر و عکس پروفایل را ذخیره می‌کند. "
        "کد ملی با موبایل از طریق جیبیت تطبیق داده می‌شود. "
        "برای ارسال عکس، باید `multipart/form-data` بفرستی."
    ),
    request=CompleteRegisterSerializer,
    responses={
        201: OpenApiResponse(description="ثبت‌نام تکمیل شد."),
        400: OpenApiResponse(description="خطای اعتبارسنجی یا جیبیت."),
        409: OpenApiResponse(description="پروفایل قبلاً تکمیل شده."),
    },
)
class CompleteRegisterView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user = request.user

        if user.has_profile:
            return error_response(
                message="پروفایل شما قبلاً تکمیل شده است.",
                status_code=409,
            )

        serializer = CompleteRegisterSerializer(
            data=request.data, context={"request": request}
        )

        if not serializer.is_valid():
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=400,
            )

        national_code = serializer.validated_data["national_code"]
        phone = user.phone

        try:
            shahkar_match(national_code, phone)
        except JibitError as exc:
            logger.warning(
                "Shahkar failed for %s (national=%s): %s",
                phone, national_code, exc,
            )
            return error_response(
                message=str(exc),
                errors=[{"field": "national_code", "message": str(exc)}],
                status_code=400,
            )

        new_avatar = serializer.validated_data.get("avatar")
        if new_avatar and user.avatar:
            try:
                old_path = user.avatar.path
                if os.path.isfile(old_path):
                    os.remove(old_path)
            except Exception as e:
                logger.warning("Could not delete old avatar: %s", e)

        user = serializer.save()
        user.refresh_from_db()

        return success_response(
            message="ثبت‌نام با موفقیت تکمیل شد.",
            data={
                "user": UserSerializer(user).data,
                "next_step": "dashboard",
            },
            status_code=201,
        )


# ==================================================================
# 4) ورود با رمز
# ==================================================================
class PasswordLoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["احراز هویت"],
        summary="ورود با رمز عبور",
        request=PasswordLoginSerializer,
        responses={
            200: OpenApiResponse(description="ورود موفق."),
            401: OpenApiResponse(description="اطلاعات اشتباه."),
        },
    )
    def post(self, request):
        serializer = PasswordLoginSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="شماره موبایل یا رمز عبور اشتباه است.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=401,
            )

        user = serializer.validated_data["user"]
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        tokens = build_tokens_for_user(user)

        response = success_response(
            message="ورود موفق.",
            data={
                "next_step": "dashboard" if user.has_profile else "complete_register",
                "user": UserSerializer(user).data,
            },
        )
        return set_auth_cookies(response, tokens["access"], tokens["refresh"])


# ==================================================================
# 5) تغییر رمز (با لاگین و رمز فعلی)
# ==================================================================
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["احراز هویت"],
        summary="تغییر رمز عبور (با رمز فعلی)",
        description="برای کاربرانی که لاگین هستند و رمز فعلی را می‌دانند.",
        request=ChangePasswordSerializer,
        responses={200: OpenApiResponse(description="تغییر کرد."), 400: OpenApiResponse(description="نامعتبر.")},
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )

        if not serializer.is_valid():
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=400,
            )

        serializer.save()
        return success_response(message="رمز عبور تغییر کرد.")


# ==================================================================
# 6) فراموشی رمز — مرحله ۱: ارسال OTP
# ==================================================================
@extend_schema(
    tags=["فراموشی رمز"],
    summary="مرحله ۱ — ارسال کد تایید",
    description="برای شماره‌ای که قبلاً ثبت‌نام کرده، کد OTP ارسال می‌کند.",
    request=PasswordResetSendOtpSerializer,
    responses={
        200: OpenApiResponse(description="کد ارسال شد."),
        400: OpenApiResponse(description="شماره نامعتبر یا کاربر یافت نشد."),
        429: OpenApiResponse(description="محدودیت ارسال."),
        503: OpenApiResponse(description="خطای پیامک."),
    },
)
class PasswordResetSendOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSendOtpSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=400,
            )

        phone = serializer.validated_data["phone"]

        recent = (
            OtpToken.objects.filter(phone=phone, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if recent:
            elapsed = (timezone.now() - recent.created_at).total_seconds()
            if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                wait = max(1, int(OTP_RESEND_COOLDOWN_SECONDS - elapsed))
                return error_response(
                    message=f"لطفاً {wait} ثانیه دیگر تلاش کنید.",
                    errors=[{
                        "field": "phone",
                        "code": "otp_resend_cooldown",
                        "message": f"امکان ارسال مجدد تا {wait} ثانیه دیگر وجود ندارد.",
                    }],
                    status_code=429,
                )

        code = _generate_otp()
        otp = OtpToken.objects.create(
            phone=phone,
            code=code,
            purpose=OtpToken.Purpose.LOGIN,
            expires_at=timezone.now() + timedelta(seconds=OTP_EXPIRY_SECONDS),
        )

        try:
            tracking_id = send_otp_sms(phone, code)
            if not tracking_id:
                raise MeliPayamakError("EMPTY_TRACKING_ID", "شناسه پیگیری برنگشت.")
        except MeliPayamakError as exc:
            otp.delete()
            logger.error("Password reset OTP failed for %s: %s", phone, exc.code)
            return error_response(
                message="ارسال پیامک ناموفق بود.",
                errors=[{"code": str(exc.code), "message": exc.message}],
                status_code=503,
            )
        except Exception:
            otp.delete()
            logger.exception("Unexpected OTP error.")
            return error_response(
                message="خطای داخلی هنگام ارسال پیامک.",
                errors=[{"code": "internal_error", "message": "بعداً دوباره تلاش کنید."}],
                status_code=500,
            )

        OtpToken.objects.filter(phone=phone, is_used=False).exclude(pk=otp.pk).update(is_used=True)

        return success_response(
            message="کد بازیابی ارسال شد.",
            data={"expires_in": OTP_EXPIRY_SECONDS},
        )


# ==================================================================
# 7) فراموشی رمز — مرحله ۲: تایید OTP + صدور reset_token
# ==================================================================
@extend_schema(
    tags=["فراموشی رمز"],
    summary="مرحله ۲ — تایید کد و دریافت توکن بازیابی",
    description=(
        "کد OTP را تایید می‌کند. در صورت موفقیت، یک `reset_token` "
        "برمی‌گرداند که ۱۰ دقیقه اعتبار دارد و باید برای مرحله ۳ استفاده شود."
    ),
    request=PasswordResetVerifyOtpSerializer,
    responses={
        200: OpenApiResponse(description="کد تایید شد. توکن بازیابی صادر شد."),
        400: OpenApiResponse(description="کد اشتباه یا منقضی."),
        429: OpenApiResponse(description="تعداد تلاش بیش از حد."),
    },
)
class PasswordResetVerifyOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifyOtpSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=400,
            )

        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        otp = (
            OtpToken.objects.filter(
                phone=phone, purpose=OtpToken.Purpose.LOGIN, is_used=False
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            return error_response(message="کد تایید یافت نشد.", status_code=400)

        if otp.is_expired:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return error_response(message="کد تایید منقضی شده است.", status_code=400)

        if otp.attempts >= OTP_MAX_ATTEMPTS:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return error_response(message="تعداد تلاش بیش از حد مجاز.", status_code=429)

        if otp.code != code:
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            remaining = OTP_MAX_ATTEMPTS - otp.attempts
            return error_response(
                message=f"کد اشتباه است. {remaining} تلاش باقی مانده.", status_code=400
            )

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        user = User.objects.filter(phone=phone).first()
        if not user:
            return error_response(message="کاربری با این شماره یافت نشد.", status_code=404)

        if not user.is_active or user.account_status == User.AccountStatus.SUSPENDED:
            return error_response(
                message="حساب کاربری غیرفعال یا تعلیق شده است.", status_code=403
            )

        # باطل کردن توکن‌های قبلی
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        reset_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(seconds=RESET_TOKEN_EXPIRY_SECONDS),
        )

        return success_response(
            message="کد تایید شد. از توکن برای تنظیم رمز جدید استفاده کنید.",
            data={
                "reset_token": str(reset_token.token),
                "expires_in": RESET_TOKEN_EXPIRY_SECONDS,
                "phone": phone,
            },
        )


# ==================================================================
# 8) فراموشی رمز — مرحله ۳: تنظیم رمز جدید
# ==================================================================
@extend_schema(
    tags=["فراموشی رمز"],
    summary="مرحله ۳ — تنظیم رمز جدید",
    description="با `reset_token` دریافتی، رمز جدید را تنظیم می‌کند. `reset_token` یکبارمصرف است.",
    request=PasswordResetCompleteSerializer,
    responses={
        200: OpenApiResponse(description="رمز جدید تنظیم شد."),
        400: OpenApiResponse(description="توکن نامعتبر یا منقضی."),
    },
)
class PasswordResetCompleteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetCompleteSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=_serializer_errors_to_list(serializer.errors),
                status_code=400,
            )

        token_value = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            reset_token = PasswordResetToken.objects.get(token=token_value)
        except PasswordResetToken.DoesNotExist:
            return error_response(message="توکن نامعتبر است.", status_code=400)

        if reset_token.is_used:
            return error_response(message="این توکن قبلاً استفاده شده است.", status_code=400)

        if reset_token.is_expired:
            reset_token.is_used = True
            reset_token.save(update_fields=["is_used"])
            return error_response(message="توکن منقضی شده است.", status_code=400)

        user = reset_token.user
        user.set_password(new_password)
        user.save(update_fields=["password"])

        reset_token.is_used = True
        reset_token.save(update_fields=["is_used"])

        # باطل کردن همه توکن‌های دیگه کاربر
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        return success_response(
            message="رمز عبور با موفقیت تغییر کرد. حالا می‌توانید وارد شوید.",
            data={"phone": user.phone},
        )


# ==================================================================
# 9) /me
# ==================================================================
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["پروفایل"],
        summary="دریافت اطلاعات کاربر جاری",
        responses={200: OpenApiResponse(description="OK"), 401: OpenApiResponse(description="احراز نشده.")},
    )
    def get(self, request):
        user = request.user
        return success_response(
            message="اطلاعات کاربر",
            data={
                "user": UserSerializer(user).data,
                "next_step": "dashboard" if user.has_profile else "complete_register",
            },
        )


# ==================================================================
# 10) خروج کامل
# ==================================================================
@extend_schema(
    tags=["احراز هویت"],
    summary="خروج از حساب",
    description="رفرش توکن را blacklist می‌کند و همه کوکی‌ها (access و refresh) را پاک می‌کند.",
    responses={200: OpenApiResponse(description="خروج موفق.")},
)
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass

        response = success_response(message="خروج موفق.")
        return clear_auth_cookies(response)


# ==================================================================
# 11) تمدید access token
# ==================================================================
class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["احراز هویت"],
        summary="تمدید توکن دسترسی",
        responses={200: OpenApiResponse(description="تمدید شد."), 401: OpenApiResponse(description="نامعتبر.")},
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh_token:
            return error_response(message="رفرش توکن یافت نشد.", status_code=401)

        try:
            refresh = RefreshToken(refresh_token)
        except Exception:
            response = error_response(
                message="رفرش توکن نامعتبر یا منقضی است.",
                status_code=401,
            )
            return clear_auth_cookies(response)

        tokens = {"access": str(refresh.access_token), "refresh": str(refresh)}
        response = success_response(message="توکن بروزرسانی شد.")
        return set_auth_cookies(response, tokens["access"], tokens["refresh"])
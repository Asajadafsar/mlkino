from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.services.jibit import (
    JibitError,
    normalize_postal_code,
)
from accounts.validators import (
    validate_iranian_mobile,
    validate_iranian_national_code,
)

User = get_user_model()


def build_tokens_for_user(user, request=None) -> dict:
    refresh = RefreshToken.for_user(user)
    from accounts.sessions import create_device_session
    create_device_session(user, refresh, request)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


# ==================================================================
# User — خواندن
# ==================================================================
class UserSerializer(serializers.ModelSerializer):
    agency_profile = serializers.SerializerMethodField()
    expert_profile = serializers.SerializerMethodField()

    def get_agency_profile(self, obj):
        from panel.serializers import role_profile_data
        return role_profile_data(obj, self.context).get("agency_profile")

    def get_expert_profile(self, obj):
        from panel.serializers import role_profile_data
        return role_profile_data(obj, self.context).get("expert_profile")
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    account_status_display = serializers.CharField(
        source="get_account_status_display", read_only=True
    )
    verification_status_display = serializers.CharField(
        source="get_verification_status_display", read_only=True
    )
    user_type_display = serializers.CharField(
        source="get_user_type_display", read_only=True
    )
    full_name = serializers.CharField(read_only=True)
    has_profile = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "agency_profile", "expert_profile",
            "id", "phone", "email", "first_name", "last_name", "full_name",
            "national_code", "birth_date", "avatar",
            "province", "city", "postal_code", "address",
            "user_type", "user_type_display",
            "role", "role_display",
            "account_status", "account_status_display",
            "phone_verified", "national_code_verified",
            "verification_status", "verification_status_display",
            "has_profile", "admin_level", "is_active",
            "last_login", "date_joined", "profile_updated_at",
        ]
        read_only_fields = fields


# ==================================================================
# OTP
# ==================================================================
class SendOtpSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, validators=[validate_iranian_mobile])

    def validate_phone(self, value):
        return validate_iranian_mobile(value)


class VerifyOtpSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, validators=[validate_iranian_mobile])
    code = serializers.CharField(min_length=4, max_length=6)

    def validate_phone(self, value):
        return validate_iranian_mobile(value)




class CompleteRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    national_code = serializers.CharField(
        max_length=10,
        validators=[validate_iranian_national_code],
    )

    birth_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    avatar = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    postal_code = serializers.CharField(
        max_length=10,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    user_type = serializers.ChoiceField(
        choices=User.UserType.choices,
    )

    def validate_postal_code(self, value):
        try:
            return normalize_postal_code(value)
        except JibitError as exc:
            raise serializers.ValidationError(
                str(exc)
            ) from exc

    def validate_national_code(self, value):
        return validate_iranian_national_code(value)

    def validate(self, attrs):
        user = self.context["request"].user

        if user.has_profile:
            raise serializers.ValidationError(
                "پروفایل شما قبلاً تکمیل شده است."
            )

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm":
                    "رمز عبور و تکرار آن یکسان نیستند."
            })

        if User.objects.filter(
            national_code=attrs["national_code"]
        ).exclude(
            pk=user.pk
        ).exists():
            raise serializers.ValidationError({
                "national_code":
                    "این کد ملی قبلاً ثبت شده است."
            })

        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        user = self.context["request"].user
        data = self.validated_data

        postal = self.context["postal_address"]

        user.first_name = data["first_name"]
        user.last_name = data["last_name"]
        user.national_code = data["national_code"]
        user.birth_date = data.get("birth_date")

        if data.get("avatar"):
            user.avatar = data["avatar"]

        user.postal_code = postal["postal_code"]
        user.province = postal["province"]
        user.city = postal["city"]
        user.address = postal["address"]

        user.user_type = data["user_type"]
        user.set_password(data["password"])

        user.role = User.Role.USER
        user.national_code_verified = True
        user.verification_status = (
            User.VerificationStatus.VERIFIED
        )

        user.save()

        return user



# ==================================================================
# ورود با رمز
# ==================================================================

class PasswordLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(
        max_length=11,
        validators=[validate_iranian_mobile],
    )

    password = serializers.CharField(
        write_only=True,
        min_length=6,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        phone = validate_iranian_mobile(attrs["phone"])
        password = attrs["password"]

        user = User.objects.filter(phone=phone).first()

        if user is None:
            raise serializers.ValidationError(
                {
                    "phone": [
                        serializers.ErrorDetail(
                            "کاربری با این شماره ثبت‌نام نکرده است.",
                            code="user_not_registered",
                        )
                    ]
                }
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                {
                    "password": [
                        serializers.ErrorDetail(
                            "رمز عبور اشتباه است.",
                            code="invalid_password",
                        )
                    ]
                }
            )

        attrs["user"] = user
        return attrs



# ==================================================================
# تغییر رمز
# ==================================================================
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("رمز عبور فعلی اشتباه است.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "رمز جدید و تکرار آن یکسان نیستند."}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# ==================================================================
# فراموشی رمز — مرحله ۱: ارسال OTP
# ==================================================================
class PasswordResetSendOtpSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, validators=[validate_iranian_mobile])

    def validate_phone(self, value):
        value = validate_iranian_mobile(value)
        if not User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("کاربری با این شماره یافت نشد.")
        return value


# ==================================================================
# فراموشی رمز — مرحله ۲: تایید OTP
# ==================================================================
class PasswordResetVerifyOtpSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, validators=[validate_iranian_mobile])
    code = serializers.CharField(min_length=4, max_length=6)

    def validate_phone(self, value):
        return validate_iranian_mobile(value)


# ==================================================================
# فراموشی رمز — مرحله ۳: رمز جدید
# ==================================================================
class PasswordResetCompleteSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "رمز جدید و تکرار آن یکسان نیستند."}
            )
        return attrs



# ==================================================================
# لاگین با OTP (فقط برای کاربران ثبت‌نام‌شده)
# ==================================================================
class LoginOtpSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, validators=[validate_iranian_mobile])
    code = serializers.CharField(min_length=4, max_length=6)

    def validate_phone(self, value):
        return validate_iranian_mobile(value)




# ==================================================================
# PROFILE UPDATE — PUT
# ==================================================================


class ProfileUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    birth_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    postal_code = serializers.CharField(
        required=False, allow_blank=True, allow_null=True,
        max_length=10,
    )

    class Meta:
        model = User

        fields = [
            "first_name",
            "last_name",
            "email",
            "birth_date",
            "avatar",
            "postal_code",
        ]

        extra_kwargs = {
            "first_name": {
                "required": False,
                "allow_blank": False,
            },
            "last_name": {
                "required": False,
                "allow_blank": False,
            },
        }

    def validate_avatar(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('حجم عکس باید کمتر از ۵ مگابایت باشد.')
        return value

    def validate_first_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "نام باید حداقل ۲ کاراکتر باشد."
            )

        return value

    def validate_last_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "نام خانوادگی باید حداقل ۲ کاراکتر باشد."
            )

        return value

    def validate_email(self, value):
        if not value:
            return None

        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exclude(
            pk=self.instance.pk
        ).exists():
            raise serializers.ValidationError(
                "این ایمیل قبلاً ثبت شده است."
            )

        return value

    def validate_postal_code(self, value):
        if not value: return None
        try:
            return normalize_postal_code(value)
        except JibitError as exc:
            raise serializers.ValidationError(
                str(exc)
            ) from exc

    @transaction.atomic
    def update(self, instance, validated_data):
        postal = self.context.get("postal_address")

        if (
            validated_data.get("postal_code") is not None
            and postal is None
        ):
            raise serializers.ValidationError({
                "postal_code":
                    "استعلام کد پستی انجام نشده است."
            })

        for field, value in validated_data.items():
            if field != "postal_code":
                setattr(instance, field, value)

        if 'postal_code' in validated_data and validated_data['postal_code'] is None:
            instance.postal_code = instance.province = instance.city = instance.address = None
        if postal:
            instance.postal_code = postal["postal_code"]
            instance.province = postal["province"]
            instance.city = postal["city"]
            instance.address = postal["address"]

        instance.save()

        return instance


class PostalLookupSerializer(serializers.Serializer):
    postal_code = serializers.CharField(
        max_length=10,
    )

    def validate_postal_code(self, value):
        try:
            return normalize_postal_code(value)
        except JibitError as exc:
            raise serializers.ValidationError(
                str(exc)
            ) from exc

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.validators import (
    validate_iranian_mobile,
    validate_iranian_national_code,
)

User = get_user_model()


def build_tokens_for_user(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


# ==================================================================
# User — خواندن
# ==================================================================
class UserSerializer(serializers.ModelSerializer):
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
            "id", "phone", "email", "first_name", "last_name", "full_name",
            "national_code", "birth_date", "avatar",
            "province", "city", "postal_code", "address",
            "user_type", "user_type_display",
            "role", "role_display",
            "account_status", "account_status_display",
            "phone_verified", "national_code_verified",
            "verification_status", "verification_status_display",
            "has_profile", "admin_level", "is_active",
            "last_login", "date_joined",
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


# ==================================================================
# تکمیل ثبت‌نام (کاربر عادی)
# ==================================================================
class CompleteRegisterSerializer(serializers.Serializer):
    # شخصی
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    national_code = serializers.CharField(
        max_length=10, validators=[validate_iranian_national_code]
    )
    birth_date = serializers.DateField(required=False, allow_null=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    # مکان
    province = serializers.CharField(max_length=50)
    city = serializers.CharField(max_length=50)
    postal_code = serializers.CharField(max_length=10)
    address = serializers.CharField()

    # رمز
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    # نوع
    user_type = serializers.ChoiceField(choices=User.UserType.choices)

    def validate_national_code(self, value):
        return validate_iranian_national_code(value)

    def validate(self, attrs):
        user = self.context["request"].user

        if user.has_profile:
            raise serializers.ValidationError("پروفایل شما قبلاً تکمیل شده است.")

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "رمز عبور و تکرار آن یکسان نیستند."}
            )

        if (
            User.objects.filter(national_code=attrs["national_code"])
            .exclude(pk=user.pk)
            .exists()
        ):
            raise serializers.ValidationError(
                {"national_code": "این کد ملی قبلاً ثبت شده است."}
            )

        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        user = self.context["request"].user
        d = self.validated_data

        user.first_name = d["first_name"]
        user.last_name = d["last_name"]
        user.national_code = d["national_code"]
        user.birth_date = d.get("birth_date")
        if d.get("avatar"):
            user.avatar = d["avatar"]
        user.province = d["province"]
        user.city = d["city"]
        user.postal_code = d["postal_code"]
        user.address = d["address"]
        user.user_type = d["user_type"]
        user.set_password(d["password"])
        user.role = User.Role.USER
        user.national_code_verified = True
        user.verification_status = User.VerificationStatus.VERIFIED
        user.save()

        return user


# ==================================================================
# ورود با رمز
# ==================================================================
class PasswordLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, validators=[validate_iranian_mobile])
    password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, attrs):
        phone = validate_iranian_mobile(attrs["phone"])
        password = attrs["password"]

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            raise serializers.ValidationError("شماره یا رمز عبور اشتباه است.")

        if not user.check_password(password):
            raise serializers.ValidationError("شماره یا رمز عبور اشتباه است.")

        if not user.is_active or user.account_status == User.AccountStatus.SUSPENDED:
            raise serializers.ValidationError("حساب کاربری فعال نیست.")

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
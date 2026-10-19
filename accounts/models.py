import os

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

from accounts.validators import (
    validate_iranian_mobile,
    validate_iranian_national_code,
)


# ==================================================================
# Avatar upload path — بر اساس شماره موبایل
# ==================================================================
def user_avatar_path(instance, filename):
    """
    مسیر ذخیره عکس پروفایل:
    avatars/<phone>/<phone>.<ext>
    """
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    phone = instance.phone or "unknown"
    return f"avatars/{phone}/{phone}{ext}"


# ==================================================================
# Managers
# ==================================================================
class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, phone, password, **extra_fields):
        if not phone:
            raise ValueError("شماره موبایل الزامی است.")
        phone = validate_iranian_mobile(phone)
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(phone, password, **extra_fields)

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.SUPER_ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("سوپر یوزر باید is_staff=True باشد.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("سوپر یوزر باید is_superuser=True باشد.")

        return self._create_user(phone, password, **extra_fields)


# ==================================================================
# User
# ==================================================================
class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "superadmin", "سوپر ادمین"
        USER = "user", "کاربر"

    class AccountStatus(models.TextChoices):
        ACTIVE = "active", "فعال"
        INACTIVE = "inactive", "غیرفعال"
        SUSPENDED = "suspended", "تعلیق‌شده"

    class VerificationStatus(models.TextChoices):
        NOT_STARTED = "not_started", "شروع نشده"
        PENDING = "pending", "در انتظار بررسی"
        VERIFIED = "verified", "تأیید شده"
        REJECTED = "rejected", "رد شده"

    class UserType(models.TextChoices):
        CONSUMER = "consumer", "مصرف‌کننده"
        INVESTOR = "investor", "سرمایه‌گذار"

    username = None
    email = models.EmailField(blank=True, null=True, verbose_name="ایمیل")

    # فیلدهای شخصی
    phone = models.CharField(
        max_length=11,
        unique=True,
        validators=[validate_iranian_mobile],
        verbose_name="شماره موبایل",
    )
    national_code = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        validators=[validate_iranian_national_code],
        verbose_name="کد ملی",
    )
    birth_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تولد")
    avatar = models.ImageField(
        upload_to=user_avatar_path,
        null=True,
        blank=True,
        verbose_name="عکس پروفایل",
    )

    # مکان
    province = models.CharField(max_length=50, blank=True, null=True, verbose_name="استان")
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name="شهر")
    postal_code = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        validators=[RegexValidator(r"^\d{10}$", "کد پستی باید ۱۰ رقم باشد.")],
        verbose_name="کد پستی",
    )
    address = models.TextField(blank=True, null=True, verbose_name="آدرس")

    # نوع کاربر
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.CONSUMER,
        verbose_name="نوع کاربر",
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
        verbose_name="نقش",
    )

    # وضعیت‌ها
    account_status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
        verbose_name="وضعیت حساب",
    )
    phone_verified = models.BooleanField(default=False, verbose_name="موبایل تایید شده")
    national_code_verified = models.BooleanField(
        default=False, verbose_name="کد ملی تایید شده"
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED,
        verbose_name="وضعیت احراز هویت",
    )

    admin_level = models.CharField(
        max_length=20, blank=True, null=True, verbose_name="سطح دسترسی مدیریتی"
    )

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"

    def __str__(self):
        return self.phone or f"User #{self.pk}"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.SUPER_ADMIN
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def has_profile(self):
        """آیا کاربر پروفایل کامل دارد؟"""
        return bool(self.national_code and self.province and self.city)


# ==================================================================
# OtpToken
# ==================================================================
class OtpToken(models.Model):
    class Purpose(models.TextChoices):
        LOGIN = "login", "ورود/ثبت‌نام"
        PHONE_VERIFY = "phone_verify", "تایید شماره موبایل"

    phone = models.CharField(
        max_length=11, validators=[validate_iranian_mobile], verbose_name="شماره موبایل"
    )
    code = models.CharField(max_length=6, verbose_name="کد OTP")
    purpose = models.CharField(
        max_length=20, choices=Purpose.choices, default=Purpose.LOGIN, verbose_name="هدف"
    )
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField(verbose_name="زمان انقضا")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "کد یکبار مصرف"
        verbose_name_plural = "کدهای یکبار مصرف"
        indexes = [models.Index(fields=["phone", "purpose", "is_used"])]

    def __str__(self):
        return f"{self.phone} - {self.code}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired



import uuid


class PasswordResetToken(models.Model):
    """
    توکن کوتاه‌مدت برای تکمیل فراموشی رمز.
    بعد از تایید OTP ساخته می‌شه و ۱۰ دقیقه اعتبار داره.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name="کاربر",
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_used = models.BooleanField(default=False, verbose_name="استفاده شده")
    expires_at = models.DateTimeField(verbose_name="زمان انقضا")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "توکن بازیابی رمز"
        verbose_name_plural = "توکن‌های بازیابی رمز"
        indexes = [models.Index(fields=["token", "is_used"])]

    def __str__(self):
        return f"{self.user.phone} - {self.token}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired
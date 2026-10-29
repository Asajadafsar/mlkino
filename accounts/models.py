
import os
import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q, F
from django.utils import timezone

from accounts.validators import (
    validate_iranian_mobile,
    validate_iranian_national_code,
)


# ============================================================
# AVATAR
# ============================================================

def user_avatar_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    phone = instance.phone or "unknown"
    return f"avatars/{phone}/{phone}{ext}"


# ============================================================
# USER MANAGER
# ============================================================

class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, phone, password, **extra_fields):
        if not phone:
            raise ValueError("شماره موبایل الزامی است.")

        phone = validate_iranian_mobile(phone)

        user = self.model(
            phone=phone,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_user(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        return self._create_user(
            phone,
            password,
            **extra_fields,
        )

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault(
            "role",
            User.Role.SUPER_ADMIN,
        )

        if extra_fields.get("is_staff") is not True:
            raise ValueError("سوپر یوزر باید is_staff=True باشد.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("سوپر یوزر باید is_superuser=True باشد.")

        return self._create_user(
            phone,
            password,
            **extra_fields,
        )


# ============================================================
# USER
# ============================================================

class User(AbstractUser):

    class Role(models.TextChoices):
        SUPER_ADMIN = "superadmin", "سوپر ادمین"
        AGENCY = "agency", "املاکی"
        EXPERT = "expert", "کارشناس املاک"
        USER = "user", "کاربر عادی"

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

    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="ایمیل",
    )

    # Personal information

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

    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="تاریخ تولد",
    )

    avatar = models.ImageField(
        upload_to=user_avatar_path,
        null=True,
        blank=True,
        verbose_name="عکس پروفایل",
    )

    # Location

    province = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="استان",
    )

    city = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="شهر",
    )

    postal_code = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                r"^\d{10}$",
                "کد پستی باید ۱۰ رقم باشد.",
            )
        ],
        verbose_name="کد پستی",
    )

    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="آدرس",
    )

    # User type

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
        db_index=True,
        verbose_name="نقش",
    )

    # Status

    account_status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
        verbose_name="وضعیت حساب",
    )

    phone_verified = models.BooleanField(
        default=False,
        verbose_name="موبایل تایید شده",
    )

    national_code_verified = models.BooleanField(
        default=False,
        verbose_name="کد ملی تایید شده",
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED,
        verbose_name="وضعیت احراز هویت",
    )

    admin_level = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="سطح دسترسی مدیریتی",
    )

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"
        indexes = [
            models.Index(
                fields=["role", "account_status"],
                name="user_role_status_idx",
            ),
        ]

    def __str__(self):
        return self.phone or f"User #{self.pk}"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.SUPER_ADMIN

            update_fields = kwargs.get("update_fields")
            if update_fields is not None:
                kwargs["update_fields"] = set(
                    update_fields
                ) | {"role"}

        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def has_profile(self):
        return bool(
            self.national_code
            and self.province
            and self.city
        )

    @property
    def is_agency(self):
        return self.role == self.Role.AGENCY

    @property
    def is_expert(self):
        return self.role == self.Role.EXPERT

    @property
    def is_super_admin(self):
        return (
            self.is_superuser
            or self.role == self.Role.SUPER_ADMIN
        )


# ============================================================
# AGENCY EXPERT
# ============================================================

class AgencyExpert(models.Model):
    """
    ارتباط کارشناس با دفتر املاک.

    هر املاکی می‌تواند چند کارشناس داشته باشد.
    هر کارشناس در هر لحظه به یک دفتر متصل است.
    """

    agency = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="agency_experts",
        verbose_name="املاکی",
    )

    expert = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="agency_membership",
        verbose_name="کارشناس",
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="عضویت فعال",
    )

    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ عضویت",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین تغییر",
    )

    class Meta:
        verbose_name = "کارشناس دفتر املاک"
        verbose_name_plural = "کارشناسان دفاتر املاک"
        ordering = ["-joined_at"]

        constraints = [
            models.CheckConstraint(
                condition=~Q(agency=F("expert")),
                name="agency_expert_not_same",
            ),
        ]

        indexes = [
            models.Index(
                fields=["agency", "is_active"],
                name="agency_expert_active_idx",
            ),
        ]

    def clean(self):
        super().clean()

        errors = {}

        if self.agency_id and self.expert_id:
            if self.agency_id == self.expert_id:
                errors["expert"] = (
                    "املاکی و کارشناس نمی‌توانند یک نفر باشند."
                )

        if self.agency_id:
            if self.agency.role != User.Role.AGENCY:
                errors["agency"] = (
                    "کاربر انتخاب‌شده نقش املاکی ندارد."
                )

        if self.expert_id:
            if self.expert.role != User.Role.EXPERT:
                errors["expert"] = (
                    "کاربر انتخاب‌شده نقش کارشناس ندارد."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.expert.full_name or self.expert.phone}"
            f" - "
            f"{self.agency.full_name or self.agency.phone}"
        )


# ============================================================
# OTP TOKEN
# ============================================================

class OtpToken(models.Model):

    class Purpose(models.TextChoices):
        LOGIN = "login", "ورود/ثبت‌نام"
        PHONE_VERIFY = "phone_verify", "تایید شماره موبایل"

    phone = models.CharField(
        max_length=11,
        validators=[validate_iranian_mobile],
        verbose_name="شماره موبایل",
    )

    code = models.CharField(
        max_length=6,
        verbose_name="کد OTP",
    )

    purpose = models.CharField(
        max_length=20,
        choices=Purpose.choices,
        default=Purpose.LOGIN,
        verbose_name="هدف",
    )

    is_used = models.BooleanField(
        default=False,
    )

    attempts = models.PositiveSmallIntegerField(
        default=0,
    )

    expires_at = models.DateTimeField(
        verbose_name="زمان انقضا",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "کد یکبار مصرف"
        verbose_name_plural = "کدهای یکبار مصرف"
        indexes = [
            models.Index(
                fields=["phone", "purpose", "is_used"]
            )
        ]

    def __str__(self):
        return f"{self.phone} - {self.code}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired


# ============================================================
# PASSWORD RESET TOKEN
# ============================================================

class PasswordResetToken(models.Model):
    """
    توکن کوتاه‌مدت بازیابی رمز عبور.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name="کاربر",
    )

    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    is_used = models.BooleanField(
        default=False,
        verbose_name="استفاده شده",
    )

    expires_at = models.DateTimeField(
        verbose_name="زمان انقضا",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "توکن بازیابی رمز"
        verbose_name_plural = "توکن‌های بازیابی رمز"
        indexes = [
            models.Index(
                fields=["token", "is_used"]
            )
        ]

    def __str__(self):
        return f"{self.user.phone} - {self.token}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired


# ============================================================
# ANNOUNCEMENT
# ============================================================

class Announcement(models.Model):

    class Status(models.TextChoices):
        DRAFT = "draft", "پیش‌نویس"
        PUBLISHED = "published", "منتشر شده"
        ARCHIVED = "archived", "بایگانی"

    title = models.CharField(
        max_length=255,
        verbose_name="عنوان",
    )

    description = models.TextField(
        verbose_name="توضیحات",
    )

    link = models.URLField(
        blank=True,
        null=True,
        verbose_name="لینک",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="وضعیت",
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements_created",
        verbose_name="ایجاد شده توسط",
    )

    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements_updated",
        verbose_name="آخرین ویرایش توسط",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "اطلاعیه"
        verbose_name_plural = "اطلاعیه‌ها"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status", "-created_at"]
            )
        ]

    def __str__(self):
        return f"{self.id} - {self.title}"


# ============================================================
# GLOBAL HTTP ACTIVITY AUDIT
# ============================================================
class ActivityLog(models.Model):
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    actor = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs")
    real_actor = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs_as_admin")
    impersonation_session = models.ForeignKey("panel.ImpersonationSession", null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs")
    event = models.CharField(max_length=60, default="http.request", db_index=True)
    category = models.CharField(max_length=40, default="http", db_index=True)
    method = models.CharField(max_length=12, blank=True)
    path = models.CharField(max_length=500)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    request_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["category", "created_at"]), models.Index(fields=["actor", "created_at"])]


# Role-specific details: do not duplicate fields already present on User.
class AgencyProfile(models.Model):
    class Occupancy(models.TextChoices):
        OWNER = "owner", "مالک"
        TENANT = "tenant", "مستأجر"

    manager = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="agency_profile")
    agency_name = models.CharField(max_length=200)
    occupancy_type = models.CharField(max_length=10, choices=Occupancy.choices)
    lease_end_date = models.DateField(null=True, blank=True)
    logo = models.ImageField(upload_to="agencies/logos/", null=True, blank=True)
    has_business_license = models.BooleanField(default=False)
    license_number = models.CharField(max_length=100, blank=True)
    license_image = models.ImageField(upload_to="agencies/licenses/", null=True, blank=True)
    class MaritalStatus(models.TextChoices):
        SINGLE = "single", "مجرد"
        MARRIED = "married", "متأهل"
    marital_status = models.CharField(max_length=10, choices=MaritalStatus.choices, blank=True)
    landline = models.CharField(max_length=20, blank=True)
    office_address = models.TextField()
    office_verification_status = models.CharField(max_length=20, choices=User.VerificationStatus.choices, default=User.VerificationStatus.NOT_STARTED)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.agency_name


class ExpertProfile(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="expert_profile")
    expert_code = models.CharField(max_length=40, unique=True, null=True, blank=True)
    job_title = models.CharField(max_length=150, blank=True)
    specialties = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    professional_document = models.FileField(upload_to="experts/documents/", null=True, blank=True)
    job_details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.full_name or self.user.phone

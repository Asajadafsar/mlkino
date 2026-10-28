
from rest_framework import serializers

from accounts.models import Announcement


# ============================================================
# LIST SERIALIZER
# ============================================================

class AnnouncementListSerializer(serializers.ModelSerializer):

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True,
    )

    created_by_role = serializers.CharField(
        source="created_by.role",
        read_only=True,
    )

    created_by_role_display = serializers.CharField(
        source="created_by.get_role_display",
        read_only=True,
    )

    updated_by_name = serializers.CharField(
        source="updated_by.full_name",
        read_only=True,
    )

    updated_by_role = serializers.CharField(
        source="updated_by.role",
        read_only=True,
    )

    updated_by_role_display = serializers.CharField(
        source="updated_by.get_role_display",
        read_only=True,
    )

    class Meta:
        model = Announcement

        fields = [
            "id",
            "title",
            "status",
            "status_display",
            "created_by_name",
            "created_by_role",
            "created_by_role_display",
            "updated_by_name",
            "updated_by_role",
            "updated_by_role_display",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


# ============================================================
# DETAIL SERIALIZER
# ============================================================

class AnnouncementDetailSerializer(serializers.ModelSerializer):

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True,
    )

    created_by_role = serializers.CharField(
        source="created_by.role",
        read_only=True,
    )

    created_by_role_display = serializers.CharField(
        source="created_by.get_role_display",
        read_only=True,
    )

    updated_by_name = serializers.CharField(
        source="updated_by.full_name",
        read_only=True,
    )

    updated_by_role = serializers.CharField(
        source="updated_by.role",
        read_only=True,
    )

    updated_by_role_display = serializers.CharField(
        source="updated_by.get_role_display",
        read_only=True,
    )

    class Meta:
        model = Announcement

        fields = [
            "id",
            "title",
            "description",
            "link",
            "status",
            "status_display",
            "created_by_name",
            "created_by_role",
            "created_by_role_display",
            "updated_by_name",
            "updated_by_role",
            "updated_by_role_display",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


# ============================================================
# CREATE SERIALIZER
# ============================================================

class AnnouncementCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Announcement

        fields = [
            "title",
            "description",
            "link",
            "status",
        ]

    def validate_title(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "عنوان باید حداقل ۳ کاراکتر باشد."
            )

        return value

    def validate_description(self, value):
        value = value.strip()

        if len(value) < 5:
            raise serializers.ValidationError(
                "توضیحات باید حداقل ۵ کاراکتر باشد."
            )

        return value


# ============================================================
# UPDATE SERIALIZER
# ============================================================

class AnnouncementUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Announcement

        fields = [
            "title",
            "description",
            "link",
            "status",
        ]

        extra_kwargs = {
            "title": {
                "required": False,
            },
            "description": {
                "required": False,
            },
            "link": {
                "required": False,
            },
            "status": {
                "required": False,
            },
        }




# ============================================================
# ADMIN USER MANAGEMENT SERIALIZERS
# ============================================================

from django.contrib.auth import get_user_model

User = get_user_model()


class PanelUserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    user_type_display = serializers.SerializerMethodField()
    account_status_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "role_display",
            "user_type",
            "user_type_display",
            "account_status",
            "account_status_display",
            "verification_status",
            "phone_verified",
            "national_code_verified",
            "is_active",
            "has_profile",
            "date_joined",
            "last_login",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return (
            f"{obj.first_name or ''} {obj.last_name or ''}"
        ).strip()

    def get_role_display(self, obj):
        return obj.get_role_display()

    def get_user_type_display(self, obj):
        return obj.get_user_type_display()

    def get_account_status_display(self, obj):
        return obj.get_account_status_display()


class PanelUserDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    user_type_display = serializers.SerializerMethodField()
    account_status_display = serializers.SerializerMethodField()
    verification_status_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "national_code",
            "birth_date",
            "avatar",
            "province",
            "city",
            "postal_code",
            "address",
            "user_type",
            "user_type_display",
            "role",
            "role_display",
            "account_status",
            "account_status_display",
            "verification_status",
            "verification_status_display",
            "phone_verified",
            "national_code_verified",
            "is_active",
            "is_staff",
            "is_superuser",
            "admin_level",
            "has_profile",
            "last_login",
            "date_joined",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return (
            f"{obj.first_name or ''} {obj.last_name or ''}"
        ).strip()

    def get_role_display(self, obj):
        return obj.get_role_display()

    def get_user_type_display(self, obj):
        return obj.get_user_type_display()

    def get_account_status_display(self, obj):
        return obj.get_account_status_display()

    def get_verification_status_display(self, obj):
        return obj.get_verification_status_display()


class PanelUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "national_code",
            "birth_date",
            "province",
            "city",
            "postal_code",
            "address",
            "user_type",
            "role",
            "account_status",
            "verification_status",
            "phone_verified",
            "national_code_verified",
            "is_active",
        ]

        extra_kwargs = {
            field: {"required": False}
            for field in fields
        }

    def validate_first_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                "نام نمی‌تواند خالی باشد."
            )
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                "نام خانوادگی نمی‌تواند خالی باشد."
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

    def validate_role(self, value):
        request = self.context.get("request")

        if not request or not (
            request.user.is_superuser
            or request.user.role == User.Role.SUPER_ADMIN
        ):
            raise serializers.ValidationError(
                "فقط سوپرادمین می‌تواند نقش کاربران را تغییر دهد."
            )

        if self.instance.is_superuser and value != User.Role.SUPER_ADMIN:
            raise serializers.ValidationError(
                "نقش سوپریوزر قابل تغییر نیست."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if not request:
            raise serializers.ValidationError(
                "اطلاعات درخواست موجود نیست."
            )

        is_admin = (
            request.user.is_superuser
            or request.user.role == User.Role.SUPER_ADMIN
        )

        if not is_admin:
            allowed_fields = {
                "first_name",
                "last_name",
                "email",
            }

            forbidden = set(attrs) - allowed_fields

            if forbidden:
                raise serializers.ValidationError(
                    "املاکی فقط مجاز به ویرایش اطلاعات پایه کارشناسان خود است."
                )

        if self.instance.pk == request.user.pk:
            if attrs.get("is_active") is False:
                raise serializers.ValidationError(
                    "نمی‌توانید حساب خودتان را غیرفعال کنید."
                )

            if (
                "role" in attrs
                and attrs["role"] != User.Role.SUPER_ADMIN
                and is_admin
            ):
                raise serializers.ValidationError(
                    "نمی‌توانید نقش مدیریتی خودتان را تغییر دهید."
                )

        return attrs


# ============================================================
# IMPORTANT TASK SERIALIZERS
# ============================================================

from .models import ImportantTask, TaskAssignment


class AssigneeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskAssignment
        fields = [
            "id",
            "assignee",
            "full_name",
            "status",
            "completed_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        user = obj.assignee
        name = (
            f"{user.first_name or ''} "
            f"{user.last_name or ''}"
        ).strip()

        return name or str(getattr(user, "phone", user.pk))


class TaskReadSerializer(serializers.ModelSerializer):
    assignments = AssigneeSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ImportantTask
        fields = [
            "id",
            "title",
            "description",
            "due_date",
            "created_by",
            "created_at",
            "updated_at",
            "assignments",
        ]
        read_only_fields = fields


class TaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(
        max_length=200,
        trim_whitespace=True,
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    due_date = serializers.DateField(required=False)
    assignee_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
        required=False,
    )
    all_assignees = serializers.BooleanField(default=False)

    def validate(self, attrs):
        all_assignees = attrs.get("all_assignees", False)
        assignee_ids = attrs.get("assignee_ids")

        if all_assignees and assignee_ids:
            raise serializers.ValidationError(
                "یکی از assignee_ids یا all_assignees را ارسال کنید."
            )

        if not all_assignees and not assignee_ids:
            raise serializers.ValidationError(
                "حداقل یک دریافت‌کننده انتخاب کنید."
            )

        if assignee_ids and len(set(assignee_ids)) != len(assignee_ids):
            raise serializers.ValidationError(
                "شناسه دریافت‌کننده تکراری است."
            )

        return attrs


class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportantTask
        fields = ["title", "description", "due_date"]


class TaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=TaskAssignment.Status.choices
    )


class AgencyExpertLinkSerializer(serializers.Serializer):
    agency_id = serializers.IntegerField(min_value=1)
    expert_id = serializers.IntegerField(min_value=1)


from accounts.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True, allow_null=True)
    real_actor_name = serializers.CharField(source="real_actor.full_name", read_only=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "request_id", "created_at", "actor", "actor_name", "real_actor", "real_actor_name",
                  "impersonation_session", "event", "category", "method", "path", "status_code",
                  "duration_ms", "ip_address", "user_agent", "metadata"]
        read_only_fields = fields


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

    agency_profile = serializers.SerializerMethodField()
    expert_profile = serializers.SerializerMethodField()

    def get_agency_profile(self, obj):
        return role_profile_data(obj, self.context).get("agency_profile")

    def get_expert_profile(self, obj):
        return role_profile_data(obj, self.context).get("expert_profile")

    class Meta:
        model = User
        fields = [
            "agency_profile", "expert_profile",
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
            "is_staff",
            "has_profile",
            "date_joined", "profile_updated_at",
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

    agency_profile = serializers.SerializerMethodField()
    expert_profile = serializers.SerializerMethodField()

    def get_agency_profile(self, obj):
        return role_profile_data(obj, self.context).get("agency_profile")

    def get_expert_profile(self, obj):
        return role_profile_data(obj, self.context).get("expert_profile")

    class Meta:
        model = User
        fields = [
            "agency_profile", "expert_profile",
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
            "date_joined", "profile_updated_at",
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
            "admin_level",
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
    created_by = serializers.SerializerMethodField()
    created_by_id = serializers.IntegerField(read_only=True)
    status = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
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
            "created_by", "created_by_id", "status", "status_display",
            "created_at",
            "updated_at",
            "assignments",
        ]
        read_only_fields = fields

    def get_created_by(self, obj):
        return obj.created_by.full_name or obj.created_by.phone

    def get_status(self, obj):
        statuses = [a.status for a in obj.assignments.all()]
        if not statuses:
            return TaskAssignment.Status.PENDING
        if all(s == TaskAssignment.Status.DONE for s in statuses):
            return TaskAssignment.Status.DONE
        if any(s in (TaskAssignment.Status.DONE, TaskAssignment.Status.IN_PROGRESS) for s in statuses):
            return TaskAssignment.Status.IN_PROGRESS
        return TaskAssignment.Status.PENDING

    def get_status_display(self, obj):
        return dict(TaskAssignment.Status.choices).get(self.get_status(obj))


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
    action = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    target_type = serializers.SerializerMethodField()
    target_id = serializers.SerializerMethodField()
    changes = serializers.SerializerMethodField()

    def _info(self, obj):
        from panel.views import describe_http_activity
        return describe_http_activity(obj)

    def get_action(self, obj):
        return self._info(obj)["action"]

    def get_action_display(self, obj):
        return self._info(obj)["action_display"]

    def get_description(self, obj):
        return self._info(obj)["description"]

    def get_target_type(self, obj):
        return self._info(obj)["target_type"]

    def get_target_id(self, obj):
        return self._info(obj)["target_id"]

    def get_changes(self, obj):
        return self._info(obj)["changes"]

    actor_name = serializers.CharField(source="actor.full_name", read_only=True, allow_null=True)
    real_actor_name = serializers.CharField(source="real_actor.full_name", read_only=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "request_id", "created_at", "actor", "actor_name", "real_actor", "real_actor_name",
                  "impersonation_session", "event", "category", "method", "path", "status_code",
                  "duration_ms", "ip_address", "user_agent", "metadata", "action", "action_display", "description", "target_type", "target_id", "changes"]
        read_only_fields = fields


# Role-specific read/write payloads
from accounts.models import AgencyProfile, ExpertProfile, AgencyExpert

class AgencyProfileSerializer(serializers.ModelSerializer):
    manager_id = serializers.IntegerField(read_only=True)
    manager_name = serializers.CharField(source="manager.full_name", read_only=True)
    class Meta:
        model = AgencyProfile
        fields = ["manager_id", "manager_name", "agency_name", "occupancy_type", "lease_end_date", "logo", "has_business_license", "license_number", "license_image", "marital_status", "landline", "office_address", "office_verification_status", "latitude", "longitude", "description"]
        read_only_fields = ["manager_id", "manager_name", "office_verification_status"]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and (request.user.is_superuser or request.user.role == User.Role.SUPER_ADMIN):
            fields['office_verification_status'].read_only = False
        return fields

    def validate(self, attrs):
        current = self.instance
        occupancy = attrs.get("occupancy_type", getattr(current, "occupancy_type", None))
        lease_end = attrs.get("lease_end_date", getattr(current, "lease_end_date", None))
        has_license = attrs.get("has_business_license", getattr(current, "has_business_license", False))
        number = attrs.get("license_number", getattr(current, "license_number", ""))
        license_image = attrs.get("license_image", getattr(current, "license_image", None))
        if occupancy == AgencyProfile.Occupancy.TENANT and not lease_end:
            raise serializers.ValidationError({"lease_end_date": "برای دفتر اجاره‌ای تاریخ پایان اجاره الزامی است."})
        if occupancy == AgencyProfile.Occupancy.OWNER and lease_end:
            attrs["lease_end_date"] = None
        if not has_license:
            if number or license_image:
                raise serializers.ValidationError({"has_business_license": "برای ثبت پروانه ابتدا داشتن پروانه را فعال کنید."})
            attrs["license_number"] = ""
            attrs["license_image"] = None
        return attrs


class ExpertProfileSerializer(serializers.ModelSerializer):
    def validate_expert_code(self, value):
        return value.strip() or None if value is not None else None

    agency_id = serializers.SerializerMethodField()
    agency_name = serializers.SerializerMethodField()
    class Meta:
        model = ExpertProfile
        fields = ["expert_code", "job_title", "specialties", "experience_years", "professional_document", "job_details", "agency_id", "agency_name"]
        read_only_fields = ["agency_id", "agency_name"]

    def get_agency_id(self, obj):
        link = AgencyExpert.objects.filter(expert=obj.user, is_active=True).first()
        return link.agency_id if link else None

    def get_agency_name(self, obj):
        link = AgencyExpert.objects.filter(expert=obj.user, is_active=True).select_related("agency").first()
        if not link:
            return None
        profile = AgencyProfile.objects.filter(manager=link.agency).first()
        return profile.agency_name if profile else link.agency.full_name


def role_profile_data(user, context=None):
    context = context or {}
    if user.role == User.Role.AGENCY:
        profile = AgencyProfile.objects.filter(manager=user).first()
        return {"agency_profile": AgencyProfileSerializer(profile, context=context).data if profile else None}
    if user.role == User.Role.EXPERT:
        profile = ExpertProfile.objects.filter(user=user).first()
        return {"expert_profile": ExpertProfileSerializer(profile, context=context).data if profile else None}
    return {}


# ============================================================
# SUPPORT TICKET SERIALIZERS
# ============================================================
from panel.models import SupportTicket, SupportTicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    attachment = serializers.SerializerMethodField()

    def get_attachment(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get("request")
        url = f"/panel/tickets/{obj.ticket_id}/messages/{obj.pk}/attachment/"
        return request.build_absolute_uri(url) if request else url

    author_name = serializers.CharField(source="author.full_name", read_only=True)
    class Meta:
        model = SupportTicketMessage
        fields = ["id", "author", "author_name", "body", "attachment", "is_internal", "created_at"]
        read_only_fields = fields


class TicketSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    creator_name = serializers.CharField(source="creator.full_name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True, allow_null=True)
    messages_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = SupportTicket
        fields = ["id", "creator", "creator_name", "assigned_to", "assigned_to_name", "category", "category_display", "subject", "status", "status_display", "created_at", "updated_at", "closed_at", "messages_count"]
        read_only_fields = fields


class TicketDetailSerializer(TicketSerializer):
    # Main attachment is the newest visible message attachment, for clients
    # expecting `data.attachment`. All attachments remain in `data.attachments`.
    attachment = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()

    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ["attachment", "attachments", "messages"]

    def _visible_messages(self, obj):
        if not hasattr(self, "_ticket_visible_messages"):
            qs = obj.messages.select_related("author").all()
            if not self.context.get("is_admin", False):
                qs = qs.filter(is_internal=False)
            self._ticket_visible_messages = list(qs)
        return self._ticket_visible_messages

    def _serialized_messages(self, obj):
        if not hasattr(self, "_ticket_serialized_messages"):
            self._ticket_serialized_messages = TicketMessageSerializer(
                self._visible_messages(obj), many=True, context=self.context
            ).data
        return self._ticket_serialized_messages

    def get_messages(self, obj):
        return self._serialized_messages(obj)

    def get_attachments(self, obj):
        return [
            {"message_id": msg["id"], "attachment": msg["attachment"]}
            for msg in self._serialized_messages(obj)
            if msg["attachment"] is not None
        ]

    def get_attachment(self, obj):
        files = self.get_attachments(obj)
        return files[-1]["attachment"] if files else None


def validate_ticket_upload(attrs):
    from pathlib import Path
    attachment = attrs.get("attachment")
    body = attrs.get("message", "").strip()
    if not body and not attachment:
        raise serializers.ValidationError({"message": "متن یا فایل الزامی است."})
    if attachment:
        if attachment.size > 10 * 1024 * 1024:
            raise serializers.ValidationError({"attachment": "حداکثر حجم فایل ۱۰ مگابایت است."})
        ext = Path(attachment.name).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx", ".xlsx", ".zip", ".txt", ".mp3", ".ogg", ".wav", ".m4a", ".webm"}:
            raise serializers.ValidationError({"attachment": "پسوند فایل مجاز نیست."})
    return attrs


class TicketCreateSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=SupportTicket.Category.choices)
    subject = serializers.CharField(max_length=200, min_length=3, trim_whitespace=True)
    message = serializers.CharField(min_length=2, max_length=20000, trim_whitespace=True, required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)

    def validate(self, attrs):
        return validate_ticket_upload(attrs)


class TicketReplySerializer(serializers.Serializer):
    message = serializers.CharField(min_length=2, max_length=20000, trim_whitespace=True, required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)
    is_internal = serializers.BooleanField(default=False)

    def validate(self, attrs):
        return validate_ticket_upload(attrs)


class TicketStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=SupportTicket.Status.choices)


class TicketAssignSerializer(serializers.Serializer):
    assigned_to = serializers.IntegerField(min_value=1, allow_null=True, required=True)


from panel.models import PersonalReminder, DirectConversation, DirectMessage, ChatReport

class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalReminder
        fields = ["id", "title", "description", "remind_at", "is_done", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class ChatMessageSerializer(serializers.ModelSerializer):
    attachment = serializers.SerializerMethodField()
    def get_attachment(self, obj):
        if not obj.attachment or obj.deleted_at:
            return None
        request = self.context.get("request")
        path = f"/panel/chats/{obj.conversation_id}/messages/{obj.pk}/attachment/"
        return request.build_absolute_uri(path) if request else path
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    class Meta:
        model = DirectMessage
        fields = ["id", "conversation", "sender", "sender_name", "body", "attachment", "attachment_kind", "reply_to", "created_at", "read_at", "deleted_at"]
        read_only_fields = ["id", "conversation", "sender", "sender_name", "created_at", "read_at", "deleted_at"]

class ChatConversationSerializer(serializers.ModelSerializer):
    peer = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    class Meta:
        model = DirectConversation
        fields = ["id", "peer", "last_message", "unread_count", "created_at", "updated_at"]
    def get_peer(self, obj):
        user = self.context["request"].user
        peer = obj.user2 if obj.user1_id == user.id else obj.user1
        return {"id": peer.pk, "full_name": peer.full_name, "avatar": self.context["request"].build_absolute_uri(peer.avatar.url) if peer.avatar else None, "role": peer.role}
    def get_last_message(self, obj):
        message = obj.messages.order_by("-id").first()
        return ChatMessageSerializer(message, context=self.context).data if message else None
    def get_unread_count(self, obj):
        return obj.messages.filter(read_at__isnull=True, deleted_at__isnull=True).exclude(sender=self.context["request"].user).count()

class ChatReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatReport
        fields = ["id", "reporter", "conversation", "message", "reason", "details", "status", "created_at", "reviewed_by", "reviewed_at"]
        read_only_fields = ["id", "reporter", "status", "created_at", "reviewed_by", "reviewed_at"]

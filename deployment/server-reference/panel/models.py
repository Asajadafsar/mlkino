
from django.conf import settings
from django.db import models
from django.db.models import Q, F
from django.utils import timezone


class AgencyExpertLink(models.Model):
    agency = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="panel_expert_links",
    )
    expert = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="panel_agency_links",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["agency", "expert"],
                name="panel_unique_agency_expert",
            ),
            models.CheckConstraint(
                condition=~Q(agency=F("expert")),
                name="panel_no_self_link",
            ),
        ]

    def __str__(self):
        return f"{self.agency_id} - {self.expert_id}"


class ImportantTask(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    due_date = models.DateField(
        default=timezone.localdate,
        db_index=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="panel_created_tasks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.title


class TaskAssignment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "انجام نشده"
        IN_PROGRESS = "in_progress", "در حال انجام"
        DONE = "done", "انجام شده"

    task = models.ForeignKey(
        ImportantTask,
        on_delete=models.CASCADE,
        related_name="assignments",
    )

    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="panel_assigned_tasks",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["task", "assignee"],
                name="panel_unique_task_assignee",
            )
        ]

    def __str__(self):
        return f"{self.task_id} - {self.assignee_id}"


# ============================================================
# IMPERSONATION / AUDIT MODELS
# ============================================================
import uuid


class ImpersonationSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="impersonations_started")
    target = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="impersonations_received")
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["actor", "revoked_at", "expires_at"])]


class ImpersonationAudit(models.Model):
    session = models.ForeignKey(ImpersonationSession, on_delete=models.PROTECT, related_name="audit_events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+")
    target = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+")
    event = models.CharField(max_length=24)
    method = models.CharField(max_length=10, blank=True)
    path = models.CharField(max_length=500, blank=True)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


# ============================================================
# SUPPORT TICKETS
# ============================================================
class SupportTicket(models.Model):
    class Category(models.TextChoices):
        COMPLAINT = "complaint", "شکایت"
        TECHNICAL = "technical", "سوالات فنی درمورد ملکینو"
        OTHER = "other", "متفرقه"

    class Status(models.TextChoices):
        OPEN = "open", "باز"
        IN_PROGRESS = "in_progress", "در حال بررسی"
        WAITING_USER = "waiting_user", "در انتظار پاسخ کاربر"
        ANSWERED = "answered", "پاسخ داده شده"
        CLOSED = "closed", "بسته شده"

    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="support_tickets")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_support_tickets")
    category = models.CharField(max_length=20, choices=Category.choices, db_index=True)
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at", "-id"]
        indexes = [models.Index(fields=["creator", "status"])]

    def __str__(self):
        return f"#{self.pk} - {self.subject}"


class SupportTicketMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="support_ticket_messages")
    body = models.TextField(blank=True)
    attachment = models.FileField(upload_to="private_tickets/%Y/%m/", null=True, blank=True)
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["ticket", "created_at"])]


# Personal reminders and private member messaging
class PersonalReminder(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="personal_reminders")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    remind_at = models.DateTimeField(db_index=True)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["remind_at", "id"]
        indexes = [models.Index(fields=["owner", "remind_at"])]

class DirectConversation(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="direct_chats_1")
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="direct_chats_2")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user1", "user2"], name="unique_direct_pair"), models.CheckConstraint(condition=~Q(user1=F("user2")), name="different_direct_members")]
        ordering = ["-updated_at"]

class DirectMessage(models.Model):
    conversation = models.ForeignKey(DirectConversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sent_direct_messages")
    body = models.TextField(blank=True)
    attachment = models.FileField(upload_to="private_chat/%Y/%m/", null=True, blank=True)
    attachment_kind = models.CharField(max_length=10, choices=[("file","فایل"),("voice","ویس")], default="file")
    reply_to = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        ordering = ["id"]
        indexes = [models.Index(fields=["conversation", "id"])]

class ChatBlock(models.Model):
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_blocks_made")
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_blocks_received")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["blocker", "blocked"], name="unique_chat_block")]

class ChatReport(models.Model):
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="chat_reports_sent")
    conversation = models.ForeignKey(DirectConversation, on_delete=models.PROTECT, related_name="reports")
    message = models.ForeignKey(DirectMessage, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.CharField(max_length=200)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[("pending","در انتظار بررسی"),("reviewed","بررسی شده"),("dismissed","رد شده")], default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_chat_reports")
    reviewed_at = models.DateTimeField(null=True, blank=True)

from .settings_models import PanelSettings

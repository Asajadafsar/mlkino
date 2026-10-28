
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

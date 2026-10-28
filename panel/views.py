
from datetime import date

from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from accounts.models import Announcement, AgencyExpert
from accounts.permissions import IsSuperAdmin
from accounts.utils import success_response, error_response

from panel.models import ImportantTask, TaskAssignment

from panel.serializers import (
    AnnouncementListSerializer,
    AnnouncementDetailSerializer,
    AnnouncementCreateSerializer,
    AnnouncementUpdateSerializer,
    PanelUserListSerializer,
    PanelUserDetailSerializer,
    PanelUserUpdateSerializer,
    TaskReadSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusSerializer,
    AgencyExpertLinkSerializer,
)


User = get_user_model()


# ============================================================
# HELPERS
# ============================================================

def _validation_error(serializer):
    errors = []

    for field, messages in serializer.errors.items():
        if not isinstance(messages, (list, tuple)):
            messages = [messages]

        for message in messages:
            errors.append({
                "field": field,
                "message": str(message),
            })

    return error_response(
        message="اطلاعات ارسالی معتبر نیست.",
        errors=errors,
        status_code=400,
    )


def _is_superadmin(user):
    return (
        user.is_authenticated
        and user.is_active
        and (
            user.is_superuser
            or user.role == User.Role.SUPER_ADMIN
        )
    )


def _is_agency(user):
    return (
        user.is_authenticated
        and user.is_active
        and user.role == User.Role.AGENCY
    )


def _is_expert(user):
    return (
        user.is_authenticated
        and user.is_active
        and user.role == User.Role.EXPERT
    )


def _can_manage_users(user):
    return _is_superadmin(user) or _is_agency(user)


def _can_assign_tasks(user):
    return _is_superadmin(user) or _is_agency(user)


def _agency_experts_queryset(user):
    expert_ids = AgencyExpert.objects.filter(
        agency=user,
        is_active=True,
    ).values_list("expert_id", flat=True)

    return User.objects.filter(
        id__in=expert_ids,
        role=User.Role.EXPERT,
    )


def _managed_users(user):
    if _is_superadmin(user):
        return User.objects.all()

    if _is_agency(user):
        return _agency_experts_queryset(user)

    return User.objects.none()


def _eligible_task_recipients(user):
    if _is_superadmin(user):
        return User.objects.filter(
            role=User.Role.AGENCY,
            is_active=True,
            account_status=User.AccountStatus.ACTIVE,
        )

    if _is_agency(user):
        return _agency_experts_queryset(user).filter(
            is_active=True,
            account_status=User.AccountStatus.ACTIVE,
        )

    return User.objects.none()


def _visible_tasks(user):
    queryset = ImportantTask.objects.select_related(
        "created_by"
    ).prefetch_related(
        "assignments__assignee"
    )

    if _is_superadmin(user):
        return queryset

    if _is_agency(user):
        return queryset.filter(
            models.Q(created_by=user)
            | models.Q(assignments__assignee=user)
        ).distinct()

    return queryset.filter(
        assignments__assignee=user
    ).distinct()


def _task_response_data(task, viewer):
    data = TaskReadSerializer(task).data

    if (
        not _is_superadmin(viewer)
        and task.created_by_id != viewer.id
    ):
        data["assignments"] = [
            item
            for item in data["assignments"]
            if item["assignee"] == viewer.id
        ]

    return data


# ============================================================
# PERMISSIONS
# ============================================================

class CanManageUsers(BasePermission):
    def has_permission(self, request, view):
        return _can_manage_users(request.user)


class UserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ============================================================
# ANNOUNCEMENTS
# ============================================================

# ============================================================
# ANNOUNCEMENTS
# ============================================================

class AnnouncementListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        queryset = (
            Announcement.objects
            .select_related("created_by", "updated_by")
            .all()
            .order_by("-created_at")
        )

        serializer = AnnouncementListSerializer(
            queryset,
            many=True,
            context={"request": request},
        )

        return success_response(
            message="لیست اطلاعیه‌ها",
            data={
                "total_results": len(serializer.data),
                "results": serializer.data,
            },
        )

    def post(self, request):
        serializer = AnnouncementCreateSerializer(
            data=request.data,
            context={"request": request},
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        announcement = serializer.save(
            created_by=request.user,
            updated_by=request.user,
        )

        return success_response(
            message="اطلاعیه با موفقیت ایجاد شد.",
            data=AnnouncementDetailSerializer(
                announcement,
                context={"request": request},
            ).data,
            status_code=201,
        )


class AnnouncementDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, announcement_id):
        announcement = get_object_or_404(
            Announcement.objects.select_related(
                "created_by",
                "updated_by",
            ),
            pk=announcement_id,
        )

        return success_response(
            message="جزئیات اطلاعیه",
            data=AnnouncementDetailSerializer(
                announcement,
                context={"request": request},
            ).data,
        )

    def patch(self, request, announcement_id):
        announcement = get_object_or_404(
            Announcement,
            pk=announcement_id,
        )

        serializer = AnnouncementUpdateSerializer(
            announcement,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        announcement = serializer.save(
            updated_by=request.user,
        )

        return success_response(
            message="اطلاعیه با موفقیت ویرایش شد.",
            data=AnnouncementDetailSerializer(
                announcement,
                context={"request": request},
            ).data,
        )

    def delete(self, request, announcement_id):
        announcement = get_object_or_404(
            Announcement,
            pk=announcement_id,
        )

        announcement.delete()

        return success_response(
            message="اطلاعیه با موفقیت حذف شد.",
            data={
                "deleted_id": announcement_id,
            },
        )

# ============================================================
# USER MANAGEMENT
# ============================================================

USER_GROUPS = {
    "superadmin": {
        "title": "سوپر ادمین",
        "role": User.Role.SUPER_ADMIN,
    },
    "agency": {
        "title": "املاکی‌ها",
        "role": User.Role.AGENCY,
    },
    "expert": {
        "title": "کارشناسان",
        "role": User.Role.EXPERT,
    },
    "user": {
        "title": "کاربران عادی",
        "role": User.Role.USER,
    },
}


class PanelUserGroupsView(APIView):
    permission_classes = [
        IsAuthenticated,
        CanManageUsers,
    ]

    def get(self, request):
        results = []

        for key, config in USER_GROUPS.items():
            if _is_agency(request.user) and key != "expert":
                continue

            queryset = _managed_users(
                request.user
            ).filter(
                role=config["role"]
            )

            results.append({
                "key": key,
                "title": config["title"],
                "role": config["role"],
                "count": queryset.count(),
            })

        return success_response(
            message="دسته‌بندی کاربران",
            data={
                "total_results": len(results),
                "results": results,
            },
        )


class PanelUserListView(APIView):
    permission_classes = [
        IsAuthenticated,
        CanManageUsers,
    ]

    def get(self, request):
        queryset = _managed_users(
            request.user
        ).order_by("-id")

        group = (request.query_params.get("group") or request.query_params.get("role") or "").strip().lower()
        group = {"super_admin": "superadmin", "super-admin": "superadmin", "admin": "superadmin", "agencies": "agency", "agencys": "agency", "agents": "agency", "experts": "expert", "users": "user", "normal": "user", "consumer": "user", "all": ""}.get(group, group)

        if group:
            if group not in USER_GROUPS:
                return error_response(
                    message="دسته‌بندی نامعتبر است.",
                    status_code=400,
                )

            if _is_agency(request.user) and group != "expert":
                return error_response(
                    message="دسترسی غیرمجاز.",
                    status_code=403,
                )

            queryset = queryset.filter(
                role=USER_GROUPS[group]["role"]
            )

        search = request.query_params.get(
            "search", ""
        ).strip()

        if search:
            queryset = queryset.filter(
                models.Q(phone__icontains=search)
                | models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
                | models.Q(email__icontains=search)
            )

        account_status = request.query_params.get(
            "account_status"
        )

        if account_status:
            queryset = queryset.filter(
                account_status=account_status
            )

        paginator = UserPagination()
        page = paginator.paginate_queryset(
            queryset,
            request,
            view=self,
        )

        serializer = PanelUserListSerializer(
            page,
            many=True,
        )

        return success_response(
            message="لیست کاربران",
            data={
                "total_results": paginator.page.paginator.count,
                "count": paginator.page.paginator.count,
                "page": paginator.page.number,
                "page_size": paginator.get_page_size(request),
                "results": serializer.data,
            },
        )


class PanelUserDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        CanManageUsers,
    ]

    def get(self, request, user_id):
        user = get_object_or_404(
            _managed_users(request.user),
            pk=user_id,
        )

        return success_response(
            message="جزئیات کاربر",
            data=PanelUserDetailSerializer(
                user,
                context={"request": request},
            ).data,
        )

    def patch(self, request, user_id):
        user = get_object_or_404(
            _managed_users(request.user),
            pk=user_id,
        )

        is_admin = _is_superadmin(request.user)
        is_agency = _is_agency(request.user)

        if not is_admin and not is_agency:
            return error_response(
                message="شما اجازه ویرایش کاربران را ندارید.",
                status_code=403,
            )

        # جلوگیری از ارسال فیلدهای خارج از محدوده ویرایش
        allowed_fields = set(
            PanelUserUpdateSerializer.Meta.fields
        )

        submitted_fields = set(request.data.keys())
        unknown_fields = submitted_fields - allowed_fields

        if unknown_fields:
            return error_response(
                message=(
                    "یک یا چند فیلد ارسالی "
                    "قابل ویرایش نیستند: "
                    + "، ".join(sorted(unknown_fields))
                ),
                status_code=400,
            )

        # املاکی فقط اطلاعات پایه کارشناسان خودش را تغییر می‌دهد
        if is_agency:
            agency_allowed_fields = {
                "first_name",
                "last_name",
                "email",
            }

            forbidden_fields = (
                submitted_fields - agency_allowed_fields
            )

            if forbidden_fields:
                return error_response(
                    message=(
                        "املاکی فقط مجاز به ویرایش نام، "
                        "نام خانوادگی و ایمیل کارشناسان خود است."
                    ),
                    status_code=403,
                )

        # جلوگیری از غیرفعال کردن حساب خود
        if user.pk == request.user.pk:
            if request.data.get("is_active") is False:
                return error_response(
                    message=(
                        "نمی‌توانید حساب کاربری "
                        "خودتان را غیرفعال کنید."
                    ),
                    status_code=400,
                )

            if (
                "role" in request.data
                and request.data["role"] != User.Role.SUPER_ADMIN
            ):
                return error_response(
                    message=(
                        "نمی‌توانید نقش مدیریتی "
                        "خودتان را تغییر دهید."
                    ),
                    status_code=400,
                )

        # جلوگیری از تغییر نقش سوپریوزر
        if user.is_superuser and "role" in request.data:
            if request.data["role"] != User.Role.SUPER_ADMIN:
                return error_response(
                    message="نقش سوپریوزر قابل تغییر نیست.",
                    status_code=403,
                )

        serializer = PanelUserUpdateSerializer(
            user,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        serializer.save()

        user.refresh_from_db()

        return success_response(
            message="اطلاعات کاربر با موفقیت ویرایش شد.",
            data=PanelUserDetailSerializer(
                user,
                context={"request": request},
            ).data,
        )



# ============================================================
# TASK RECIPIENTS
# ============================================================

class AgencyExpertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _can_assign_tasks(request.user):
            return error_response(
                message="دسترسی غیرمجاز.",
                status_code=403,
            )

        users = _eligible_task_recipients(
            request.user
        ).order_by("id")

        results = []

        for user in users:
            results.append({
                "id": user.id,
                "phone": user.phone,
                "full_name": user.full_name,
                "role": user.role,
                "role_display": user.get_role_display(),
            })

        return success_response(
            message="دریافت‌کنندگان مجاز",
            data={
                "total_results": len(results),
                "results": results,
            },
        )


# ============================================================
# AGENCY EXPERT RELATIONS
# ============================================================

class AgencyExpertLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_superadmin(request.user):
            return error_response(
                message="فقط سوپرادمین مجاز است.",
                status_code=403,
            )

        serializer = AgencyExpertLinkSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        agency = get_object_or_404(
            User,
            pk=serializer.validated_data["agency_id"],
            role=User.Role.AGENCY,
        )

        expert = get_object_or_404(
            User,
            pk=serializer.validated_data["expert_id"],
            role=User.Role.EXPERT,
        )

        existing = AgencyExpert.objects.filter(
            expert=expert
        ).first()

        if existing:
            if existing.agency_id != agency.id:
                return error_response(
                    message=(
                        "این کارشناس قبلاً به دفتر "
                        "املاک دیگری متصل شده است."
                    ),
                    status_code=400,
                )

            if not existing.is_active:
                existing.is_active = True
                existing.save(
                    update_fields=[
                        "is_active",
                        "updated_at",
                    ]
                )

            link = existing
            created = False

        else:
            link = AgencyExpert.objects.create(
                agency=agency,
                expert=expert,
            )
            created = True

        return success_response(
            message="ارتباط کارشناس ثبت شد.",
            data={
                "id": link.id,
                "agency_id": agency.id,
                "expert_id": expert.id,
                "is_active": link.is_active,
                "created": created,
            },
            status_code=201 if created else 200,
        )

    def delete(self, request, link_id):
        if not _is_superadmin(request.user):
            return error_response(
                message="فقط سوپرادمین مجاز است.",
                status_code=403,
            )

        link = get_object_or_404(
            AgencyExpert,
            pk=link_id,
        )

        link.is_active = False
        link.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        return success_response(
            message="عضویت کارشناس غیرفعال شد.",
            data={
                "id": link.id,
                "is_active": False,
            },
        )


# ============================================================
# IMPORTANT TASKS
# ============================================================

class ImportantTaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = _visible_tasks(request.user)

        date_str = request.query_params.get("date")

        if date_str:
            try:
                day = date.fromisoformat(date_str)
            except ValueError:
                return error_response(
                    message="فرمت تاریخ نامعتبر است.",
                    status_code=400,
                )
        else:
            day = timezone.localdate()

        queryset = queryset.filter(
            due_date=day
        )

        scope = request.query_params.get(
            "scope", "all"
        )

        if scope == "received":
            queryset = queryset.filter(
                assignments__assignee=request.user
            )

        elif scope == "created":
            queryset = queryset.filter(
                created_by=request.user
            )

        elif scope != "all":
            return error_response(
                message="مقدار scope نامعتبر است.",
                status_code=400,
            )

        queryset = queryset.distinct()

        results = [
            _task_response_data(task, request.user)
            for task in queryset
        ]

        return success_response(
            message="کارهای مهم امروز",
            data={
                "total_results": len(results),
                "results": results,
            },
        )

    @transaction.atomic
    def post(self, request):
        if not _can_assign_tasks(request.user):
            return error_response(
                message="اجازه ایجاد تسک ندارید.",
                status_code=403,
            )

        serializer = TaskCreateSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        data = serializer.validated_data
        allowed = _eligible_task_recipients(
            request.user
        )

        if data["all_assignees"]:
            users = list(allowed)
        else:
            users = list(
                allowed.filter(
                    pk__in=data["assignee_ids"]
                )
            )

            if len(users) != len(data["assignee_ids"]):
                return error_response(
                    message=(
                        "یک یا چند دریافت‌کننده "
                        "مجاز نیستند."
                    ),
                    status_code=403,
                )

        if not users:
            return error_response(
                message="هیچ دریافت‌کننده‌ای یافت نشد.",
                status_code=400,
            )

        task = ImportantTask.objects.create(
            title=data["title"],
            description=data.get("description", ""),
            due_date=data.get(
                "due_date",
                timezone.localdate(),
            ),
            created_by=request.user,
        )

        TaskAssignment.objects.bulk_create([
            TaskAssignment(
                task=task,
                assignee=user,
            )
            for user in users
        ])

        task = ImportantTask.objects.prefetch_related(
            "assignments__assignee"
        ).get(pk=task.id)

        return success_response(
            message="تسک ایجاد شد.",
            data=_task_response_data(
                task,
                request.user,
            ),
            status_code=201,
        )


class ImportantTaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        task = get_object_or_404(
            _visible_tasks(request.user),
            pk=task_id,
        )

        return success_response(
            message="جزئیات تسک",
            data=_task_response_data(
                task,
                request.user,
            ),
        )

    def patch(self, request, task_id):
        task = get_object_or_404(
            ImportantTask,
            pk=task_id,
        )

        if (
            task.created_by_id != request.user.id
            or not _can_assign_tasks(request.user)
        ):
            return error_response(
                message="اجازه ویرایش ندارید.",
                status_code=403,
            )

        serializer = TaskUpdateSerializer(
            task,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        task = serializer.save()

        return success_response(
            message="تسک ویرایش شد.",
            data=_task_response_data(
                task,
                request.user,
            ),
        )

    def delete(self, request, task_id):
        task = get_object_or_404(
            ImportantTask,
            pk=task_id,
        )

        if (
            task.created_by_id != request.user.id
            or not _can_assign_tasks(request.user)
        ):
            return error_response(
                message="اجازه حذف ندارید.",
                status_code=403,
            )

        task.delete()

        return success_response(
            message="تسک حذف شد.",
            data={"deleted_id": task_id},
        )


class TaskAssignmentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, assignment_id):
        assignment = get_object_or_404(
            TaskAssignment,
            pk=assignment_id,
        )

        if assignment.assignee_id != request.user.id:
            return error_response(
                message=(
                    "فقط دریافت‌کننده می‌تواند "
                    "وضعیت تسک را تغییر دهد."
                ),
                status_code=403,
            )

        serializer = TaskStatusSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        new_status = serializer.validated_data["status"]

        assignment.status = new_status

        assignment.completed_at = (
            timezone.now()
            if new_status == TaskAssignment.Status.DONE
            else None
        )

        assignment.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        return success_response(
            message="وضعیت تسک تغییر کرد.",
            data={
                "id": assignment.id,
                "task_id": assignment.task_id,
                "status": assignment.status,
                "completed_at": assignment.completed_at,
            },
        )



# ============================================================
# DASHBOARD
# Announcements + Today's Important Tasks
# ============================================================

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone

from accounts.models import Announcement
from panel.models import ImportantTask, TaskAssignment
from panel.serializers import AnnouncementDetailSerializer
from accounts.utils import success_response, error_response


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()

        # ---------------------------------------------
        # 1. Published announcements from superadmins
        # ---------------------------------------------

        announcements_queryset = (
            Announcement.objects
            .select_related("created_by", "updated_by")
            .filter(
                status="published",
            )
            .filter(
                Q(created_by__is_superuser=True)
                | Q(created_by__role="superadmin")
            )
            .order_by("-created_at", "-id")
        )

        announcements = AnnouncementDetailSerializer(
            announcements_queryset,
            many=True,
            context={"request": request},
        ).data

        # ---------------------------------------------
        # 2. Today's tasks assigned to current user
        # ---------------------------------------------

        assignments_queryset = (
            TaskAssignment.objects
            .select_related("task", "task__created_by")
            .filter(
                assignee=user,
                task__due_date=today,
            )
            .order_by("-task__created_at", "-id")
        )

        total_tasks = assignments_queryset.count()

        completed_tasks = assignments_queryset.filter(
            status=TaskAssignment.Status.DONE
        ).count()

        # First four tasks, prioritizing unfinished ones
        assignments = list(
            assignments_queryset
            .annotate(
                completion_priority=models.Case(
                    models.When(
                        status=TaskAssignment.Status.DONE,
                        then=models.Value(1),
                    ),
                    default=models.Value(0),
                    output_field=models.IntegerField(),
                )
            )
            .order_by(
                "completion_priority",
                "-task__created_at",
                "-id",
            )[:4]
        )

        tasks = []

        for assignment in assignments:
            task = assignment.task

            is_completed = (
                assignment.status
                == TaskAssignment.Status.DONE
            )

            tasks.append({
                "id": task.id,
                "assignment_id": assignment.id,
                "title": task.title,
                "description": task.description,
                "due_date": task.due_date,
                "status": assignment.status,
                "is_completed": is_completed,
                "completed_at": assignment.completed_at,
                "created_at": task.created_at,
                "created_by": task.created_by_id,
            })

        return success_response(
            message="اطلاعات پیشخوان",
            data={
                "announcements": {
                    "total_results": len(announcements),
                    "results": announcements,
                },
                "important_tasks": {
                    "total_results": total_tasks,
                    "completed_count": completed_tasks,
                    "pending_count": (
                        total_tasks - completed_tasks
                    ),
                    "results": tasks,
                },
            },
        )


# ============================================================
# DASHBOARD TASK CHECKBOX
# ============================================================

class DashboardTaskToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, assignment_id):
        assignment = get_object_or_404(
            TaskAssignment.objects.select_related("task"),
            pk=assignment_id,
            assignee=request.user,
        )

        is_completed = request.data.get("is_completed")

        if not isinstance(is_completed, bool):
            return error_response(
                message=(
                    "فیلد is_completed باید "
                    "از نوع boolean باشد."
                ),
                status_code=400,
            )

        new_status = (
            TaskAssignment.Status.DONE
            if is_completed
            else TaskAssignment.Status.PENDING
        )

        assignment.status = new_status

        assignment.completed_at = (
            timezone.now()
            if is_completed
            else None
        )

        assignment.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        return success_response(
            message=(
                "کار با موفقیت تکمیل شد."
                if is_completed
                else "کار به وضعیت انجام‌نشده برگشت."
            ),
            data={
                "id": assignment.task_id,
                "assignment_id": assignment.id,
                "status": assignment.status,
                "is_completed": is_completed,
                "completed_at": assignment.completed_at,
            },
        )


# ============================================================
# IMPERSONATION API / ACTIVITY LOG API
# ============================================================
import hashlib
import secrets
from datetime import timedelta
from django.conf import settings
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from accounts.cookies import ACCESS_COOKIE, get_cookie_options
from accounts.authentication import CookieJWTAuthentication
from accounts.models import ActivityLog
from panel.models import ImpersonationSession, ImpersonationAudit

IMPERSONATION_COOKIE = "mlkinoImpersonation"
IMPERSONATION_MAX_AGE = 1800


def _require_csrf(request):
    checker = CSRFCheck(lambda req: None)
    checker.process_request(request)
    reason = checker.process_view(request, None, (), {})
    if reason:
        raise PermissionDenied("CSRF نامعتبر است: " + str(reason))


def _imp_cookie(response, raw=None):
    cfg = get_cookie_options()
    if raw is None:
        response.delete_cookie(IMPERSONATION_COOKIE, path="/", domain=cfg["domain"], samesite=cfg["samesite"])
    else:
        response.set_cookie(IMPERSONATION_COOKIE, raw, max_age=IMPERSONATION_MAX_AGE,
                            httponly=True, secure=cfg["secure"], samesite=cfg["samesite"],
                            domain=cfg["domain"], path="/")
    response["Cache-Control"] = "no-store"
    return response


def _imp_audit(session, event, request, status_code=200):
    ImpersonationAudit.objects.create(session=session, actor=session.actor, target=session.target,
                                      event=event, method=request.method,
                                      path=request.path[:500], status_code=status_code)


class OriginalAdminAuthentication(JWTAuthentication):
    """Only for stop/status: validates the original admin JWT, never switches to target."""
    def authenticate(self, request):
        raw = request.COOKIES.get(ACCESS_COOKIE)
        if not raw:
            header = self.get_header(request)
            raw = self.get_raw_token(header) if header is not None else None
        if not raw:
            return None
        token = self.get_validated_token(raw)
        return self.get_user(token), token


class StartImpersonationView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        _require_csrf(request)
        if request.COOKIES.get(IMPERSONATION_COOKIE):
            return error_response("ابتدا از نشست مدیریتی فعلی خارج شوید.", status_code=409)
        if not _is_superadmin(request.user):
            raise PermissionDenied("فقط سوپرادمین مجاز است.")
        target = get_object_or_404(User, pk=user_id, is_active=True, account_status=User.AccountStatus.ACTIVE)
        if target.pk == request.user.pk or _is_superadmin(target):
            return error_response("ورود به حساب مدیر مجاز نیست.", status_code=403)
        raw = secrets.token_urlsafe(48)
        with transaction.atomic():
            session = ImpersonationSession.objects.create(
                actor=request.user, target=target,
                token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                expires_at=timezone.now() + timedelta(seconds=IMPERSONATION_MAX_AGE),
                ip_address=request.META.get("REMOTE_ADDR") or None,
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            )
            _imp_audit(session, "START", request)
        return _imp_cookie(success_response("ورود مدیریتی آغاز شد.", data={
            "active": True, "session_id": str(session.pk), "actor_id": session.actor_id,
            "target_id": session.target_id, "target_role": target.role,
            "expires_at": session.expires_at,
        }), raw)


class ImpersonationStatusView(APIView):
    authentication_classes = [OriginalAdminAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_superadmin(request.user):
            raise PermissionDenied("فقط سوپرادمین مجاز است.")
        raw = request.COOKIES.get(IMPERSONATION_COOKIE)
        session = None
        if raw:
            session = ImpersonationSession.objects.select_related("target").filter(
                actor=request.user, token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                revoked_at__isnull=True, expires_at__gt=timezone.now(), target__is_active=True,
            ).first()
        return success_response("وضعیت ورود مدیریتی", data={
            "active": bool(session), "actor_id": request.user.pk,
            "target_id": session.target_id if session else None,
            "target_role": session.target.role if session else None,
            "expires_at": session.expires_at if session else None,
        })


class StopImpersonationView(APIView):
    authentication_classes = [OriginalAdminAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _require_csrf(request)
        if not _is_superadmin(request.user):
            raise PermissionDenied("فقط سوپرادمین مجاز است.")
        raw = request.COOKIES.get(IMPERSONATION_COOKIE)
        if raw:
            with transaction.atomic():
                session = ImpersonationSession.objects.select_for_update().filter(
                    actor=request.user, token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                    revoked_at__isnull=True,
                ).first()
                if session:
                    session.revoked_at = timezone.now()
                    session.save(update_fields=["revoked_at"])
                    _imp_audit(session, "STOP", request)
        return _imp_cookie(success_response("به پنل مدیریت بازگشتید.", data={"active": False}))


@ensure_csrf_cookie
def ImpersonationCsrfView(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "message": "Method not allowed"}, status=405)
    get_token(request)
    return JsonResponse({"success": True, "message": "CSRF آماده است.", "data": {}})


class ActivityLogListView(APIView):
    authentication_classes = [OriginalAdminAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_superadmin(request.user) or request.COOKIES.get(IMPERSONATION_COOKIE):
            raise PermissionDenied("مشاهده لاگ‌ها فقط برای سوپرادمین در نشست اصلی مجاز است.")
        qs = ActivityLog.objects.select_related("actor", "real_actor").all()
        params = request.query_params
        if params.get("actor_id"):
            qs = qs.filter(actor_id=params["actor_id"])
        if params.get("real_actor_id"):
            qs = qs.filter(real_actor_id=params["real_actor_id"])
        if params.get("category"):
            qs = qs.filter(category=params["category"])
        if params.get("method"):
            qs = qs.filter(method=params["method"].upper())
        if params.get("status_code"):
            qs = qs.filter(status_code=params["status_code"])
        if params.get("search"):
            qs = qs.filter(models.Q(path__icontains=params["search"]) | models.Q(event__icontains=params["search"]))
        paginator = UserPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        from panel.serializers import ActivityLogSerializer
        return success_response("گزارش فعالیت‌های سامانه", data={
            "total_results": paginator.page.paginator.count,
            "page": paginator.page.number,
            "page_size": paginator.get_page_size(request),
            "results": ActivityLogSerializer(page, many=True).data,
        })


class ActivityLogDetailView(APIView):
    authentication_classes = [OriginalAdminAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, log_id):
        if not _is_superadmin(request.user) or request.COOKIES.get(IMPERSONATION_COOKIE):
            raise PermissionDenied("دسترسی غیرمجاز.")
        from panel.serializers import ActivityLogSerializer
        obj = get_object_or_404(ActivityLog.objects.select_related("actor", "real_actor"), pk=log_id)
        return success_response("جزئیات فعالیت", data=ActivityLogSerializer(obj).data)

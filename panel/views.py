import ipaddress
import logging
import uuid
from accounts.models import ActivityLog

from datetime import date

from django.contrib.auth import get_user_model
from django.db import models, transaction, IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, serializers
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from accounts.models import Announcement, AgencyExpert, AgencyProfile, ExpertProfile
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
    AgencyProfileSerializer, ExpertProfileSerializer,
)


User = get_user_model()

# ============================================================
# ACTIVITY AUDIT HELPERS
# ============================================================
"""Human-readable activity labels and explicit business audit events.
Never store request bodies, passwords, tokens, or personal identification numbers.
"""

LABELS = {
    "announcement.create": "ایجاد اطلاعیه", "announcement.update": "ویرایش اطلاعیه", "announcement.delete": "حذف اطلاعیه",
    "user.create": "ایجاد کاربر", "user.update": "ویرایش کاربر", "user.deactivate": "غیرفعال‌سازی کاربر",
    "task.create": "ایجاد کار مهم", "task.update": "ویرایش کار مهم", "task.delete": "حذف کار مهم",
    "task.status_change": "تغییر وضعیت کار", "task.view_list": "مشاهده کارهای مهم امروز",
    "user.view_list": "مشاهده کاربران", "user.view_detail": "مشاهده جزئیات کاربر",
    "activity.view_list": "مشاهده گزارش فعالیت‌ها", "activity.view_detail": "مشاهده جزئیات فعالیت",
    "dashboard.view": "مشاهده پیشخوان", "announcement.view_list": "مشاهده اطلاعیه‌ها",
    "expert.link": "اتصال کارشناس به دفتر", "expert.unlink": "قطع ارتباط کارشناس",
    "impersonation.start": "شروع ورود مدیریتی", "impersonation.stop": "پایان ورود مدیریتی",
    "ticket.create": "ثبت تیکت", "ticket.reply": "پاسخ به تیکت",
    "ticket.status_change": "تغییر وضعیت تیکت", "ticket.assign": "ارجاع تیکت",
    "ticket.view_list": "مشاهده تیکت‌ها", "ticket.view_detail": "مشاهده جزئیات تیکت",
    "http.request": "درخواست سامانه",
}

LABELS.update({
    'reminder.create':'ثبت یادآوری شخصی','reminder.update':'ویرایش یادآوری شخصی','reminder.delete':'حذف یادآوری شخصی',
    'profile.update':'ویرایش پروفایل','profile.preferences':'تغییر تنظیمات شخصی','password.change':'تغییر رمز عبور','session.revoke':'بستن نشست دستگاه','session.created':'ورود به حساب',
    'chat.create':'شروع گفتگو','chat.message.send':'ارسال پیام','chat.send':'ارسال پیام','chat.message.delete':'حذف پیام','chat.read':'خواندن پیام','chat.block':'مسدودکردن مخاطب','chat.unblock':'رفع مسدودی مخاطب','chat.report':'ثبت گزارش گفتگو','chat.report.review':'بررسی گزارش گفتگو','user.permanent_delete':'حذف کاربر','request.failed':'عملیات ناموفق'
})


def _ip(request):
    from accounts.client_ip import get_client_ip
    return get_client_ip(request)


def record_activity(request, *, event, target_type="", target_id=None, target_label="", description="", changes=None):
    """Explicit successful business action. Call only after a successful write."""
    actor = getattr(request, "user", None)
    if not actor or not actor.is_authenticated:
        return None
    field_labels={'first_name':'نام','last_name':'نام خانوادگی','email':'ایمیل','phone':'شماره همراه','postal_code':'کد پستی','address':'نشانی','avatar':'عکس','role':'نقش','account_status':'وضعیت حساب','is_active':'فعال بودن حساب','verification_status':'احراز هویت','title':'عنوان','description':'توضیحات','due_date':'سررسید','status':'وضعیت','is_done':'انجام شدن','remind_at':'زمان یادآوری','assigned_to':'مسئول رسیدگی','assignee_ids':'دریافت‌کنندگان','category':'دسته‌بندی','message':'متن پاسخ','attachment':'پیوست','password':'رمز عبور','old_password':'رمز عبور','new_password':'رمز عبور','is_internal':'نوع پاسخ','notifications':'تنظیمات اطلاع‌رسانی','privacy':'حریم خصوصی','national_code':'کد ملی','birth_date':'تاریخ تولد','province':'استان','city':'شهر','user_type':'نوع کاربر','general':'تنظیمات عمومی','branding':'هویت بصری','theme':'ظاهر','seo':'اطلاعات جستجو','contact':'اطلاعات تماس'}
    changed_fields=[field_labels.get(key,'سایر اطلاعات') for key in request.data.keys() if key not in ('password_confirm','new_password_confirm')]
    actor_name=getattr(actor,'full_name','') or f'کاربر #{actor.pk}'
    acting=getattr(request._request,'impersonation_session',None)
    if acting:actor_name=f'{acting.actor.full_name or acting.actor.pk} به نمایندگی از {actor_name}'
    title=LABELS.get(event,description or event)
    detail=f'{actor_name} — {title}'
    if target_label:detail+=f'؛ مورد: «{str(target_label)[:180]}»'
    if target_id is not None:detail+=f' (شناسه {target_id})'
    if changed_fields:detail+='؛ فیلدها: '+ '، '.join(changed_fields)
    enum_labels={'pending':'در انتظار','in_progress':'در حال انجام','done':'انجام شده','active':'فعال','inactive':'غیرفعال','suspended':'تعلیق شده','open':'باز','answered':'پاسخ داده شده','waiting_user':'منتظر کاربر','closed':'بسته','superadmin':'سوپرادمین','agency':'املاکی','expert':'کارشناس','user':'کاربر عادی','verified':'تأیید شده','rejected':'رد شده','not_started':'شروع نشده'}
    new_values={field_labels[key]:enum_labels.get(str(request.data[key]),str(request.data[key])) for key in ('status','account_status','role','verification_status') if key in request.data}
    if 'is_done' in request.data:new_values['انجام شدن']='انجام شده' if request.data['is_done'] in (True,'true') else 'انجام نشده'
    if isinstance(request.data.get('assignee_ids'),list):
        recipients=User.objects.filter(pk__in=request.data['assignee_ids'][:100])
        new_values['دریافت‌کنندگان']='، '.join(f'{person.full_name or person.phone} (#{person.pk})' for person in recipients)
    if new_values:detail+='؛ '+ '؛ '.join(f'{key}: {value}' for key,value in new_values.items())
    detail+='؛ نتیجه: موفق' 
    request._request.business_activity_logged=True
    metadata = {"description": detail,"changed_fields":changed_fields,"new_values":new_values, "target_type": target_type,
                "target_id": target_id, "target_label": str(target_label or "")[:180]}
    if changes:
        metadata["changes"] = changes  # Only pass pre-sanitized, non-sensitive changes.
    try:
        return ActivityLog.objects.create(
            actor=actor,
            real_actor=getattr(getattr(request._request, 'impersonation_session', None), 'actor', actor),
            impersonation_session=getattr(request._request, 'impersonation_session', None),
            event=event, category="business", method=request.method,
            path=request.path[:500], status_code=200, ip_address=_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:500], metadata=metadata,
            request_id=uuid.uuid4(),
        )
    except Exception:
        logging.getLogger(__name__).exception("Failed to write business activity audit")
        return None


def describe_http_activity(obj):
    meta = obj.metadata if isinstance(obj.metadata, dict) else {}
    event = obj.event
    if event == "http.request":
        path = obj.path.split("?", 1)[0].rstrip("/") + "/"
        method = obj.method.upper()
        if path == "/panel/tasks/" and method == "GET":
            event = "task.view_list"
        elif path == "/panel/users/" and method == "GET":
            event = "user.view_list"
        elif path == "/panel/activity-logs/" and method == "GET":
            event = "activity.view_list"
        elif path == "/panel/dashboard/" and method == "GET":
            event = "dashboard.view"
        elif path == "/panel/announcements/" and method == "GET":
            event = "announcement.view_list"
        elif path == "/panel/tickets/" and method == "GET":
            event = "ticket.view_list"
        elif path.startswith("/panel/tickets/") and method == "GET":
            event = "ticket.view_detail"
        elif path.startswith("/panel/users/") and method == "GET":
            event = "user.view_detail"
        elif path.startswith("/panel/activity-logs/") and method == "GET":
            event = "activity.view_detail"
    title = LABELS.get(event, "فعالیت سامانه")
    actor_name = getattr(obj.actor, "full_name", "") or "کاربر ناشناس"
    description = meta.get("description")
    if not description:
        if obj.event == "http.request" and event == "http.request":
            description = f"{actor_name} درخواست {obj.method} به مسیر {obj.path} ارسال کرد."
        else:
            description = f"{actor_name}: {title}"
    label = meta.get("target_label")
    if label and obj.event != "http.request" and not meta.get("description"):
        description = f"{actor_name}: {title} — {label}"
    return {"action": event, "action_display": title, "description": description,
            "target_type": meta.get("target_type"), "target_id": meta.get("target_id"),
            "changes": meta.get("changes", {"fields":meta.get("changed_fields",[]),"new_values":meta.get("new_values",{})})}




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
        return User.objects.filter(models.Q(role__in=[User.Role.AGENCY, User.Role.EXPERT]) | models.Q(pk=user.pk), is_active=True, account_status=User.AccountStatus.ACTIVE)
    if _is_agency(user):
        return User.objects.filter(models.Q(pk__in=_agency_experts_queryset(user).values('pk')) | models.Q(pk=user.pk), is_active=True, account_status=User.AccountStatus.ACTIVE)
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


def _task_response_data(task, viewer, *, refresh=True):
    if refresh:
        task = ImportantTask.objects.select_related("created_by").prefetch_related("assignments__assignee").get(pk=task.pk)
    data = TaskReadSerializer(task).data
    assignments = list(task.assignments.all())
    can_manage = _is_superadmin(viewer) or (
        task.created_by_id == viewer.pk and _can_assign_tasks(viewer)
    )
    if not can_manage:
        data["assignments"] = [
            item for item in data["assignments"] if item["assignee"] == viewer.pk
        ]
        assignments = [a for a in assignments if a.assignee_id == viewer.pk]
    statuses = [a.status for a in assignments]
    if statuses and all(s == TaskAssignment.Status.DONE for s in statuses):
        overall = TaskAssignment.Status.DONE
    elif any(s != TaskAssignment.Status.PENDING for s in statuses):
        overall = TaskAssignment.Status.IN_PROGRESS
    else:
        overall = TaskAssignment.Status.PENDING
    data["status"] = overall
    data["status_display"] = dict(TaskAssignment.Status.choices).get(overall, overall)
    data["is_completed"] = bool(statuses) and all(s == TaskAssignment.Status.DONE for s in statuses)
    data["completed_count"] = sum(s == TaskAssignment.Status.DONE for s in statuses)
    data["assignments_count"] = len(statuses)
    return data


def _task_requested_status(request):
    """Validate an optional status or boolean is_completed; never silently ignore it."""
    has_status = "status" in request.data
    has_bool = "is_completed" in request.data
    if not (has_status or has_bool):
        return None, None
    value = request.data.get("is_completed")
    if has_bool and type(value) is not bool:
        if isinstance(value, str) and value.strip().lower() in ("true", "false", "1", "0"):
            value = value.strip().lower() in ("true", "1")
        else:
            return None, error_response(message="وضعیت انتخاب‌شده معتبر نیست.", status_code=400)
    selected = (TaskAssignment.Status.DONE if value else TaskAssignment.Status.PENDING) if has_bool else None
    if has_status:
        serializer = TaskStatusSerializer(data={"status": request.data.get("status")})
        if not serializer.is_valid():
            return None, error_response(message="وضعیت انتخاب‌شده معتبر نیست.", status_code=400)
        if selected is not None and selected != serializer.validated_data["status"]:
            return None, error_response(message="لطفاً فقط یک وضعیت برای کار انتخاب کنید.", status_code=400)
        selected = serializer.validated_data["status"]
    return selected, None


def _update_task_assignments(request, task, new_status, *, assignee_id=None, apply_to_all=False):
    """Only the task's manager can modify others; a recipient modifies their own."""
    user = request.user
    can_manage = _is_superadmin(user) or (
        task.created_by_id == user.pk and _can_assign_tasks(user)
    )
    qs = TaskAssignment.objects.select_for_update().filter(task_id=task.pk)
    if can_manage:
        if assignee_id is not None:
            try:
                assignee_id = int(assignee_id)
            except (ValueError, TypeError):
                return error_response(message="کاربر انتخاب‌شده معتبر نیست.", status_code=400)
            qs = qs.filter(assignee_id=assignee_id)
        elif not apply_to_all:
            qs = qs.filter(assignee_id=user.pk)
            if not qs.exists():
                qs = TaskAssignment.objects.select_for_update().filter(task_id=task.pk)
    else:
        if assignee_id is not None and str(assignee_id) != str(user.pk):
            return error_response(message="امکان تغییر وضعیت این کار را ندارید.", status_code=403)
        qs = qs.filter(assignee_id=user.pk)
    assignments = list(qs)
    if not assignments:
        # A legacy task may have been created without any TaskAssignment rows.
        # Only its creator can explicitly take responsibility for such a task.
        # Never create an assignment for an unrelated user implicitly.
        if (can_manage and task.created_by_id == user.pk
                and assignee_id is None
                and not TaskAssignment.objects.filter(task_id=task.pk).exists()):
            assignment, _ = TaskAssignment.objects.get_or_create(
                task=task, assignee=user,
                defaults={"status": TaskAssignment.Status.PENDING},
            )
            assignments = [assignment]
        else:
            return error_response(
                message="برای این کار هنوز دریافت‌کننده‌ای مشخص نشده است.",
                status_code=404,
            )
    now = timezone.now()
    for assignment in assignments:
        assignment.status = new_status
        assignment.completed_at = now if new_status == TaskAssignment.Status.DONE else None
        assignment.save(update_fields=["status", "completed_at", "updated_at"])
    record_activity(request, event="task.status_change", target_type="task",
                    target_id=task.pk, target_label=task.title, description="وضعیت کار تغییر کرد.")
    return None


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

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(models.Q(title__icontains=search) | models.Q(description__icontains=search))
        state = request.query_params.get('status', '')
        if state:
            if state not in Announcement.Status.values:
                return error_response('وضعیت نامعتبر است.', status_code=400)
            queryset = queryset.filter(status=state)
        paginator = UserPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = AnnouncementListSerializer(page, many=True, context={'request': request})
        return success_response('لیست اطلاعیه‌ها', data={
            'total_results': paginator.page.paginator.count, 'page': paginator.page.number,
            'page_size': paginator.get_page_size(request), 'results': serializer.data,
        })

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

        record_activity(request, event="announcement.create", target_type="announcement", target_id=announcement.pk, target_label=announcement.title, description="اطلاعیه جدید ثبت شد.")

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

        record_activity(request, event="announcement.update", target_type="announcement", target_id=announcement.pk, target_label=announcement.title, description="اطلاعیه ویرایش شد.")

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

        record_activity(request, event="announcement.delete", target_type="announcement", target_id=announcement_id, target_label=announcement.title, description="اطلاعیه حذف شد.")

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


class PanelUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    agency_id = serializers.IntegerField(required=False, min_value=1, write_only=True)

    class Meta:
        model = User
        fields = (
            "phone", "password", "first_name", "last_name", "email",
            "role", "agency_id", "user_type", "national_code",
            "birth_date", "province", "city", "postal_code", "address", "avatar",
            "admin_level", "is_staff", "is_superuser",
        )
        extra_kwargs = {
            "role": {"required": True},
            "phone": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("این شماره موبایل قبلاً ثبت شده است.")
        return value

    def validate_email(self, value):
        if not value:
            return None
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        role = attrs.get("role")
        if role not in (User.Role.SUPER_ADMIN, User.Role.AGENCY, User.Role.EXPERT, User.Role.USER):
            raise serializers.ValidationError({"role": "ایجاد این نقش مجاز نیست."})
        if _is_agency(request.user):
            if role != User.Role.EXPERT:
                raise serializers.ValidationError({"role": "املاکی فقط می‌تواند کارشناس ایجاد کند."})
            if "agency_id" in attrs and attrs["agency_id"] != request.user.pk:
                raise serializers.ValidationError({"agency_id": "اجازه افزودن کارشناس به دفتر دیگری را ندارید."})
            attrs["agency_id"] = request.user.pk
        elif not _is_superadmin(request.user):
            raise serializers.ValidationError("دسترسی غیرمجاز.")
        if attrs.get('is_superuser') and not request.user.is_superuser:
            raise serializers.ValidationError({'is_superuser': 'فقط سوپریوزر اجازه اعطای این دسترسی را دارد.'})
        if role != User.Role.SUPER_ADMIN and (attrs.get('is_staff') or attrs.get('is_superuser')):
            raise serializers.ValidationError({'role': 'دسترسی مدیریتی برای این نقش مجاز نیست.'})
        if role == User.Role.EXPERT:
            if not attrs.get("agency_id"):
                raise serializers.ValidationError({"agency_id": "شناسه دفتر املاک برای کارشناس الزامی است."})
            agency = User.objects.filter(
                pk=attrs["agency_id"], role=User.Role.AGENCY,
                is_active=True, account_status=User.AccountStatus.ACTIVE,
            ).first()
            if agency is None:
                raise serializers.ValidationError({"agency_id": "دفتر املاک فعال و معتبر پیدا نشد."})
        elif "agency_id" in attrs:
            raise serializers.ValidationError({"agency_id": "این فیلد فقط برای نقش کارشناس قابل استفاده است."})
        return attrs


def _role_profile_payload(request, role, partial=False, instance=None, data_override=None):
    field_name = "agency_profile" if role == User.Role.AGENCY else "expert_profile"
    cls = AgencyProfileSerializer if role == User.Role.AGENCY else ExpertProfileSerializer
    payload = data_override if data_override is not None else request.data
    data = payload.get(field_name)
    if data is None:
        data = {key: payload[key] for key in cls.Meta.fields if key in payload and key not in ("manager_id", "manager_name", "agency_id", "office_verification_status", "agency_name")}
        # agency_name is writable for agencies, not for experts
        if role == User.Role.AGENCY and "agency_name" in payload:
            data["agency_name"] = payload["agency_name"]
        if role == User.Role.AGENCY and _is_superadmin(request.user) and 'office_verification_status' in payload:
            data['office_verification_status'] = payload['office_verification_status']
    if not isinstance(data, dict):
        raise serializers.ValidationError({field_name: "اطلاعات پروفایل باید به صورت آبجکت ارسال شود."})
    serializer = cls(instance=instance, data=data, partial=partial, context={"request": request})
    serializer.is_valid(raise_exception=True)
    return serializer


class PanelUserListView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [
        IsAuthenticated,
        CanManageUsers,
    ]

    def get(self, request):
        queryset = _managed_users(
            request.user
        ).order_by("-id")

        group = (request.query_params.get("group") or request.query_params.get("role") or "").strip().strip("/").lower()
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


    @transaction.atomic
    def post(self, request):
        serializer = PanelUserCreateSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return _validation_error(serializer)

        values = dict(serializer.validated_data)
        role = values["role"]
        profile_serializer = None
        if role in (User.Role.AGENCY, User.Role.EXPERT):
            profile_serializer = _role_profile_payload(request, role)
        password = values.pop("password")
        agency_id = values.pop("agency_id", None)
        values["is_staff"] = role == User.Role.SUPER_ADMIN
        values["is_superuser"] = bool(values.get('is_superuser', False)) if role == User.Role.SUPER_ADMIN else False
        values["is_active"] = True
        values["account_status"] = User.AccountStatus.ACTIVE
        try:
            user = User.objects.create_user(password=password, **values)
            if user.role == User.Role.EXPERT:
                AgencyExpert.objects.create(agency_id=agency_id, expert=user)
                profile_serializer.save(user=user)
            elif user.role == User.Role.AGENCY:
                profile_serializer.save(manager=user)
        except IntegrityError:
            return error_response(
                message="شماره موبایل، ایمیل یا کد ملی تکراری است یا ارتباط کارشناس قابل ثبت نیست.",
                status_code=400,
            )

        record_activity(request, event="user.create", target_type="user", target_id=user.pk, target_label=getattr(user, "full_name", ""), description="کاربر جدید ایجاد شد.")

        return success_response(
            message="کاربر با موفقیت ایجاد شد.",
            data=PanelUserDetailSerializer(user, context={"request": request}).data,
            status_code=201,
        )


class PanelUserDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
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

    @transaction.atomic
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

        # Normalize legacy frontend alias without modifying DRF request internals.
        payload = request.data.copy()
        if "ownership_type" in payload:
            if user.role != User.Role.AGENCY:
                return error_response(message="ownership_type فقط برای پروفایل املاکی مجاز است.", status_code=400)
            alias_value = payload.get("ownership_type")
            if "occupancy_type" in payload and payload.get("occupancy_type") != alias_value:
                return error_response(message="مقادیر ownership_type و occupancy_type مغایرت دارند.", status_code=400)
            if "agency_profile" in payload and isinstance(payload["agency_profile"], dict):
                nested = dict(payload["agency_profile"])
                if "occupancy_type" in nested and nested["occupancy_type"] != alias_value:
                    return error_response(message="مقدار نوع مالکیت در پروفایل مغایرت دارد.", status_code=400)
                nested["occupancy_type"] = alias_value
                payload["agency_profile"] = nested
            else:
                payload["occupancy_type"] = alias_value
            payload.pop("ownership_type", None)

        # جلوگیری از ارسال فیلدهای خارج از محدوده ویرایش
        allowed_fields = set(
            PanelUserUpdateSerializer.Meta.fields
        )

        submitted_fields = set(payload.keys())
        role_profile_key = "agency_profile" if user.role == User.Role.AGENCY else "expert_profile" if user.role == User.Role.EXPERT else None
        extra_fields = {"avatar"}
        if is_admin:
            extra_fields.update({"is_staff", "is_superuser"})
        if role_profile_key:
            extra_fields.add(role_profile_key)
            profile_cls = AgencyProfileSerializer if user.role == User.Role.AGENCY else ExpertProfileSerializer
            extra_fields.update(profile_cls.Meta.fields)
        unknown_fields = submitted_fields - allowed_fields - extra_fields

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
                "email", "phone", "birth_date", "province", "city", "postal_code", "address", "user_type", "account_status", "is_active", "avatar", "expert_profile", "expert_code", "job_title", "specialties", "experience_years", "professional_document", "job_details", "bio",
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
            if payload.get("is_active") is False:
                return error_response(
                    message=(
                        "نمی‌توانید حساب کاربری "
                        "خودتان را غیرفعال کنید."
                    ),
                    status_code=400,
                )

            if (
                "role" in payload
                and payload["role"] != User.Role.SUPER_ADMIN
            ):
                return error_response(
                    message=(
                        "نمی‌توانید نقش مدیریتی "
                        "خودتان را تغییر دهید."
                    ),
                    status_code=400,
                )

        profile_serializer = None
        if role_profile_key and submitted_fields.intersection(extra_fields - {"avatar"}):
            profile = (AgencyProfile.objects.filter(manager=user).first() if user.role == User.Role.AGENCY else ExpertProfile.objects.filter(user=user).first())
            profile_serializer = _role_profile_payload(request, user.role, partial=True, instance=profile, data_override=payload)
        # Explicitly validate all permission flags. Do not silently accept no-op updates.
        flag_data = {}
        if is_admin:
            from rest_framework.fields import BooleanField
            for key in ("is_staff", "is_superuser"):
                if key in payload:
                    try:
                        flag_data[key] = BooleanField().run_validation(payload[key])
                    except serializers.ValidationError:
                        return error_response(message=f"مقدار {key} نامعتبر است.", status_code=400)

            if flag_data and not request.user.is_superuser:
                return error_response(message="فقط سوپریوزر واقعی اجازه تغییر مجوزهای سیستمی را دارد.", status_code=403)

            desired_superuser = flag_data.get("is_superuser", user.is_superuser)
            desired_staff = flag_data.get("is_staff", user.is_staff)
            desired_role = payload.get("role", user.role)

            # Keep the administrator's own login and the platform's root access safe.
            if user.pk == request.user.pk and (not desired_superuser or not desired_staff or desired_role != User.Role.SUPER_ADMIN):
                return error_response(message="امکان حذف دسترسی مدیریتی حساب خودتان وجود ندارد. از حساب سوپریوزر دیگری استفاده کنید.", status_code=403)
            if user.is_superuser and not desired_superuser:
                remaining = User.objects.filter(is_superuser=True, is_active=True).exclude(pk=user.pk).exists()
                if not remaining:
                    return error_response(message="آخرین سوپریوزر فعال سامانه را نمی‌توان تنزل داد.", status_code=403)
            if desired_superuser and not desired_staff:
                return error_response(message="سوپریوزر باید is_staff=true داشته باشد.", status_code=400)
            if desired_superuser and desired_role != User.Role.SUPER_ADMIN:
                return error_response(message="نقش سوپریوزر باید superadmin باشد.", status_code=400)
            if desired_role == User.Role.SUPER_ADMIN and not desired_staff:
                return error_response(message="نقش superadmin نیازمند is_staff=true است.", status_code=400)
            if user.is_superuser and desired_role != User.Role.SUPER_ADMIN and desired_superuser:
                return error_response(message="برای تغییر نقش سوپریوزر باید is_superuser=false نیز ارسال شود.", status_code=400)
        else:
            if "is_staff" in payload or "is_superuser" in payload:
                return error_response(message="شما اجازه تغییر دسترسی سیستمی را ندارید.", status_code=403)

        base_data = {key: payload[key] for key in allowed_fields if key in payload}
        serializer = PanelUserUpdateSerializer(
            user,
            data=base_data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            return _validation_error(serializer)

        if profile_serializer is not None and not profile_serializer.is_valid():
            return _validation_error(profile_serializer)
        # A role downgrade must also revoke the Django superuser flag explicitly.
        if "role" in serializer.validated_data and serializer.validated_data["role"] != User.Role.SUPER_ADMIN and user.is_superuser and flag_data.get("is_superuser") is not False:
            return error_response(message="برای تنزل نقش سوپریوزر، is_superuser=false را هم ارسال کنید.", status_code=400)
        serializer.save()
        if "role" in serializer.validated_data and "is_staff" not in flag_data:
            user.is_staff = user.role == User.Role.SUPER_ADMIN
            user.save(update_fields=["is_staff"])
        if "account_status" in serializer.validated_data and "is_active" not in serializer.validated_data:
            user.is_active = user.account_status == User.AccountStatus.ACTIVE
            user.save(update_fields=["is_active"])
        if "is_active" in serializer.validated_data and "account_status" not in serializer.validated_data:
            user.account_status = User.AccountStatus.ACTIVE if user.is_active else User.AccountStatus.INACTIVE
            user.save(update_fields=["account_status"])
        if flag_data:
            for flag, value in flag_data.items():
                setattr(user, flag, value)
            user.save(update_fields=list(flag_data))
        if "avatar" in payload:
            avatar = serializers.ImageField(allow_null=True).run_validation(payload["avatar"])
            user.avatar = avatar
            user.save(update_fields=["avatar"])
        if profile_serializer:
            if user.role == User.Role.AGENCY:
                profile_serializer.save(manager=user)
            else:
                profile_serializer.save(user=user)

        user.profile_updated_at = timezone.now()
        user.save(update_fields=['profile_updated_at'])
        user.refresh_from_db()

        record_activity(request, event="user.update", target_type="user", target_id=user.pk, target_label=getattr(user, "full_name", ""), description="اطلاعات کاربر ویرایش شد.")

        return success_response(
            message="اطلاعات کاربر با موفقیت ویرایش شد.",
            data=PanelUserDetailSerializer(
                user,
                context={"request": request},
            ).data,
        )


    @transaction.atomic
    def delete(self, request, user_id):
        target = get_object_or_404(_managed_users(request.user), pk=user_id)
        if target.pk == request.user.pk or target.is_superuser or _is_superadmin(target):
            return error_response(message="غیرفعال‌سازی حساب مدیریتی یا حساب خودتان مجاز نیست.", status_code=403)
        if _is_agency(request.user) and target.role != User.Role.EXPERT:
            return error_response(message="فقط کارشناسان دفتر خودتان قابل مدیریت هستند.", status_code=403)
        target.is_active = False
        target.account_status = User.AccountStatus.INACTIVE
        target.save(update_fields=["is_active", "account_status"])
        if target.role == User.Role.EXPERT:
            AgencyExpert.objects.filter(expert=target).update(is_active=False)
        record_activity(request, event="user.deactivate", target_type="user", target_id=target.pk, target_label=getattr(target, "full_name", ""), description="حساب کاربر غیرفعال شد.")

        return success_response(
            message="حساب کاربر غیرفعال شد؛ اطلاعات و سوابق حذف نشده‌اند.",
            data={"id": target.pk, "is_active": False, "account_status": target.account_status},
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

        record_activity(request, event="expert.link", target_type="agency_expert", target_id=link.pk, target_label=str(expert.pk), description="ارتباط کارشناس و دفتر ثبت یا فعال شد.")
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

        record_activity(request, event="expert.unlink", target_type="agency_expert", target_id=link.pk, target_label=str(link.expert_id), description="عضویت کارشناس در دفتر غیرفعال شد.")
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
        params = request.query_params
        date_str = params.get('date')
        period = params.get('period', 'all')
        if period not in ('all', 'today', 'overdue', 'upcoming'):
            return error_response('بازه زمانی معتبر نیست.', status_code=400)
        if date_str:
            try: selected_day = date.fromisoformat(date_str)
            except (ValueError, TypeError): return error_response('تاریخ باید به صورت YYYY-MM-DD باشد.', status_code=400)
            queryset = queryset.filter(due_date=selected_day)
        elif period == 'today': queryset = queryset.filter(due_date=timezone.localdate())
        elif period == 'overdue': queryset = queryset.filter(due_date__lt=timezone.localdate())
        elif period == 'upcoming': queryset = queryset.filter(due_date__gt=timezone.localdate())
        scope = params.get('scope', 'all')
        if scope == 'received': queryset = queryset.filter(assignments__assignee=request.user)
        elif scope == 'created': queryset = queryset.filter(created_by=request.user)
        elif scope != 'all': return error_response('مقدار scope معتبر نیست.', status_code=400)
        term = params.get('search', '').strip()[:200]
        if term: queryset = queryset.filter(models.Q(title__icontains=term) | models.Q(description__icontains=term))
        rows = [_task_response_data(task, request.user, refresh=False) for task in queryset.distinct().order_by('due_date', '-id')]
        state = params.get('status')
        if state:
            if state not in TaskAssignment.Status.values: return error_response('وضعیت معتبر نیست.', status_code=400)
            rows = [row for row in rows if row['status'] == state]
        stats = {'total': len(rows), 'pending': sum(row['status']=='pending' for row in rows), 'in_progress':sum(row['status']=='in_progress' for row in rows), 'done':sum(row['status']=='done' for row in rows)}
        if 'page' in params or 'page_size' in params:
            paginator=UserPagination(); page=paginator.paginate_queryset(rows,request,view=self)
            results=page
        else: results=rows
        return success_response('فهرست کارها', data={'total_results':len(rows),'results':results,'stats':stats,'today':timezone.localdate().isoformat()})

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

        TaskAssignment.objects.bulk_create([TaskAssignment(task=task,assignee=user) for user in users])
        from accounts.notices import notify
        for recipient in users:
            transaction.on_commit(lambda recipient=recipient: notify(recipient,'task','وظیفه جدید',task.title,f'/tasks/{task.pk}'))

        task = ImportantTask.objects.prefetch_related(
            "assignments__assignee"
        ).get(pk=task.id)

        record_activity(request, event="task.create", target_type="task", target_id=task.pk, target_label=task.title, description="کار مهم جدید ایجاد شد.")

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

    @transaction.atomic
    def patch(self, request, task_id):
        task = get_object_or_404(ImportantTask, pk=task_id)
        if not (_is_superadmin(request.user) or (task.created_by_id == request.user.pk and _can_assign_tasks(request.user))):
            return error_response(message="اجازه ویرایش ندارید.", status_code=403)
        new_status, error = _task_requested_status(request)
        if error is not None:
            return error
        allowed = {"title", "description", "due_date", "status", "is_completed", "assignee_id", "apply_to_all"}
        unknown = set(request.data.keys()) - allowed
        if unknown:
            return error_response(message="اطلاعات ارسالی برای ویرایش این کار معتبر نیست.", status_code=400)
        update_data = {key: request.data[key] for key in ("title", "description", "due_date") if key in request.data}
        serializer = TaskUpdateSerializer(task, data=update_data, partial=True)
        if not serializer.is_valid():
            return _validation_error(serializer)
        if new_status is not None:
            result = _update_task_assignments(
                request, task, new_status,
                assignee_id=request.data.get("assignee_id"),
                apply_to_all=request.data.get("assignee_id") is None,
            )
            if result is not None:
                return result
        task = serializer.save() if update_data else task
        if not update_data and new_status is None:
            return error_response(message="تغییری برای ذخیره انتخاب نشده است.", status_code=400)
        if update_data:
            record_activity(request, event="task.update", target_type="task", target_id=task.pk,
                            target_label=task.title, description="کار مهم ویرایش شد.")
        return success_response(message="تسک ویرایش شد.", data=_task_response_data(task, request.user))

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

        record_activity(request, event="task.delete", target_type="task", target_id=task.pk, target_label=task.title, description="کار مهم حذف شد.")

        return success_response(
            message="تسک حذف شد.",
            data={"deleted_id": task_id},
        )


class TaskAssignmentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, assignment_id):
        return self.patch(request, assignment_id)

    def patch(self, request, assignment_id):
        assignment = get_object_or_404(
            TaskAssignment,
            pk=assignment_id,
        )

        if not (_is_superadmin(request.user) or (assignment.task.created_by_id == request.user.id and _can_assign_tasks(request.user))):
            return error_response(
                message=(
                    "فقط دریافت‌کننده می‌تواند "
                    "وضعیت تسک را تغییر دهد."
                ),
                status_code=403,
            )

        new_status, error = _task_requested_status(request)
        if error is not None:
            return error
        if new_status is None:
            new_status = (TaskAssignment.Status.PENDING
                          if assignment.status == TaskAssignment.Status.DONE
                          else TaskAssignment.Status.DONE)

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

        record_activity(request, event="task.status_change", target_type="task", target_id=assignment.task_id, target_label=assignment.task.title, description="وضعیت کار تغییر کرد.")

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

        visible = _visible_tasks(user).filter(due_date=today)
        visible_tasks = [_task_response_data(task,user,refresh=False) for task in visible]
        visible_tasks.sort(key=lambda row: (row['status']=='done', -row['id']))
        total_tasks=len(visible_tasks)
        completed_tasks=sum(row['status']=='done' for row in visible_tasks)
        tasks=visible_tasks[:4]

        return success_response(
            message="اطلاعات پیشخوان",
            data={
                "announcements": {
                    "total_results": len(announcements),
                    "results": announcements,
                },
                "personal_reminders": {
                    "total_results": PersonalReminder.objects.filter(owner=user,is_done=False).count(),
                    "results": ReminderSerializer(PersonalReminder.objects.filter(owner=user,is_done=False).order_by('remind_at','id')[:3],many=True).data,
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
    """POST toggles a task when no status is provided; explicit values also work.

    URL identifier is a task ID by default. For a user's own assignment ID,
    use assignment_id in the request body to avoid collisions.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request, assignment_id):
        return self._change(request, assignment_id)

    def patch(self, request, assignment_id):
        return self._change(request, assignment_id)

    @transaction.atomic
    def _change(self, request, assignment_id):
        user = request.user
        if not _can_assign_tasks(user):return error_response('فقط سوپرادمین و املاکی مجاز به تغییر وظیفه هستند.',status_code=403)
        # URL convention: task id. Preserve legacy assignment-id calls only
        # when no matching visible task exists.
        task = _visible_tasks(user).filter(pk=assignment_id).first()
        own_assignment = None
        if task is None:
            own_assignment = (TaskAssignment.objects.select_related("task")
                              .filter(pk=assignment_id, assignee=user).first())
            if own_assignment:
                task = own_assignment.task
        if task is None:
            return error_response(message="این کار برای شما پیدا نشد.", status_code=404)

        manager = _is_superadmin(user) or (
            task.created_by_id == user.pk and _can_assign_tasks(user)
        )
        assignee_id = request.data.get("assignee_id")
        if assignee_id in ("", None):
            assignee_id = None
        elif str(assignee_id).isdigit():
            assignee_id = int(assignee_id)
        else:
            return error_response(message="کاربر انتخاب‌شده معتبر نیست.", status_code=400)

        if not manager:
            if assignee_id is not None and assignee_id != user.pk:
                return error_response(message="امکان تغییر وضعیت این کار را ندارید.", status_code=403)
            assignee_id = user.pk

        new_status, error = _task_requested_status(request)
        if error is not None:
            return error
        if new_status is None:
            # A checkbox click with an empty POST body means toggle.
            # For managers, use the aggregate state of all assignments.
            qs = TaskAssignment.objects.filter(task_id=task.pk)
            if not manager or assignee_id is not None:
                qs = qs.filter(assignee_id=assignee_id)
            statuses = list(qs.values_list("status", flat=True))
            all_done = bool(statuses) and all(
                s == TaskAssignment.Status.DONE for s in statuses
            )
            new_status = (TaskAssignment.Status.PENDING if all_done
                          else TaskAssignment.Status.DONE)

        result = _update_task_assignments(
            request, task, new_status,
            assignee_id=assignee_id,
            apply_to_all=manager and assignee_id is None,
        )
        if result is not None:
            return result
        data = _task_response_data(task, user)
        return success_response(
            message=("کار با موفقیت انجام شد." if data["is_completed"]
                     else "وضعیت کار با موفقیت تغییر کرد."),
            data=data,
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


from accounts.sessions import SessionJWTAuthentication

class OriginalAdminAuthentication(SessionJWTAuthentication):
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
        existing = request.COOKIES.get(IMPERSONATION_COOKIE)
        if existing and ImpersonationSession.objects.filter(
            actor=request.user, token_hash=hashlib.sha256(existing.encode()).hexdigest(),
            revoked_at__isnull=True, expires_at__gt=timezone.now(),
        ).exists():
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
                ip_address=_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            )
            _imp_audit(session, "START", request)
        record_activity(request, event="impersonation.start", target_type="user", target_id=target.pk, description="ورود مدیریتی به حساب کاربر آغاز شد.")
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
                    record_activity(request, event="impersonation.stop", target_type="user", target_id=session.target_id, description="ورود مدیریتی پایان یافت.")
        return _imp_cookie(success_response("به پنل مدیریت بازگشتید.", data={"active": False}))


@ensure_csrf_cookie
def ImpersonationCsrfView(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "message": "Method not allowed"}, status=405)
    get_token(request)
    return JsonResponse({"success": True, "message": "CSRF آماده است.", "data": {}})


def _has_active_impersonation(request):
    raw=request.COOKIES.get(IMPERSONATION_COOKIE)
    return bool(raw and ImpersonationSession.objects.filter(actor=request.user,token_hash=hashlib.sha256(raw.encode()).hexdigest(),revoked_at__isnull=True,expires_at__gt=timezone.now(),target__is_active=True).exists())


class ActivityLogListView(APIView):
    authentication_classes = [OriginalAdminAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_superadmin(request.user) or _has_active_impersonation(request):
            raise PermissionDenied('مشاهده لاگ‌ها فقط برای سوپرادمین در نشست اصلی مجاز است.')
        qs = ActivityLog.objects.select_related('actor', 'real_actor').order_by('-created_at','-id')
        qs=qs.exclude(event='http.request',method__in=['GET','HEAD','OPTIONS'])
        params=request.query_params
        for key in ('actor_id','real_actor_id','status_code'):
            if params.get(key):
                try: number=int(params[key])
                except (TypeError,ValueError): return error_response(f'مقدار {key} باید عدد باشد.',status_code=400)
                qs=qs.filter(**{key:number})
        if params.get('category'): qs=qs.filter(category=params['category'])
        if params.get('method'):
            method=params['method'].upper()
            if method not in ('GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD'): return error_response('نوع درخواست معتبر نیست.',status_code=400)
            qs=qs.filter(method=method)
        state=params.get('status')
        if state=='success': qs=qs.filter(status_code__lt=400)
        elif state=='failure': qs=qs.filter(status_code__gte=400)
        elif state: return error_response('وضعیت معتبر نیست.',status_code=400)
        term=params.get('search','').strip()[:200]
        if term: qs=qs.filter(models.Q(path__icontains=term)|models.Q(event__icontains=term)|models.Q(actor__first_name__icontains=term)|models.Q(actor__last_name__icontains=term)|models.Q(ip_address__icontains=term)|models.Q(metadata__description__icontains=term))
        event=params.get('action') or params.get('event')
        if event: qs=qs.filter(event=event)
        if params.get('target_type'): qs=qs.filter(metadata__target_type=params['target_type'])
        from datetime import datetime, time, timedelta
        for key in ('start_date','end_date'):
            if params.get(key):
                try: day=date.fromisoformat(params[key])
                except (ValueError,TypeError): return error_response('تاریخ باید به صورت YYYY-MM-DD باشد.',status_code=400)
                if key=='end_date': day+=timedelta(days=1)
                boundary=timezone.make_aware(datetime.combine(day,time.min))
                qs=qs.filter(**({'created_at__gte':boundary} if key=='start_date' else {'created_at__lt':boundary}))
        if params.get('export')=='csv':
            import csv,io
            from django.http import HttpResponse
            output=io.StringIO(); output.write('\ufeff'); writer=csv.writer(output)
            writer.writerow(['شناسه','کاربر','رویداد','نوع درخواست','مسیر','وضعیت','IP','زمان'])
            def safe(value):
                text=str(value or '')
                return "'"+text if text.startswith(('=','+','-','@')) else text
            for row in qs[:10000]: writer.writerow([row.pk,safe(row.actor.full_name if row.actor else ''),safe(row.event),row.method,safe(row.path),row.status_code,row.ip_address or '',row.created_at.isoformat()])
            result=HttpResponse(output.getvalue(),content_type='text/csv; charset=utf-8')
            result['Content-Disposition']='attachment; filename="mlkino-activity.csv"'
            result['X-Export-Truncated']='true' if qs.count()>10000 else 'false'
            return result
        total=qs.count(); success=qs.filter(status_code__lt=400).count()
        stats={'total':total,'success':success,'failure':qs.filter(status_code__gte=400).count(),'today':qs.filter(created_at__date=timezone.localdate()).count(),'actors':qs.exclude(actor_id=None).values('actor_id').distinct().count()}
        actors=list(ActivityLog.objects.exclude(actor_id=None).order_by('actor_id').values('actor_id','actor__first_name','actor__last_name').distinct()[:200])
        paginator=UserPagination(); page=paginator.paginate_queryset(qs,request,view=self)
        from panel.serializers import ActivityLogSerializer
        return success_response('گزارش فعالیت‌های سامانه',data={'total_results':total,'page':paginator.page.number,'page_size':paginator.get_page_size(request),'results':ActivityLogSerializer(page,many=True).data,'stats':stats,'actors':actors})


class ActivityLogDetailView(APIView):
    authentication_classes = [OriginalAdminAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, log_id):
        if not _is_superadmin(request.user) or _has_active_impersonation(request):
            raise PermissionDenied("دسترسی غیرمجاز.")
        from panel.serializers import ActivityLogSerializer
        obj = get_object_or_404(ActivityLog.objects.select_related("actor", "real_actor"), pk=log_id)
        return success_response("جزئیات فعالیت", data=ActivityLogSerializer(obj).data)

# ============================================================
# SUPPORT TICKETS (all business logic remains in views.py)
# ============================================================
from django.db.models import Count
from panel.models import SupportTicket, SupportTicketMessage
from panel.serializers import (TicketSerializer, TicketDetailSerializer, TicketCreateSerializer,
                               TicketReplySerializer, TicketStatusSerializer, TicketAssignSerializer)


def _ticket_admin(request):
    return _is_superadmin(request.user)


def _ticket_queryset(request):
    qs = SupportTicket.objects.select_related("creator", "assigned_to")
    if not _ticket_admin(request):
        qs = qs.filter(creator=request.user)
    return qs


def _ticket_detail(ticket, request):
    return TicketDetailSerializer(ticket, context={"is_admin": _ticket_admin(request), "request": request}).data


def _ticket_audit(request, event, ticket, description):
    record_activity(request, event=event, target_type="ticket", target_id=ticket.pk,
                    target_label=ticket.subject, description=description)


class TicketListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _ticket_queryset(request)
        if request.query_params.get("status"):
            val = request.query_params["status"]
            if val not in SupportTicket.Status.values:
                return error_response(message="وضعیت نامعتبر است.", status_code=400)
            qs = qs.filter(status=val)
        if request.query_params.get("category"):
            val = request.query_params["category"]
            if val not in SupportTicket.Category.values:
                return error_response(message="دسته‌بندی نامعتبر است.", status_code=400)
            qs = qs.filter(category=val)
        if request.query_params.get("search"):
            term = request.query_params["search"].strip()
            qs = qs.filter(models.Q(subject__icontains=term) | models.Q(messages__body__icontains=term, messages__is_internal=False)).distinct()
        if request.query_params.get("creator_id") and _ticket_admin(request):
            try:
                qs = qs.filter(creator_id=int(request.query_params["creator_id"]))
            except (TypeError, ValueError):
                return error_response(message="شناسه کاربر نامعتبر است.", status_code=400)
        for key in ('start_date', 'end_date'):
            if request.query_params.get(key):
                try: day = date.fromisoformat(request.query_params[key])
                except (ValueError, TypeError): return error_response('تاریخ معتبر نیست.', status_code=400)
                qs = qs.filter(**{('created_at__date__gte' if key == 'start_date' else 'created_at__date__lte'): day})
        stats = {value: qs.filter(status=value).count() for value in SupportTicket.Status.values}
        assignees = list(User.objects.filter(role=User.Role.SUPER_ADMIN, is_active=True).values('id', 'first_name', 'last_name')) if _ticket_admin(request) else []
        qs = qs.annotate(messages_count=Count("messages", distinct=True))
        paginator = UserPagination()
        page = paginator.paginate_queryset(qs.order_by("-updated_at", "-id"), request, view=self)
        return success_response(message="لیست تیکت‌ها", data={
            "total_results": paginator.page.paginator.count,
            "page": paginator.page.number,
            "page_size": paginator.get_page_size(request),
            "results": TicketSerializer(page, many=True).data,
            "stats": stats, "assignees": assignees,
        })

    @transaction.atomic
    def post(self, request):
        if _ticket_admin(request):
            return error_response(message="سوپرادمین فقط مجاز به مشاهده و پاسخ‌گویی تیکت‌هاست.", status_code=403)
        serializer = TicketCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return _validation_error(serializer)
        data = serializer.validated_data
        ticket = SupportTicket.objects.create(creator=request.user, category=data["category"], subject=data["subject"])
        SupportTicketMessage.objects.create(ticket=ticket, author=request.user, body=data["message"], attachment=data.get("attachment"))
        _ticket_audit(request, "ticket.create", ticket, "تیکت جدید ثبت شد.")
        return success_response(message="تیکت ثبت شد.", data=_ticket_detail(ticket, request), status_code=201)


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        ticket = get_object_or_404(_ticket_queryset(request), pk=ticket_id)
        return success_response(message="جزئیات تیکت", data=_ticket_detail(ticket, request))


class TicketReplyView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, ticket_id):
        ticket = get_object_or_404(_ticket_queryset(request).select_for_update(of=("self",)), pk=ticket_id)
        serializer = TicketReplySerializer(data=request.data)
        if not serializer.is_valid():
            return _validation_error(serializer)
        admin = _ticket_admin(request)
        if serializer.validated_data["is_internal"] and not admin:
            return error_response(message="یادداشت داخلی فقط برای مدیریت مجاز است.", status_code=403)
        if ticket.status == SupportTicket.Status.CLOSED:
            return error_response(message="تیکت بسته است؛ ابتدا آن را باز کنید.", status_code=409)
        msg = SupportTicketMessage.objects.create(ticket=ticket, author=request.user,
            body=serializer.validated_data["message"], attachment=serializer.validated_data.get("attachment"), is_internal=serializer.validated_data["is_internal"])
        if not msg.is_internal:
            ticket.status = SupportTicket.Status.ANSWERED if admin else SupportTicket.Status.OPEN
        ticket.save(update_fields=["status", "updated_at"])
        if not msg.is_internal and ticket.creator_id != request.user.pk:
            from accounts.notices import notify
            transaction.on_commit(lambda: notify(ticket.creator,'ticket','پاسخ جدید پشتیبانی',ticket.subject,f'/tickets/{ticket.pk}'))
        _ticket_audit(request, "ticket.reply", ticket, "یادداشت داخلی ثبت شد." if msg.is_internal else "پاسخ جدید به تیکت ثبت شد.")
        return success_response(message="پیام ثبت شد.", data=_ticket_detail(ticket, request), status_code=201)


class TicketStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, ticket_id):
        ticket = get_object_or_404(_ticket_queryset(request).select_for_update(of=("self",)), pk=ticket_id)
        serializer = TicketStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return _validation_error(serializer)
        new = serializer.validated_data["status"]
        admin = _ticket_admin(request)
        if not admin and new not in (SupportTicket.Status.CLOSED, SupportTicket.Status.OPEN):
            return error_response(message="کاربر فقط می‌تواند تیکت را ببندد یا باز کند.", status_code=403)
        if not admin and new == SupportTicket.Status.OPEN and ticket.status != SupportTicket.Status.CLOSED:
            return error_response(message="بازگشایی فقط برای تیکت بسته‌شده مجاز است.", status_code=409)
        if ticket.status == new:
            return success_response(message="وضعیت تغییری نکرد.", data=_ticket_detail(ticket, request))
        previous = ticket.status
        ticket.status = new
        ticket.closed_at = timezone.now() if new == SupportTicket.Status.CLOSED else None
        ticket.save(update_fields=["status", "closed_at", "updated_at"])
        _ticket_audit(request, "ticket.status_change", ticket, f"وضعیت تیکت از {previous} به {new} تغییر کرد.")
        return success_response(message="وضعیت تیکت تغییر کرد.", data=_ticket_detail(ticket, request))


class TicketAssignView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, ticket_id):
        if not _ticket_admin(request):
            return error_response(message="فقط سوپرادمین می‌تواند تیکت را ارجاع دهد.", status_code=403)
        ticket = get_object_or_404(SupportTicket.objects.select_for_update(), pk=ticket_id)
        serializer = TicketAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return _validation_error(serializer)
        assignee_id = serializer.validated_data["assigned_to"]
        if assignee_id is not None:
            user = User.objects.filter(pk=assignee_id, is_active=True, role=User.Role.SUPER_ADMIN).first()
            if not user:
                return error_response(message="مسئول باید سوپرادمین فعال باشد.", status_code=400)
        if ticket.assigned_to_id == assignee_id:
            return success_response(message="مسئول تغییری نکرد.", data=_ticket_detail(ticket, request))
        ticket.assigned_to_id = assignee_id
        ticket.save(update_fields=["assigned_to", "updated_at"])
        _ticket_audit(request, "ticket.assign", ticket, "مسئول رسیدگی به تیکت تغییر کرد.")
        return success_response(message="تیکت ارجاع داده شد.", data=_ticket_detail(ticket, request))

# ============================================================
# PERSONAL REMINDERS / DIRECT CHAT (text, voice/file, receipts)
# ============================================================
from panel.models import PersonalReminder, DirectConversation, DirectMessage, ChatBlock, ChatReport
from panel.serializers import ReminderSerializer, ChatMessageSerializer, ChatConversationSerializer, ChatReportSerializer
from django.db.models import Q
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import FileExtensionValidator
from django.http import FileResponse, Http404


def _chat_qs(user):
    return DirectConversation.objects.filter(Q(user1=user) | Q(user2=user)).select_related("user1", "user2")

def _chat_access(user, chat_id):
    return get_object_or_404(_chat_qs(user), pk=chat_id)

def _chat_blocked(a, b):
    return ChatBlock.objects.filter(Q(blocker=a, blocked=b) | Q(blocker=b, blocked=a)).exists()

def _chat_audit(request, event, target_id):
    # No message content or attachments in audit metadata.
    record_activity(request, event=event, target_type="chat", target_id=target_id)

class ReminderListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = PersonalReminder.objects.filter(owner=request.user)
        status=request.query_params.get('is_done')
        if status in ('true','false'):qs=qs.filter(is_done=status=='true')
        elif status:return error_response('وضعیت یادآوری نامعتبر است.',status_code=400)
        search=request.query_params.get('search','').strip()[:200]
        if search:qs=qs.filter(Q(title__icontains=search)|Q(description__icontains=search))
        for key,lookup in [('start_date','remind_at__date__gte'),('end_date','remind_at__date__lte')]:
            if request.query_params.get(key):
                try:day=date.fromisoformat(request.query_params[key])
                except ValueError:return error_response('تاریخ نامعتبر است.',status_code=400)
                qs=qs.filter(**{lookup:day})
        ordering=request.query_params.get('ordering','remind_at')
        if ordering not in ['remind_at','-remind_at','created_at','-created_at']:return error_response('ترتیب نمایش نامعتبر است.',status_code=400)
        paginator=UserPagination();page=paginator.paginate_queryset(qs.order_by(ordering,'id'),request,view=self)
        return success_response('یادآوری‌های شخصی من',data={'results':ReminderSerializer(page,many=True).data,'total_results':paginator.page.paginator.count})
    def post(self, request):
        ser = ReminderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(owner=request.user)
        record_activity(request, event="reminder.create", target_type="reminder", target_id=obj.pk)
        return success_response("یادآوری ثبت شد", data=ReminderSerializer(obj).data, status_code=201)

class ReminderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def _obj(self, request, reminder_id):
        return get_object_or_404(PersonalReminder, pk=reminder_id, owner=request.user)
    def get(self, request, reminder_id):
        return success_response("یادآوری", data=ReminderSerializer(self._obj(request, reminder_id)).data)
    def patch(self, request, reminder_id):
        obj = self._obj(request, reminder_id)
        ser = ReminderSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        record_activity(request, event="reminder.update", target_type="reminder", target_id=obj.pk)
        return success_response("ویرایش شد", data=ser.data)
    def delete(self, request, reminder_id):
        obj = self._obj(request, reminder_id)
        pk = obj.pk
        obj.delete()
        record_activity(request, event="reminder.delete", target_type="reminder", target_id=pk)
        return success_response("حذف شد")

class ChatContactsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        term = request.query_params.get('search', '').strip()[:100]
        users = User.objects.filter(is_active=True, account_status=User.AccountStatus.ACTIVE).exclude(pk=request.user.pk)
        if term:
            users = users.filter(Q(first_name__icontains=term) | Q(last_name__icontains=term))
        from accounts.models import AccountPreferences
        hidden = AccountPreferences.objects.filter(privacy__listed_in_contacts=False).values_list('user_id',flat=True)
        users = users.exclude(pk__in=hidden)
        return success_response('مخاطبان', data=[{
            'id': user.pk, 'full_name': user.full_name or f'کاربر #{user.pk}', 'role': user.role,
            'avatar': request.build_absolute_uri(user.avatar.url) if user.avatar else None,
        } for user in users.order_by('first_name', 'id')[:100]])


class ChatConversationListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = _chat_qs(request.user)[:100]
        return success_response("گفتگوها", data=ChatConversationSerializer(qs, many=True, context={"request": request}).data)
    def post(self, request):
        try:
            peer_id = int(request.data.get("user_id"))
        except (TypeError, ValueError):
            return error_response("شناسه کاربر نامعتبر است", status_code=400)
        if peer_id == request.user.pk:
            return error_response("گفتگو با خودتان مجاز نیست", status_code=400)
        peer = get_object_or_404(User, pk=peer_id, is_active=True)
        if _chat_blocked(request.user, peer):
            return error_response("امکان گفتگو وجود ندارد", status_code=403)
        a, b = sorted((request.user.pk, peer_id))
        from accounts.models import AccountPreferences
        preference=AccountPreferences.objects.filter(user=peer).first()
        if preference and not preference.privacy.get('allow_new_conversations', True) and not DirectConversation.objects.filter(user1_id=a,user2_id=b).exists():
            return error_response('این کاربر گفتگوی جدید را غیرفعال کرده است.', status_code=403)
        chat, created = DirectConversation.objects.get_or_create(user1_id=a, user2_id=b)
        if created:
            _chat_audit(request, "chat.create", chat.pk)
        return success_response("گفتگو", data=ChatConversationSerializer(chat, context={"request": request}).data, status_code=201 if created else 200)

class ChatConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, chat_id):
        obj = _chat_access(request.user, chat_id)
        return success_response("گفتگو", data=ChatConversationSerializer(obj, context={"request": request}).data)

class ChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get(self, request, chat_id):
        chat = _chat_access(request.user, chat_id)
        try:
            before = int(request.query_params.get("before", "0"))
        except ValueError:
            return error_response("before نامعتبر است")
        qs = chat.messages.select_related("sender").order_by("-id")
        if before > 0:
            qs = qs.filter(pk__lt=before)
        rows = list(qs[:50])
        return success_response("پیام‌ها", data={"results": ChatMessageSerializer(rows, many=True, context={"request": request}).data, "has_more": len(rows) == 50})
    @transaction.atomic
    def post(self, request, chat_id):
        chat = _chat_access(request.user, chat_id)
        peer = chat.user2 if chat.user1_id == request.user.pk else chat.user1
        if _chat_blocked(request.user, peer):
            return error_response("گفتگو مسدود شده است", status_code=403)
        body = str(request.data.get("body", "")).strip()
        upload = request.FILES.get("attachment")
        if not body and not upload:
            return error_response("متن یا فایل لازم است", status_code=400)
        if len(body) > 10000:
            return error_response("متن بیش از حد طولانی است")
        kind = request.data.get("attachment_kind", "file")
        if kind not in ("file", "voice"):
            return error_response("نوع پیوست نامعتبر است")
        if upload:
            if upload.size > 10 * 1024 * 1024:
                return error_response("حداکثر حجم فایل ۱۰ مگابایت است")
            import os
            ext = os.path.splitext(upload.name)[1].lower()
            allowed = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx", ".xlsx", ".zip", ".mp3", ".ogg", ".wav", ".m4a", ".webm"}
            if ext not in allowed or (kind == "voice" and ext not in {".mp3", ".ogg", ".wav", ".m4a", ".webm"}):
                return error_response("فرمت پیوست مجاز نیست")
            import uuid as _uuid
            upload.name = str(_uuid.uuid4()) + ext
        reply_id = request.data.get("reply_to")
        reply = None
        if reply_id:
            reply = get_object_or_404(DirectMessage, pk=reply_id, conversation=chat)
        obj = DirectMessage.objects.create(conversation=chat, sender=request.user, body=body, attachment=upload, attachment_kind=kind, reply_to=reply)
        from panel.ws_events import publish_chat_message
        transaction.on_commit(lambda: publish_chat_message(obj.pk))
        chat.save(update_fields=["updated_at"])
        _chat_audit(request, "chat.message.send", chat.pk)
        return success_response("پیام ارسال شد", data=ChatMessageSerializer(obj, context={"request": request}).data, status_code=201)

class ChatReadView(APIView):
    permission_classes = [IsAuthenticated]
    @transaction.atomic
    def post(self, request, chat_id):
        chat = _chat_access(request.user, chat_id)
        try:
            last_id = int(request.data.get("last_message_id"))
        except (TypeError, ValueError):
            return error_response("last_message_id لازم است")
        count = chat.messages.filter(pk__lte=last_id, read_at__isnull=True).exclude(sender=request.user).update(read_at=timezone.now())
        if count:
            from panel.ws_events import publish_chat_read
            transaction.on_commit(lambda: publish_chat_read(chat.pk, request.user.pk, last_id))
            _chat_audit(request, "chat.read", chat.pk)
        return success_response("وضعیت خواندن ثبت شد", data={"updated": count})

class ChatDeleteMessageView(APIView):
    permission_classes = [IsAuthenticated]
    @transaction.atomic
    def delete(self, request, chat_id, message_id):
        chat = _chat_access(request.user, chat_id)
        obj = get_object_or_404(DirectMessage, pk=message_id, conversation=chat, sender=request.user)
        obj.body = ""
        obj.deleted_at = timezone.now()
        obj.save(update_fields=["body", "deleted_at"])
        from panel.ws_events import publish_chat_deleted
        transaction.on_commit(lambda: publish_chat_deleted(chat.pk, obj.pk))
        _chat_audit(request, "chat.message.delete", chat.pk)
        return success_response("پیام حذف شد")

class ChatBlockView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, user_id):
        if request.user.pk == user_id:
            return error_response("نمی‌توانید خودتان را مسدود کنید")
        target = get_object_or_404(User, pk=user_id)
        ChatBlock.objects.get_or_create(blocker=request.user, blocked=target)
        record_activity(request, event="chat.block", target_type="user", target_id=user_id)
        return success_response("کاربر مسدود شد")
    def delete(self, request, user_id):
        ChatBlock.objects.filter(blocker=request.user, blocked_id=user_id).delete()
        record_activity(request, event="chat.unblock", target_type="user", target_id=user_id)
        return success_response("مسدودسازی لغو شد")

class ChatReportView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, chat_id):
        chat = _chat_access(request.user, chat_id)
        reason = str(request.data.get("reason", "")).strip()
        if not 3 <= len(reason) <= 200:
            return error_response("دلیل گزارش باید بین ۳ تا ۲۰۰ کاراکتر باشد")
        mid = request.data.get("message")
        msg = get_object_or_404(DirectMessage, conversation=chat, pk=mid) if mid else None
        report = ChatReport.objects.create(reporter=request.user, conversation=chat, message=msg, reason=reason, details=str(request.data.get("details", ""))[:3000])
        record_activity(request, event="chat.report", target_type="chat_report", target_id=report.pk)
        return success_response("گزارش ثبت شد", data={"id": report.pk}, status_code=201)

class AdminChatReportsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    def get(self, request):
        qs = ChatReport.objects.all().order_by("-id")[:100]
        return success_response("گزارش‌های گفتگو", data=ChatReportSerializer(qs, many=True).data)
    def patch(self, request):
        obj = get_object_or_404(ChatReport, pk=request.data.get("id"))
        state = request.data.get("status")
        if state not in ("pending", "reviewed", "dismissed"):
            return error_response("وضعیت نامعتبر است")
        obj.status = state
        obj.reviewed_by = request.user
        obj.reviewed_at = timezone.now()
        obj.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        record_activity(request, event="chat.report.review", target_type="chat_report", target_id=obj.pk)
        return success_response("گزارش بررسی شد")

class ChatAttachmentDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, chat_id, message_id):
        chat = _chat_access(request.user, chat_id)
        msg = get_object_or_404(DirectMessage, conversation=chat, pk=message_id, deleted_at__isnull=True)
        if not msg.attachment:
            raise Http404
        import os
        response = FileResponse(msg.attachment.open("rb"), as_attachment=True, filename=os.path.basename(msg.attachment.name))
        response["Cache-Control"] = "private, no-store"
        _chat_audit(request, "chat.attachment.download", chat.pk)
        return response


class PanelUserPermanentDeleteView(APIView):
    """Explicit hard delete; never silently cascade through protected history."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def delete(self, request, user_id):
        from django.db.models.deletion import ProtectedError, RestrictedError
        target = get_object_or_404(User, pk=user_id)
        if target.pk == request.user.pk or target.is_superuser or _is_superadmin(target):
            return error_response(message="حذف حساب خود یا حساب مدیریتی مجاز نیست.", status_code=403)
        # Fail closed if deletion would remove related business data through CASCADE.
        from django.db.models.deletion import Collector
        collector = Collector(using=target._state.db or "default")
        try:
            collector.collect([target])
        except (ProtectedError, RestrictedError):
            return error_response(message="این کاربر سوابق محافظت‌شده دارد و حذف دائمی ممکن نیست؛ از غیرفعال‌سازی استفاده کنید.", status_code=409)
        if any(model is not User for model in collector.data) or collector.fast_deletes:
            return error_response(message="حذف دائمی این کاربر باعث حذف داده‌های مرتبط می‌شود و مجاز نیست.", status_code=409)
        pk = target.pk
        try:
            with transaction.atomic():
                target.delete()
        except IntegrityError:
            return error_response(message="حذف به علت ارتباطات دیتابیس امکان‌پذیر نیست.", status_code=409)
        record_activity(request, event="user.permanent_delete", target_type="user", target_id=pk, description="کاربر بدون سوابق مرتبط به صورت دائمی حذف شد.")
        return success_response(message="کاربر به صورت دائمی حذف شد.", data={"id": pk, "deleted": True})


class TicketAttachmentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id, message_id):
        from django.http import FileResponse, Http404
        from pathlib import Path
        ticket = get_object_or_404(_ticket_queryset(request), pk=ticket_id)
        msg = get_object_or_404(SupportTicketMessage, ticket=ticket, pk=message_id)
        if msg.is_internal and not _ticket_admin(request):
            raise Http404
        if not msg.attachment:
            raise Http404
        try:
            stream = msg.attachment.open("rb")
        except (FileNotFoundError, OSError, ValueError):
            raise Http404
        response = FileResponse(stream, as_attachment=True, filename=Path(msg.attachment.name).name)
        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response

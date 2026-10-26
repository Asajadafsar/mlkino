import logging

from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from accounts.models import Announcement
from accounts.permissions import IsSuperAdmin
from accounts.utils import error_response, success_response

from panel.serializers import (
    AnnouncementCreateSerializer,
    AnnouncementDetailSerializer,
    AnnouncementListSerializer,
    AnnouncementUpdateSerializer,
)

logger = logging.getLogger(__name__)


def _user_role_info(user):
    """اطلاعات نقش کاربر برای پاسخ"""
    if not user:
        return {
            "role": None,
            "role_display": None,
            "is_superuser": False,
            "is_staff": False,
        }
    return {
        "role": user.role,
        "role_display": user.get_role_display(),
        "is_superuser": user.is_superuser,
        "is_staff": user.is_staff,
    }


# ==================================================================
# List + Create
# ==================================================================
class AnnouncementListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """لیست همه اطلاعیه‌ها"""
        qs = Announcement.objects.all().order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(title__icontains=search)

        serializer = AnnouncementListSerializer(qs, many=True)

        return success_response(
            message="لیست اطلاعیه‌ها",
            data={
                "total_results": qs.count(),
                "results": serializer.data,
                "requested_by": _user_role_info(request.user),
            },
        )

    def post(self, request):
        """ایجاد اطلاعیه جدید"""
        serializer = AnnouncementCreateSerializer(data=request.data)

        if not serializer.is_valid():
            errors = []
            for field, msgs in serializer.errors.items():
                if isinstance(msgs, (list, tuple)):
                    for msg in msgs:
                        errors.append({"field": field, "message": str(msg)})
                else:
                    errors.append({"field": field, "message": str(msgs)})
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=errors,
                status_code=400,
            )

        announcement = serializer.save(
            created_by=request.user,
            updated_by=request.user,
        )

        logger.info(
            "Announcement created: id=%s by user=%s (role=%s)",
            announcement.id,
            request.user.id,
            request.user.role,
        )

        return success_response(
            message="اطلاعیه با موفقیت ایجاد شد.",
            data={
                "announcement": AnnouncementDetailSerializer(announcement).data,
                "requested_by": _user_role_info(request.user),
            },
            status_code=http_status.HTTP_201_CREATED,
        )


# ==================================================================
# Detail + Update + Delete
# ==================================================================
class AnnouncementDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, announcement_id):
        """جزئیات اطلاعیه"""
        try:
            announcement = Announcement.objects.get(pk=announcement_id)
        except Announcement.DoesNotExist:
            return error_response(
                message="اطلاعیه یافت نشد.",
                status_code=404,
            )

        return success_response(
            message="جزئیات اطلاعیه",
            data={
                "announcement": AnnouncementDetailSerializer(announcement).data,
                "requested_by": _user_role_info(request.user),
            },
        )

    def patch(self, request, announcement_id):
        """ویرایش اطلاعیه"""
        try:
            announcement = Announcement.objects.get(pk=announcement_id)
        except Announcement.DoesNotExist:
            return error_response(
                message="اطلاعیه یافت نشد.",
                status_code=404,
            )

        serializer = AnnouncementUpdateSerializer(
            announcement,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            errors = []
            for field, msgs in serializer.errors.items():
                if isinstance(msgs, (list, tuple)):
                    for msg in msgs:
                        errors.append({"field": field, "message": str(msg)})
                else:
                    errors.append({"field": field, "message": str(msgs)})
            return error_response(
                message="اطلاعات ارسالی معتبر نیست.",
                errors=errors,
                status_code=400,
            )

        announcement = serializer.save(updated_by=request.user)

        logger.info(
            "Announcement updated: id=%s by user=%s (role=%s)",
            announcement.id,
            request.user.id,
            request.user.role,
        )

        return success_response(
            message="اطلاعیه با موفقیت ویرایش شد.",
            data={
                "announcement": AnnouncementDetailSerializer(announcement).data,
                "requested_by": _user_role_info(request.user),
            },
        )

    def delete(self, request, announcement_id):
        """حذف اطلاعیه"""
        try:
            announcement = Announcement.objects.get(pk=announcement_id)
        except Announcement.DoesNotExist:
            return error_response(
                message="اطلاعیه یافت نشد.",
                status_code=404,
            )

        deleted_id = announcement.id
        announcement.delete()

        logger.info(
            "Announcement deleted: id=%s by user=%s (role=%s)",
            deleted_id,
            request.user.id,
            request.user.role,
        )

        return success_response(
            message="اطلاعیه با موفقیت حذف شد.",
            data={
                "deleted_id": deleted_id,
                "requested_by": _user_role_info(request.user),
            },
        )
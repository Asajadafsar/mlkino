from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    message = "دسترسی فقط برای سوپر ادمین مجاز است."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_superuser
        )


class IsRealEstateAgent(BasePermission):
    message = "دسترسی فقط برای املاکی مجاز است."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "agent"
        )


class IsExpert(BasePermission):
    message = "دسترسی فقط برای کارشناس مجاز است."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "expert"
        )


class IsNormalUser(BasePermission):
    message = "دسترسی فقط برای کاربر عادی مجاز است."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "user"
        )
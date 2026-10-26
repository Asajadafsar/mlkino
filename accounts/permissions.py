from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """دسترسی فقط برای سوپر ادمین (is_superuser=True یا role=superadmin)."""
    message = "دسترسی فقط برای سوپر ادمین مجاز است."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.role == "superadmin"
            )
        )


class IsNormalUser(BasePermission):
    """دسترسی فقط برای کاربر عادی (role=user)."""
    message = "دسترسی فقط برای کاربر عادی مجاز است."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "user"
        )
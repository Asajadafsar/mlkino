import hashlib
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from accounts.sessions import SessionJWTAuthentication
from rest_framework.authentication import CSRFCheck
from accounts.cookies import ACCESS_COOKIE

IMPERSONATION_COOKIE = 'mlkinoImpersonation'
BLOCKED_PATH_PARTS = (
    '/auth/', '/accounts/', '/impersonation/start/',
    '/impersonation/stop/', '/admin/',
)


class CookieJWTAuthentication(SessionJWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_COOKIE)
        if not raw_token:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None
        validated = self.get_validated_token(raw_token)
        actor = self.get_user(validated)
        if request.method not in ('GET','HEAD','OPTIONS') and request.path.startswith('/panel/') and not request.path.startswith('/panel/tickets') and not (actor.is_superuser or actor.role == actor.Role.SUPER_ADMIN):
            from panel.settings_runtime import system_settings
            if system_settings().get('general',{}).get('maintenanceMode',False):
                from rest_framework.exceptions import APIException
                error=APIException('سامانه در حال به‌روزرسانی است؛ ثبت تغییرات موقتاً غیرفعال است.')
                error.status_code=503
                raise error
        raw_imp = request.COOKIES.get(IMPERSONATION_COOKIE)
        if not raw_imp:
            return actor, validated

        from panel.models import ImpersonationSession
        session = (ImpersonationSession.objects.select_related('actor', 'target')
                   .filter(token_hash=hashlib.sha256(raw_imp.encode()).hexdigest())
                   .first())
        # The primary JWT remains authoritative. An obsolete secondary cookie
        # must never switch identities or invalidate a valid primary session.
        if (not session or session.actor_id != actor.pk or session.revoked_at
                or session.expires_at <= timezone.now() or not session.target.is_active
                or not (actor.is_superuser or actor.role == actor.Role.SUPER_ADMIN)):
            return actor, validated
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            path = request.path.lower()
            if any(fragment in path for fragment in BLOCKED_PATH_PARTS):
                raise PermissionDenied('عملیات امنیتی در حالت ورود مدیریتی مجاز نیست.')
            checker = CSRFCheck(lambda req: None)
            checker.process_request(request)
            reason = checker.process_view(request, None, (), {})
            if reason:
                raise PermissionDenied('CSRF نامعتبر است: ' + str(reason))
        request._request.impersonation_session = session
        return session.target, validated

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
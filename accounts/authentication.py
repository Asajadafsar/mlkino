import hashlib
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from accounts.cookies import ACCESS_COOKIE

IMPERSONATION_COOKIE = 'mlkinoImpersonation'
BLOCKED_PATH_PARTS = (
    '/auth/', '/accounts/', '/impersonation/start/',
    '/impersonation/stop/', '/admin/',
)


class CookieJWTAuthentication(JWTAuthentication):
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
        raw_imp = request.COOKIES.get(IMPERSONATION_COOKIE)
        if not raw_imp:
            return actor, validated

        from panel.models import ImpersonationSession
        session = (ImpersonationSession.objects.select_related('actor', 'target')
                   .filter(token_hash=hashlib.sha256(raw_imp.encode()).hexdigest())
                   .first())
        if not session or session.revoked_at or session.expires_at <= timezone.now():
            raise AuthenticationFailed('نشست ورود مدیریتی منقضی یا لغو شده است.')
        if session.actor_id != actor.pk or not actor.is_active or not (
            actor.is_superuser or actor.role == actor.Role.SUPER_ADMIN
        ) or not session.target.is_active:
            raise AuthenticationFailed('نشست ورود مدیریتی معتبر نیست.')
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
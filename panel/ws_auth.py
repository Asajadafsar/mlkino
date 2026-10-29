"""Cookie-based SimpleJWT auth for ASGI; no JWT in query strings."""
from http.cookies import SimpleCookie
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from accounts.cookies import ACCESS_COOKIE

@database_sync_to_async
def authenticated_user(token, impersonation_token=None):
    from django.contrib.auth.models import AnonymousUser
    from django.utils import timezone
    from panel.models import ImpersonationSession
    import hashlib
    auth = JWTAuthentication()
    try:
        jwt = auth.get_validated_token(token)
        actor = auth.get_user(jwt)
        if not actor.is_active:
            return AnonymousUser()
        if impersonation_token:
            session = ImpersonationSession.objects.select_related('target').filter(
                token_hash=hashlib.sha256(impersonation_token.encode()).hexdigest(),
                actor_id=actor.pk, revoked_at__isnull=True, expires_at__gt=timezone.now(),
                target__is_active=True,
            ).first()
            if not session or not (actor.is_superuser or actor.role == actor.Role.SUPER_ADMIN):
                return AnonymousUser()
            return session.target
        return actor
    except Exception:
        return AnonymousUser()

class CookieJWTASGIMiddleware:
    def __init__(self, app): self.app = app
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get('headers', []))
        cookie = SimpleCookie()
        try: cookie.load(headers.get(b'cookie', b'').decode('latin-1'))
        except Exception: pass
        access = cookie.get(ACCESS_COOKIE)
        imp = cookie.get('mlkinoImpersonation')
        scope['user'] = await authenticated_user(access.value, imp.value if imp else None) if access else None
        return await self.app(scope, receive, send)

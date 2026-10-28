from rest_framework import status
from rest_framework.response import Response


def success_response(message="", data=None, status_code=status.HTTP_200_OK):
    body = {
        "success": True,
        "message": message,
        "errors": [],
    }
    if data is not None:
        body["data"] = data
    return Response(body, status=status_code)


def error_response(message="", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    if errors is None:
        errors = []
    if isinstance(errors, dict):
        normalized = []
        for field, msgs in errors.items():
            if isinstance(msgs, (list, tuple)):
                for msg in msgs:
                    normalized.append({"field": field, "message": str(msg)})
            else:
                normalized.append({"field": field, "message": str(msgs)})
        errors = normalized
    elif isinstance(errors, str):
        errors = [{"message": errors}]

    body = {
        "success": False,
        "message": message,
        "errors": errors,
    }
    return Response(body, status=status_code)

# ============================================================
# GLOBAL REQUEST AUDIT MIDDLEWARE
# Add "accounts.utils.ActivityAuditMiddleware" to settings.MIDDLEWARE
# ============================================================
import logging
import time
import uuid
from django.http import JsonResponse

_audit_logger = logging.getLogger("mlkino.audit")


class ActivityAuditMiddleware:
    """Logs HTTP requests without recording credentials, request bodies, cookies or query strings."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        path = request.path.lower()
        imp = bool(request.COOKIES.get("mlkinoImpersonation"))
        # Protect AllowAny and session endpoints, including routes bypassing DRF auth.
        is_exit = path.endswith("/impersonation/exit/")
        if imp and request.method not in ("GET", "HEAD", "OPTIONS") and not is_exit:
            if any(x in path for x in ("/accounts/", "/auth/", "/admin/", "/impersonation/")):
                response = JsonResponse({"success": False, "message": "عملیات امنیتی در حالت ورود مدیریتی ممنوع است.", "errors": []}, status=403)
                self._save(request, response, start)
                return response
        try:
            response = self.get_response(request)
        except Exception:
            # Django exception middleware normally handles exceptions; preserve exception semantics.
            _audit_logger.exception("Unhandled request exception: %s", request.path)
            self._save(request, None, start)
            raise
        self._save(request, response, start)
        return response

    def _save(self, request, response, start):
        try:
            from accounts.models import ActivityLog
            from panel.models import ImpersonationSession
            from django.utils import timezone
            import hashlib
            user = getattr(request, "user", None)
            actor_id = user.pk if getattr(user, "is_authenticated", False) else None
            session = getattr(request, "impersonation_session", None)
            # For endpoints using OriginalAdminAuthentication, DRF does not attach session.
            raw = request.COOKIES.get("mlkinoImpersonation")
            if session is None and raw:
                session = ImpersonationSession.objects.filter(
                    token_hash=hashlib.sha256(raw.encode()).hexdigest()
                ).first()
            real_actor_id = session.actor_id if session else None
            if session and (actor_id is None or actor_id == session.actor_id):
                actor_id = session.target_id if request.path.lower().find("/impersonation/") == -1 else actor_id
            status_code = getattr(response, "status_code", 500)
            category = "auth" if any(x in request.path.lower() for x in ("/login/", "/logout/", "/otp/", "/password/", "/register/", "/token/")) else "http"
            event = "http.error" if status_code >= 400 else "http.request"
            if session and request.method not in ("GET", "HEAD", "OPTIONS"):
                event = "impersonation.action"
            ActivityLog.objects.create(
                actor_id=actor_id, real_actor_id=real_actor_id,
                impersonation_session=session,
                event=event, category=category, method=request.method[:12],
                path=request.path[:500], status_code=status_code,
                duration_ms=max(0, int((time.monotonic()-start)*1000)),
                ip_address=request.META.get("REMOTE_ADDR") or None,
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                request_id=uuid.uuid4(),
                metadata={"impersonated": bool(session), "authenticated": actor_id is not None},
            )
        except Exception:
            # Audit failure must not break user requests. Monitor mlkino.audit errors.
            _audit_logger.exception("Could not persist activity audit for %s", request.path)

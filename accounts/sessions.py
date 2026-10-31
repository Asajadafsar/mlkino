import hashlib
from datetime import datetime, timedelta, timezone as dt_timezone
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import DeviceSession


def refresh_key(token):
    return hashlib.sha256(str(token['jti']).encode()).hexdigest()


def create_device_session(user, refresh, request=None):
    agent = request.META.get('HTTP_USER_AGENT', '')[:500] if request else ''
    address = request.META.get('REMOTE_ADDR') if request else None
    import ipaddress
    try: address = str(ipaddress.ip_address(address)) if address else None
    except ValueError: address = None
    session = DeviceSession.objects.create(user=user, refresh_key=refresh_key(refresh), user_agent=agent,
        ip_address=address, expires_at=datetime.fromtimestamp(int(refresh['exp']), tz=dt_timezone.utc))
    if request:
        try:
            from .models import ActivityLog
            ActivityLog.objects.create(actor=user,real_actor=user,event='session.created',category='security',method=request.method,
                path=request.path[:500],status_code=200,ip_address=address,user_agent=agent,
                metadata={'description':'نشست ورود جدید ایجاد شد.','target_type':'session','target_id':str(session.pk)})
        except Exception:
            import logging
            logging.getLogger(__name__).exception('Could not record session creation')
    refresh['sid'] = str(session.pk)
    return session


def validate_session(token, user):
    sid = token.get('sid')
    if not sid:
        return  # Existing short-lived access tokens are upgraded on session inventory access.
    try:
        session = DeviceSession.objects.filter(pk=sid, user=user, revoked_at__isnull=True, expires_at__gt=timezone.now()).first()
    except (ValueError, TypeError, ValidationError): session = None
    if not session:
        raise AuthenticationFailed('نشست این دستگاه بسته شده است. دوباره وارد شوید.')
    if session.last_seen < timezone.now()-timedelta(minutes=5):
        DeviceSession.objects.filter(pk=session.pk).update(last_seen=timezone.now())


class SessionJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        validate_session(validated_token, user)
        return user

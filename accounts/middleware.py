import hashlib
import uuid
from zoneinfo import ZoneInfo
from django.utils import timezone
from django.http import JsonResponse
from .client_ip import get_client_ip

class RequestTimezoneMiddleware:
    def __init__(self,get_response):self.get_response=get_response
    def __call__(self,request):
        from panel.settings_runtime import system_settings
        zone=system_settings().get('general',{}).get('timezone','Asia/Tehran')
        try:timezone.activate(ZoneInfo(zone))
        except (ValueError,KeyError):timezone.activate(ZoneInfo('Asia/Tehran'))
        try:return self.get_response(request)
        finally:timezone.deactivate()


def active_impersonation(request):
    raw=request.COOKIES.get('mlkinoImpersonation')
    if not raw:return None
    try:
        from .sessions import SessionJWTAuthentication
        from .cookies import ACCESS_COOKIE,REFRESH_COOKIE
        from rest_framework_simplejwt.tokens import RefreshToken
        auth=SessionJWTAuthentication()
        try:token=auth.get_validated_token(request.COOKIES.get(ACCESS_COOKIE,'').encode())
        except Exception:token=RefreshToken(request.COOKIES.get(REFRESH_COOKIE,''))
        actor=auth.get_user(token)
        from panel.models import ImpersonationSession
        return ImpersonationSession.objects.filter(token_hash=hashlib.sha256(raw.encode()).hexdigest(),actor=actor,revoked_at__isnull=True,expires_at__gt=timezone.now(),target__is_active=True).first()
    except Exception:return None

class ActivityFailureMiddleware:
    """Audit failed mutations; successful business actions log themselves. Never log navigation."""
    def __init__(self,get_response):self.get_response=get_response
    def __call__(self,request):
        request.activity_id=uuid.uuid4()
        if request.method not in ('GET','HEAD','OPTIONS') and request.path.startswith(('/accounts/','/admin/','/auth/')) and request.path!='/accounts/token/refresh/' and active_impersonation(request):
            return JsonResponse({'message':'عملیات امنیتی در ورود مدیریتی مجاز نیست.'},status=403)
        response=self.get_response(request)
        if request.method not in ('POST','PATCH','PUT','DELETE') or response.status_code<400 or getattr(request,'business_activity_logged',False):return response
        from .models import ActivityLog
        user=getattr(request,'user',None);actor=user if user and user.is_authenticated else None
        session=getattr(request,'impersonation_session',None)
        action={'POST':'ثبت','PATCH':'ویرایش','PUT':'ویرایش','DELETE':'حذف'}[request.method]
        labels={'users':'کاربر','tasks':'وظیفه','tickets':'تیکت','reminders':'یادآوری','settings':'تنظیمات','profile':'پروفایل','login':'ورود','password':'رمز عبور','chats':'گفتگو'}
        section=next((label for key,label in labels.items() if key in request.path),'اطلاعات')
        try:
            ActivityLog.objects.create(actor=actor,real_actor=session.actor if session else actor,impersonation_session=session,event='request.failed',category='http',method=request.method,path=request.path[:500],status_code=response.status_code,ip_address=get_client_ip(request),user_agent=request.META.get('HTTP_USER_AGENT','')[:500],request_id=request.activity_id,metadata={'description':f'{actor.full_name if actor else "کاربر ناشناس"} — عملیات {action} {section} ناموفق بود؛ کد پاسخ {response.status_code}.','target_type':section})
        except Exception:
            import logging
            logging.getLogger(__name__).exception('Could not record failed mutation')
        return response

class TrustedBrowserOriginMiddleware:
    """Reject cross-site browser mutations, including cookie refresh and login.

    CORS controls reading responses, not whether a forged POST reaches a view.
    Accept only exact configured origins. Cookie clients without Origin must
    provide a trusted Referer or a valid Django CSRF token; bearer-only clients
    and non-browser anonymous clients retain their existing API behavior.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.conf import settings
        from urllib.parse import urlsplit
        if request.method in ('GET', 'HEAD', 'OPTIONS') or not request.path.startswith(('/accounts/', '/panel/')):
            return self.get_response(request)
        trusted = set(settings.CSRF_TRUSTED_ORIGINS) | set(settings.CORS_ALLOWED_ORIGINS)
        own = urlsplit(request.build_absolute_uri('/'))
        trusted.add(f'{own.scheme}://{own.netloc}')
        origin = request.META.get('HTTP_ORIGIN')
        rejected = origin is not None and origin not in trusted
        if origin is None and any(request.COOKIES.get(key) for key in ('accessToken', 'refreshToken', 'mlkinoImpersonation')):
            referer = urlsplit(request.META.get('HTTP_REFERER', ''))
            if f'{referer.scheme}://{referer.netloc}' not in trusted:
                from django.middleware.csrf import CsrfViewMiddleware
                csrf = CsrfViewMiddleware(self.get_response)
                csrf.process_request(request)
                rejected = csrf.process_view(request, lambda r: None, (), {}) is not None
        if rejected:
            response = JsonResponse({'message': 'مبدأ درخواست معتبر نیست. صفحه رسمی ملکینو را باز کنید و دوباره تلاش کنید.'}, status=403)
            response['Cache-Control'] = 'no-store'
            return response
        return self.get_response(request)

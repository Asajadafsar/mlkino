import ipaddress
import uuid
from zoneinfo import ZoneInfo
from django.utils import timezone


class RequestTimezoneMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        from panel.settings_runtime import system_settings
        zone=system_settings().get('general',{}).get('timezone','Asia/Tehran')
        try: timezone.activate(ZoneInfo(zone))
        except (ValueError,KeyError): timezone.activate(ZoneInfo('Asia/Tehran'))
        try: return self.get_response(request)
        finally: timezone.deactivate()


class ActivityFailureMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        request.activity_id=uuid.uuid4()
        response=self.get_response(request)
        if request.method not in ('POST','PATCH','PUT','DELETE') or response.status_code<400: return response
        from .models import ActivityLog
        user=getattr(request,'user',None)
        actor=user if user and user.is_authenticated else None
        session=getattr(request,'impersonation_session',None)
        address=request.META.get('REMOTE_ADDR')
        try: address=str(ipaddress.ip_address(address)) if address else None
        except ValueError: address=None
        try:
            ActivityLog.objects.create(actor=actor,real_actor=session.actor if session else actor,impersonation_session=session,
                event='request.failed',category='http',method=request.method,path=request.path[:500],status_code=response.status_code,
                ip_address=address,user_agent=request.META.get('HTTP_USER_AGENT','')[:500],request_id=request.activity_id,
                metadata={'description':'درخواست ناموفق','target_type':'request'})
        except Exception:
            import logging
            logging.getLogger(__name__).exception('Could not record failed request')
        return response

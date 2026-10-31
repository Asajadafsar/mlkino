from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AccountPreferences, DeviceSession, AccountNotification, ActivityLog
from .notices import NOTIFICATION_DEFAULTS, PRIVACY_DEFAULTS
from .sessions import create_device_session, refresh_key
from .cookies import REFRESH_COOKIE, set_access_cookie, set_token_cookie, get_token_lifetime


def response(data=None, message='اطلاعات دریافت شد.', code=200):
    return Response({'statusCode':str(code),'status':code,'message':message,'data':data},status=code)


def original_only(request):
    if getattr(request._request, 'impersonation_session', None):
        raise PermissionDenied('تنظیمات امنیتی فقط در نشست اصلی حساب قابل مدیریت است.')


class PreferencesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        obj = AccountPreferences.objects.filter(user=request.user).first()
        return response({'notifications':{**NOTIFICATION_DEFAULTS, **(obj.notifications if obj else {})},'privacy':{**PRIVACY_DEFAULTS, **(obj.privacy if obj else {})}})
    def patch(self, request):
        original_only(request)
        if not isinstance(request.data,dict) or not request.data: return response(message='اطلاعات معتبر ارسال کنید.',code=400)
        defaults={'notifications':NOTIFICATION_DEFAULTS,'privacy':PRIVACY_DEFAULTS}
        for group, changes in request.data.items():
            if group not in defaults or not isinstance(changes,dict) or any(key not in defaults[group] or not isinstance(value,bool) for key,value in changes.items()):
                return response(message='تنظیمات ارسالی معتبر نیست.',code=400)
        obj,_ = AccountPreferences.objects.get_or_create(user=request.user)
        for group, changes in request.data.items(): setattr(obj,group,{**defaults[group],**getattr(obj,group),**changes})
        obj.save()
        from panel.views import record_activity
        record_activity(request,event='profile.preferences',description='تنظیمات شخصی به‌روز شد.')
        return self.get(request)


class SessionsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self, request):
        original_only(request)
        current=str(request.auth.get('sid','')) if request.auth else ''
        upgrade=None
        # Bring a pre-existing login under device management without asking for its password.
        if not current and request.COOKIES.get(REFRESH_COOKIE):
            try:
                token=RefreshToken(request.COOKIES[REFRESH_COOKIE])
                if str(token['user_id'])==str(request.user.pk):
                    if token.get('sid'): current=str(token['sid'])
                    else:
                        old=DeviceSession.objects.filter(refresh_key=refresh_key(token)).first()
                        if old and old.revoked_at: return response(message='نشست بسته شده است.',code=401)
                        session=old or create_device_session(request.user,token,request)
                        token['sid']=str(session.pk); current=str(session.pk); upgrade=token
            except Exception: pass
        rows=DeviceSession.objects.filter(user=request.user,revoked_at__isnull=True,expires_at__gt=timezone.now())
        data=[{'id':str(row.pk),'user_agent':row.user_agent,'ip_address':row.ip_address,'created_at':row.created_at,'last_seen':row.last_seen,'expires_at':row.expires_at,'current':str(row.pk)==current} for row in rows]
        result=response({'results':data,'current_id':current})
        if upgrade:
            set_access_cookie(result,str(upgrade.access_token))
            set_token_cookie(result,REFRESH_COOKIE,str(upgrade),get_token_lifetime('refresh'))
        return result
    def delete(self,request,session_id=None):
        original_only(request)
        current=str(request.auth.get('sid','')) if request.auth else ''
        if session_id and str(session_id)==current: return response(message='برای خروج از این دستگاه از دکمه خروج استفاده کنید.',code=409)
        qs=DeviceSession.objects.filter(user=request.user,revoked_at__isnull=True).exclude(pk=current) if current else DeviceSession.objects.none()
        if session_id: qs=qs.filter(pk=session_id)
        count=qs.update(revoked_at=timezone.now())
        from panel.views import record_activity
        record_activity(request,event='session.revoke',description='نشست‌های انتخاب‌شده بسته شدند.')
        return response({'revoked':count},'نشست‌های دیگر بسته شدند.')


class NotificationsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        rows=AccountNotification.objects.filter(user=request.user)
        return response({'unread_count':rows.filter(read_at__isnull=True).count(),'results':[{'id':row.pk,'kind':row.kind,'title':row.title,'body':row.body,'link':row.link,'created_at':row.created_at,'read_at':row.read_at} for row in rows[:100]]})
    def patch(self,request):
        qs=AccountNotification.objects.filter(user=request.user,read_at__isnull=True)
        ids=request.data.get('ids')
        if ids is not None:
            if not isinstance(ids,list) or len(ids)>100 or any(not isinstance(value,int) for value in ids): return response(message='شناسه‌ها معتبر نیستند.',code=400)
            qs=qs.filter(pk__in=ids)
        return response({'updated':qs.update(read_at=timezone.now())},'اطلاع‌رسانی‌ها خوانده شدند.')


class OwnActivityView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        from panel.serializers import ActivityLogSerializer
        rows=ActivityLog.objects.filter(Q(actor=request.user)|Q(real_actor=request.user)).select_related('actor','real_actor').order_by('-created_at')
        from panel.views import UserPagination
        paginator=UserPagination(); page=paginator.paginate_queryset(rows,request,view=self)
        return response({'total_results':paginator.page.paginator.count,'results':ActivityLogSerializer(page,many=True).data})

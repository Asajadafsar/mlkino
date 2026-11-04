"""Switch active roles without deleting any historical role profile or files."""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.models import User,AgencyProfile,ExpertProfile
from .settings_api import envelope,is_superadmin

class UserRoleView(APIView):
    permission_classes=[IsAuthenticated]
    @transaction.atomic
    def post(self,request,user_id):
        if not is_superadmin(request.user):return envelope(message='تغییر نقش فقط برای سوپرادمین مجاز است.',code=403)
        if getattr(request._request,'impersonation_session',None):return envelope(message='تغییر نقش را از حساب اصلی مدیر انجام دهید.',code=403)
        if not isinstance(request.data,dict) or set(request.data)-{'role','expected_role'} or request.data.get('role') not in User.Role.values:return envelope(message='نقش معتبر انتخاب کنید.',code=400)
        # Lock administrators first in a consistent order to prevent concurrent lockout.
        list(User.objects.select_for_update().filter(Q(role=User.Role.SUPER_ADMIN)|Q(is_superuser=True)).order_by('pk'))
        user=get_object_or_404(User.objects.select_for_update(),pk=user_id)
        old=user.role;role=request.data['role']
        if request.data.get('expected_role')!=old:return envelope(message='نقش کاربر تغییر کرده است؛ صفحه را دوباره بارگذاری کنید.',code=409)
        if role==old:return envelope({'id':user.pk,'role':role},'نقش کاربر تغییری نکرد.')
        if role!=User.Role.SUPER_ADMIN:
            admins=User.objects.filter(is_active=True).exclude(pk=user.pk)
            if old==User.Role.SUPER_ADMIN and not admins.filter(Q(role=User.Role.SUPER_ADMIN)|Q(is_superuser=True)).exists():return envelope(message='آخرین مدیر فعال سامانه را نمی‌توان تنزل داد.',code=400)
            if user.is_superuser and not admins.filter(is_superuser=True).exists():return envelope(message='آخرین سوپریوزر فعال سامانه را نمی‌توان تنزل داد.',code=400)
        user.role=role;user.is_staff=role==User.Role.SUPER_ADMIN
        if role!=User.Role.SUPER_ADMIN:user.is_superuser=False
        user.profile_updated_at=timezone.now();user.save(update_fields=['role','is_staff','is_superuser','profile_updated_at'])
        if role==User.Role.AGENCY:AgencyProfile.objects.get_or_create(manager=user,defaults={'agency_name':'','occupancy_type':'owner','office_address':''})
        elif role==User.Role.EXPERT:ExpertProfile.objects.get_or_create(user=user)
        from .views import record_activity
        record_activity(request,event='user.role.changed',target_type='user',target_id=user.pk,target_label=user.full_name,description='نقش کاربر تغییر کرد؛ اطلاعات نقش‌های قبلی حفظ شد.',changes={'role':{'before':old,'after':role}})
        def notify():
            import logging
            try:
                layer=get_channel_layer()
                if layer:async_to_sync(layer.group_send)(f'inbox_{user.pk}',{'type':'chat.event','event':'identity.changed','data':{'role':role}})
            except Exception:logging.getLogger(__name__).exception('Role identity notification failed')
        transaction.on_commit(notify)
        return envelope({'id':user.pk,'role':role},'نقش تغییر کرد؛ اطلاعات نقش قبلی محفوظ است.')

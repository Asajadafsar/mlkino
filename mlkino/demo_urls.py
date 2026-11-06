"""Demo permits only explicit public media prefixes and disables real providers."""
from pathlib import PurePosixPath
from django.conf import settings
from django.http import Http404,JsonResponse
from django.urls import re_path
from django.views.static import serve
from .urls import urlpatterns as base_patterns
class NoExternalProviders:
    def __init__(self,get_response):self.get_response=get_response
    def __call__(self,request):
        if request.path_info in ('/accounts/send-otp/','/accounts/postal/lookup/','/accounts/identity/retry/','/accounts/complete-register/','/accounts/change-password/'):
            return JsonResponse({'message':'در محیط نمایشی، پیامک و سرویس‌های هویتی واقعی غیرفعال‌اند. از حساب‌های تست اعلام‌شده استفاده کنید.'},status=503)
        return self.get_response(request)
def public_media(request,path):
    parts=PurePosixPath(path).parts
    if '..' in parts or not parts or parts[0] not in ('properties','demo_seed','avatars','panel-settings','agencies'):raise Http404
    if parts[0]=='agencies' and (len(parts)<2 or parts[1]!='logos'):raise Http404
    return serve(request,path,document_root=settings.MEDIA_ROOT)
urlpatterns=[re_path(r'^media/(?P<path>.+)$',public_media),*base_patterns]

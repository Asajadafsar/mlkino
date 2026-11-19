"""Isolated auth QA only: temporary SQLite/media, loopback, no real SMS/Jibit."""
import os
from pathlib import Path
import secrets
import sys
import tempfile

project=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(project))
os.environ['DJANGO_SETTINGS_MODULE']='mlkino.test_settings'
import django
from django.conf import settings

root=Path(tempfile.mkdtemp(prefix='mlkino-auth-qa-'))
settings.DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':str(root/'qa.sqlite3')}}
settings.SECRET_KEY=secrets.token_urlsafe(48)
settings.DEBUG=False
settings.ALLOWED_HOSTS=['127.0.0.1','localhost']
settings.MEDIA_ROOT=root/'media'
settings.MEDIA_ROOT.mkdir()
settings.CORS_ALLOWED_ORIGINS=['http://127.0.0.1:3002']
settings.CSRF_TRUSTED_ORIGINS=settings.CORS_ALLOWED_ORIGINS.copy()
settings.MLKINO_WS_ALLOWED_ORIGINS=settings.CORS_ALLOWED_ORIGINS.copy()
settings.AUTH_COOKIE_SECURE=True
settings.AUTH_COOKIE_SAMESITE='None'
settings.CSRF_COOKIE_SECURE=True
settings.CSRF_COOKIE_HTTPONLY=True
settings.CSRF_COOKIE_SAMESITE='None'
settings.PANEL_SETTINGS_PUBLIC_BASE_URL='http://127.0.0.1:8104'
django.setup()
from django.core.management import call_command
call_command('migrate',interactive=False,verbosity=0)

from accounts import views
views._generate_otp=lambda:'12345'
views.send_otp_sms=lambda *args:'isolated-test-no-sms'
views.shahkar_match=lambda *args:True
views.postal_lookup=lambda code:{'postal_code':code,'province':'قم','city':'قم','address':'نشانی کامل آزمایشی در محیط ایزوله'}
from django.urls import path,re_path
from django.http import JsonResponse
from django.views.static import serve
from mlkino import urls
urls.urlpatterns.append(re_path(r'^media/(?P<path>.+)$',serve,{'document_root':settings.MEDIA_ROOT}))
urls.urlpatterns.append(path('api/accounts/qa-isolated/',lambda request:JsonResponse({'isolated':True,'providers':'fake'})))
from PIL import Image
Image.new('RGB',(48,48),'#246bfd').save(root/'avatar.png')
print('ISOLATED_QA_ROOT='+str(root),flush=True)
print('Only local fixture providers are active. OTP fixture: 12345.',flush=True)
call_command('runserver','127.0.0.1:8104',use_reloader=False,verbosity=1)

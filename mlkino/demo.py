"""Independent server Demo settings. Never imports Production settings or secrets.

Services bind loopback and are accessed through an encrypted SSH tunnel using
`demo.localhost`, keeping demo cookies separate from localhost and Production.
"""
import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
BASE_DIR=Path(__file__).resolve().parent.parent
def required(name):
    value=os.environ.get(name)
    if not value:raise ImproperlyConfigured(f'Missing Demo setting: {name}')
    return value
SECRET_KEY=required('MLKINO_DEMO_SECRET_KEY')
DEBUG=False
ALLOWED_HOSTS=['demo.localhost','localhost','127.0.0.1']
_db=required('MLKINO_DEMO_DB_NAME')
if not _db.startswith('mlkino_demo_'):raise ImproperlyConfigured('Demo requires a dedicated mlkino_demo_ database')
DATABASES={'default':{'ENGINE':'django.db.backends.postgresql','NAME':_db,'USER':required('MLKINO_DEMO_DB_USER'),'PASSWORD':required('MLKINO_DEMO_DB_PASSWORD'),'HOST':'127.0.0.1','PORT':'5432','CONN_MAX_AGE':30}}
INSTALLED_APPS=['django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','corsheaders','channels','rest_framework','rest_framework_simplejwt.token_blacklist','drf_spectacular','accounts','panel']
MIDDLEWARE=['corsheaders.middleware.CorsMiddleware','django.middleware.security.SecurityMiddleware','mlkino.demo_urls.NoExternalProviders','accounts.middleware.TrustedBrowserOriginMiddleware','accounts.middleware.FeatureAccessMiddleware','accounts.middleware.RequestTimezoneMiddleware','accounts.middleware.ActivityFailureMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='mlkino.demo_urls'
TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
AUTH_USER_MODEL='accounts.User'
AUTH_PASSWORD_VALIDATORS=[]
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':['accounts.authentication.CookieJWTAuthentication'],'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.IsAuthenticated'],'DEFAULT_SCHEMA_CLASS':'drf_spectacular.openapi.AutoSchema'}
from datetime import timedelta
SIMPLE_JWT={'SIGNING_KEY':SECRET_KEY,'ACCESS_TOKEN_LIFETIME':timedelta(minutes=5),'REFRESH_TOKEN_LIFETIME':timedelta(days=1)}
CHANNEL_LAYERS={'default':{'BACKEND':'channels.layers.InMemoryChannelLayer'}}
CACHES={'default':{'BACKEND':'django.core.cache.backends.locmem.LocMemCache','LOCATION':'mlkino-demo-only'}}
LANGUAGE_CODE='fa-ir';TIME_ZONE='Asia/Tehran';USE_I18N=True;USE_TZ=True
STATIC_URL='/static/';STATIC_ROOT=BASE_DIR/'staticfiles'
MEDIA_ROOT=Path(required('MLKINO_DEMO_MEDIA_ROOT'));MEDIA_URL='/media/'
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
CORS_ALLOWED_ORIGINS=['http://demo.localhost:4200','http://demo.localhost:4201']
CORS_ALLOW_CREDENTIALS=True;CSRF_TRUSTED_ORIGINS=CORS_ALLOWED_ORIGINS.copy()
AUTH_COOKIE_SECURE=False;AUTH_COOKIE_SAMESITE='Lax'
SESSION_COOKIE_HTTPONLY=True;SESSION_COOKIE_SAMESITE='Lax';CSRF_COOKIE_SAMESITE='Lax'
X_FRAME_OPTIONS='DENY';SECURE_CONTENT_TYPE_NOSNIFF=True
MLKINO_DEMO_ENV=True;MLKINO_DEMO_SEED_ALLOWED=True
MLKINO_DEMO_PUBLIC_BASE_URL='http://demo.localhost:8102'
PANEL_SETTINGS_PUBLIC_BASE_URL=MLKINO_DEMO_PUBLIC_BASE_URL
MLKINO_WS_ALLOWED_ORIGINS=CORS_ALLOWED_ORIGINS
MLKINO_TILE_CACHE_DIR=BASE_DIR/'.map-cache'
ASGI_APPLICATION='mlkino.asgi.application'

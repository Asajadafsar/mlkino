"""Release overlay: import the EXISTING production settings, never local DB/secrets.

Deployment installs this file alongside the retained server settings.py.
Both WSGI and ASGI must select DJANGO_SETTINGS_MODULE=mlkino.production_release.
"""
from .settings import *  # noqa: F403
from django.core.exceptions import ImproperlyConfigured

import os as _os
_legacy_key = SECRET_KEY
_release_key = _os.environ.get('MLKINO_DJANGO_SECRET_KEY')
if _release_key:
    # Preserve existing JWT sessions while moving Django signing to a strong key.
    SIMPLE_JWT = {**globals().get('SIMPLE_JWT', {}), 'SIGNING_KEY': globals().get('SIMPLE_JWT', {}).get('SIGNING_KEY', _legacy_key)}
    SECRET_KEY_FALLBACKS = list(dict.fromkeys([_legacy_key, *globals().get('SECRET_KEY_FALLBACKS', [])]))
    SECRET_KEY = _release_key
DEBUG = False
ALLOWED_HOSTS = list(dict.fromkeys([*ALLOWED_HOSTS, 'api.mlkino.com']))  # noqa: F405
CORS_ALLOWED_ORIGINS = list(dict.fromkeys([
    *[origin for origin in CORS_ALLOWED_ORIGINS if origin.startswith('https://')],  # noqa: F405
    'https://panel.mlkino.com',
]))
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys([*CORS_ALLOWED_ORIGINS, 'https://api.mlkino.com']))
MLKINO_WS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS

AUTH_COOKIE_SECURE = True
AUTH_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# Only the non-authentication CSRF cookie is readable across these trusted subdomains.
# accessToken / refreshToken / impersonation cookies remain HttpOnly and host-only.
CSRF_COOKIE_DOMAIN = '.mlkino.com'
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 3600
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
TIME_ZONE = 'Asia/Tehran'
PANEL_SETTINGS_PUBLIC_BASE_URL = 'https://api.mlkino.com'

# Preserve server-installed apps and its audit/provider integrations.
MIDDLEWARE = list(dict.fromkeys(MIDDLEWARE))  # noqa: F405
for middleware in reversed(['accounts.middleware.RequestTimezoneMiddleware', 'accounts.middleware.ActivityFailureMiddleware']):
    if middleware not in MIDDLEWARE:
        MIDDLEWARE.insert(MIDDLEWARE.index('django.middleware.security.SecurityMiddleware') + 1, middleware)

if CHANNEL_LAYERS.get('default', {}).get('BACKEND') != 'channels_redis.core.RedisChannelLayer':  # noqa: F405
    raise ImproperlyConfigured('Production requires the existing Redis channel layer; refusing in-memory fallback.')
if not STATIC_ROOT or str(MEDIA_ROOT) != '/var/www/mlkino/media':  # noqa: F405
    raise ImproperlyConfigured('Review static/media paths before enabling this production overlay.')

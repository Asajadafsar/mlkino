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

# redis-py 8 defaults to a 5s read timeout, equal to Channels' 5s blocking poll.
# Give the blocking poll time to finish instead of repeatedly dropping live inboxes.
from copy import deepcopy as _deepcopy
CHANNEL_LAYERS = _deepcopy(CHANNEL_LAYERS)
_channel_config = CHANNEL_LAYERS['default'].setdefault('CONFIG', {})
_channel_hosts = []
for _entry in _channel_config.get('hosts', []):
    if isinstance(_entry, (tuple, list)):
        _host = {'host': _entry[0], 'port': _entry[1]}
    elif isinstance(_entry, dict):
        _host = dict(_entry)
    else:
        _host = {'address': _entry}
    if 'socket_timeout' not in _host or (_host['socket_timeout'] is not None and float(_host['socket_timeout']) < 30):
        _host['socket_timeout'] = 30
    _host.setdefault('socket_connect_timeout', 5)
    _channel_hosts.append(_host)
_channel_config['hosts'] = _channel_hosts

# Settings may contain up to four validated 5 MiB base64 images in one JSON save.
# Individual file/image limits remain enforced by their serializers.
DATA_UPLOAD_MAX_MEMORY_SIZE = 32 * 1024 * 1024

# Nginx overwrites these headers; Gunicorn is reachable only through its Unix socket.
MLKINO_TRUSTED_PROXIES = ['127.0.0.1/32','::1/128']
MLKINO_TRUST_PROXY_HEADERS_WITHOUT_REMOTE = True
MIDDLEWARE = [entry for entry in MIDDLEWARE if entry != 'accounts.utils.ActivityAuditMiddleware']

LANGUAGE_CODE = 'fa'

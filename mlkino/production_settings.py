"""Production settings for the single-domain mlkino.com deployment."""

import os
from pathlib import Path

from .settings import *  # noqa: F403


def required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Required environment variable {name} is missing")
    return value


DEBUG = False
SECRET_KEY = required("DJANGO_SECRET_KEY")
ALLOWED_HOSTS = ["mlkino.com"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "mlkino_db",
        "USER": "mlkino_user",
        "PASSWORD": required("MLKINO_DB_PASSWORD"),
        "HOST": "127.0.0.1",
        "PORT": "5432",
        "CONN_MAX_AGE": 60,
        "OPTIONS": {"connect_timeout": 5},
    }
}

CORS_ALLOWED_ORIGINS = ["https://mlkino.com"]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ["https://mlkino.com"]
MLKINO_WS_ALLOWED_ORIGINS = ["https://mlkino.com"]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"
AUTH_COOKIE_SECURE = True
AUTH_COOKIE_SAMESITE = "Lax"
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

STATIC_URL = "/static/"
STATIC_ROOT = Path("/var/www/mlkino/staticfiles")
MEDIA_URL = "/media/"
MEDIA_ROOT = Path("/var/lib/mlkino/media")

PANEL_SETTINGS_PUBLIC_BASE_URL = "https://mlkino.com"

# One Daphne worker is used on this single host; the in-memory channel layer
# avoids introducing a second datastore/service alongside PostgreSQL.
CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
}

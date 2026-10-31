
from datetime import timedelta

from django.conf import settings


ACCESS_COOKIE = "accessToken"
REFRESH_COOKIE = "refreshToken"
IMPERSONATION_COOKIE = "mlkinoImpersonation"


def get_cookie_options():
    return {
        "domain": None,
        "path": "/",
        "secure": getattr(settings, "AUTH_COOKIE_SECURE", not settings.DEBUG),
        "httponly": True,
        "samesite": getattr(settings, "AUTH_COOKIE_SAMESITE", "Lax" if settings.DEBUG else "None"),
    }


def get_token_lifetime(token_type):
    from rest_framework_simplejwt.settings import api_settings
    return api_settings.ACCESS_TOKEN_LIFETIME if token_type == 'access' else api_settings.REFRESH_TOKEN_LIFETIME


def set_token_cookie(response, name, token, lifetime):
    options = get_cookie_options()

    response.set_cookie(
        key=name,
        value=str(token),
        max_age=int(lifetime.total_seconds()),
        expires=None,
        **options,
    )

    response["Cache-Control"] = "no-store"

    return response


def clear_impersonation_cookie(response):
    options = get_cookie_options()
    response.delete_cookie(
        key=IMPERSONATION_COOKIE,
        path=options["path"],
        domain=options["domain"],
        samesite=options["samesite"],
    )
    return response


def set_auth_cookies(response, access, refresh):
    # A fresh login starts a new identity; refresh only replaces the access cookie.
    clear_impersonation_cookie(response)
    set_token_cookie(
        response,
        ACCESS_COOKIE,
        access,
        get_token_lifetime("access"),
    )

    set_token_cookie(
        response,
        REFRESH_COOKIE,
        refresh,
        get_token_lifetime("refresh"),
    )

    return response


def set_access_cookie(response, access):
    return set_token_cookie(
        response,
        ACCESS_COOKIE,
        access,
        get_token_lifetime("access"),
    )


def clear_auth_cookies(response):
    clear_impersonation_cookie(response)
    for name in (ACCESS_COOKIE, REFRESH_COOKIE):
        response.delete_cookie(
            key=name,
            path="/",
            domain=None,
            samesite=get_cookie_options()["samesite"],
        )

    response["Cache-Control"] = "no-store"

    return response
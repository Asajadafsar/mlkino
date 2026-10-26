
from datetime import timedelta

from django.conf import settings


ACCESS_COOKIE = "accessToken"
REFRESH_COOKIE = "refreshToken"


def get_cookie_options():
    return {
        "domain": None,
        "path": "/",
        "secure": True,
        "httponly": True,
        "samesite": "None",
    }


def get_token_lifetime(token_type):
    jwt_settings = settings.SIMPLE_JWT

    if token_type == "access":
        return jwt_settings.get(
            "ACCESS_TOKEN_LIFETIME",
            timedelta(hours=24),
        )

    return jwt_settings.get(
        "REFRESH_TOKEN_LIFETIME",
        timedelta(days=7),
    )


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


def set_auth_cookies(response, access, refresh):
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
    for name in (ACCESS_COOKIE, REFRESH_COOKIE):
        response.delete_cookie(
            key=name,
            path="/",
            domain=None,
            samesite="None",
        )

    response["Cache-Control"] = "no-store"

    return response
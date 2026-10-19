import os


ACCESS_COOKIE = "accessToken"
REFRESH_COOKIE = "refreshToken"


def is_production():
    return os.getenv("ENV") == "production"


def cookie_settings():
    if is_production():
        return {
            "domain": ".mlkino.ir",
            "secure": True,
            "samesite": "None",
        }
    return {
        "domain": None,
        "secure": False,
        "samesite": "Lax",
    }


def set_auth_cookies(response, access, refresh):
    config = cookie_settings()

    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access,
        httponly=True,
        secure=config["secure"],
        samesite=config["samesite"],
        domain=config["domain"],
        path="/",
        max_age=86400,
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh,
        httponly=True,
        secure=config["secure"],
        samesite=config["samesite"],
        domain=config["domain"],
        path="/",
        max_age=604800,
    )
    return response


def clear_auth_cookies(response):
    config = cookie_settings()

    response.delete_cookie(
        key=ACCESS_COOKIE,
        path="/",
        domain=config["domain"],
        samesite=config["samesite"],
    )
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path="/",
        domain=config["domain"],
        samesite=config["samesite"],
    )

    if is_production():
        old_domains = [
            "api.mlkino.ir",
            "panel.mlkino.ir",
            ".mlkino.ir",
        ]
        for cookie in [ACCESS_COOKIE, REFRESH_COOKIE]:
            for domain in old_domains:
                response.delete_cookie(
                    key=cookie,
                    path="/",
                    domain=domain,
                    samesite="None",
                )

    return response
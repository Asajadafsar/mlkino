from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from accounts.cookies import ACCESS_COOKIE


class CookieJWTAuthentication(JWTAuthentication):
    """
    احراز هویت JWT از طریق کوکی HttpOnly.
    اگه کوکی نبود، fallback به هدر Authorization (برای Swagger).
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_COOKIE)

        if not raw_token:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None
from rest_framework_simplejwt.authentication import JWTAuthentication

from .cookies import ACCESS_COOKIE


class CookieJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_COOKIE)

        if not raw_token:
            header = self.get_header(request)

            if header is None:
                return None

            raw_token = self.get_raw_token(header)

            if raw_token is None:
                return None

        validated_token = self.get_validated_token(raw_token)

        user = self.get_user(validated_token)

        return user, validated_token

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
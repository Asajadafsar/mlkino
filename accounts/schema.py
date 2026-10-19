from drf_spectacular.extensions import OpenApiAuthenticationExtension

class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    # مسیر کامل کلاس احراز هویت شما
    target_class = 'accounts.authentication.CookieJWTAuthentication'
    name = 'CookieJWTAuth'  # نامی که در Swagger نمایش داده می‌شود

    def get_security_definition(self, auto_schema):
        # از آنجا که توکن در کوکی است، نوع را apiKey با مکان cookie تعریف می‌کنیم
        return {
            'type': 'apiKey',
            'in': 'cookie',
            'name': 'accessToken',  # نام کوکی که در کد استفاده می‌کنید
            'description': 'توکن JWT را در این فیلد قرار دهید (بدون پیشوند Bearer).'
        }
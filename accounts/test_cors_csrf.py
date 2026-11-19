from django.http import JsonResponse
from django.test import Client, TestCase, override_settings
from django.urls import path
from mlkino.urls import urlpatterns as application_urls

def failure(request):
    raise RuntimeError('isolated error response test')

urlpatterns = [path('test/failure/', failure), *application_urls]
ORIGINS = ['https://mlkino.com', 'http://localhost:3000', 'http://127.0.0.1:3000']

@override_settings(ROOT_URLCONF=__name__, DEBUG=False, ALLOWED_HOSTS=['testserver'],
    CORS_ALLOWED_ORIGINS=ORIGINS, CSRF_TRUSTED_ORIGINS=ORIGINS,
    CORS_ALLOW_CREDENTIALS=True, CSRF_COOKIE_SECURE=True, CSRF_COOKIE_SAMESITE='None',
    CSRF_COOKIE_HTTPONLY=True, AUTH_COOKIE_SECURE=True, AUTH_COOKIE_SAMESITE='None')
class CorsCsrfTests(TestCase):
    def setUp(self):
        self.client=Client(enforce_csrf_checks=True)
    def test_preflight_is_credentialed_unauthenticated_and_never_redirected(self):
        for origin in ORIGINS:
            for route in ('/accounts/login/password/', '/api/accounts/login/password/', '/panel/users/', '/api/panel/users/'):
                response=self.client.options(route,secure=True,HTTP_ORIGIN=origin,
                    HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type,x-csrftoken')
                self.assertEqual(response.status_code,200)
                self.assertNotIn('Location',response)
                self.assertEqual(response['Access-Control-Allow-Origin'],origin)
                self.assertEqual(response['Access-Control-Allow-Credentials'],'true')
                self.assertIn('x-csrftoken',response['Access-Control-Allow-Headers'].lower())
                self.assertIn('content-type',response['Access-Control-Allow-Headers'].lower())

    def test_untrusted_origins_are_not_reflected(self):
        for origin in ('null','https://evil.test','http://localhost:3000.evil.test','http://localhost:3002'):
            response=self.client.options('/accounts/login/password/',secure=True,HTTP_ORIGIN=origin,HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST')
            self.assertNotIn('Access-Control-Allow-Origin',response)
            response=self.client.post('/api/accounts/login/password/',{},secure=True,HTTP_ORIGIN=origin)
            self.assertEqual(response.status_code,403)
            self.assertNotIn('Access-Control-Allow-Origin',response)

    def test_bootstrap_token_validates_against_the_actual_cookie(self):
        origin='http://localhost:3000'
        bootstrap=self.client.get('/accounts/csrf/',secure=True,HTTP_ORIGIN=origin)
        self.assertEqual(bootstrap.status_code,200)
        self.assertFalse(bootstrap.json()['csrfCookiePresent'])
        self.assertTrue(self.client.get('/accounts/csrf/',secure=True,HTTP_ORIGIN=origin).json()['csrfCookiePresent'])
        self.assertIn('no-store',bootstrap['Cache-Control'])
        self.assertIn('Cookie',bootstrap['Vary'])
        self.assertTrue(bootstrap.cookies['csrftoken']['secure'])
        self.assertTrue(bootstrap.cookies['csrftoken']['httponly'])
        self.assertEqual(bootstrap.cookies['csrftoken']['samesite'],'None')
        route='/api/accounts/login/password/'
        self.assertEqual(self.client.post(route,{},secure=True,HTTP_ORIGIN=origin).status_code,403)
        response=self.client.post(route,{},secure=True,HTTP_ORIGIN=origin,HTTP_X_CSRFTOKEN=bootstrap.json()['csrfToken'])
        self.assertEqual(response.status_code,400)  # Reaches serializer validation, no login or SMS.
        self.assertEqual(response['Access-Control-Allow-Origin'],origin)
        self.client.cookies.clear()
        response=self.client.post(route,{},secure=True,HTTP_ORIGIN=origin,HTTP_X_CSRFTOKEN=bootstrap.json()['csrfToken'])
        self.assertEqual(response.status_code,403)
        self.assertEqual(response.json()['error_code'],'csrf_failed')
        self.assertIn('cookie',response.json()['reason'].lower())
        self.assertEqual(response.json()['recovery'],'same_origin_proxy')

    def test_application_errors_keep_cors_headers(self):
        self.client.raise_request_exception=False
        for route,status in (('/accounts/session/',401),('/api/accounts/session/',401),('/api/accounts/missing/',404),('/test/failure/',500)):
            response=self.client.get(route,secure=True,HTTP_ORIGIN='http://127.0.0.1:3000')
            self.assertEqual(response.status_code,status)
            self.assertEqual(response['Access-Control-Allow-Origin'],'http://127.0.0.1:3000')
            self.assertEqual(response['Access-Control-Allow-Credentials'],'true')

    def test_auth_cookies_remain_httponly_secure_and_cross_site(self):
        from .cookies import set_auth_cookies
        response=set_auth_cookies(JsonResponse({}), 'test-access','test-refresh')
        for name in ('accessToken','refreshToken'):
            self.assertTrue(response.cookies[name]['secure'])
            self.assertTrue(response.cookies[name]['httponly'])
            self.assertEqual(response.cookies[name]['samesite'],'None')
            self.assertEqual(response.cookies[name]['domain'],'')

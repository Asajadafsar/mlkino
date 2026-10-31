from django.http import HttpResponse
from django.test import SimpleTestCase, override_settings

from .cookies import clear_auth_cookies, set_auth_cookies


class LocalAuthenticationTests(SimpleTestCase):
    def test_login_preflight_allows_local_frontends(self):
        for origin in ("http://127.0.0.1:3000", "http://localhost:3000"):
            with self.subTest(origin=origin):
                response = self.client.options(
                    "/accounts/login/password/",
                    HTTP_ORIGIN=origin,
                    HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
                    HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type",
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response["Access-Control-Allow-Origin"], origin)
                self.assertEqual(response["Access-Control-Allow-Credentials"], "true")

    def test_preflight_does_not_allow_other_origins(self):
        response = self.client.options(
            "/accounts/login/password/",
            HTTP_ORIGIN="https://untrusted.example",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )
        self.assertNotIn("Access-Control-Allow-Origin", response)

    @override_settings(AUTH_COOKIE_SECURE=False, AUTH_COOKIE_SAMESITE="Lax", SIMPLE_JWT={})
    def test_local_login_cookies_support_http_and_logout(self):
        response = set_auth_cookies(HttpResponse(), "access", "refresh")
        for name in ("accessToken", "refreshToken"):
            self.assertFalse(response.cookies[name]["secure"])
            self.assertTrue(response.cookies[name]["httponly"])
            self.assertEqual(response.cookies[name]["samesite"], "Lax")
        clear_auth_cookies(response)
        self.assertEqual(response.cookies["accessToken"]["max-age"], 0)

    @override_settings(AUTH_COOKIE_SECURE=True, AUTH_COOKIE_SAMESITE="None", SIMPLE_JWT={})
    def test_https_login_cookies_remain_secure(self):
        response = set_auth_cookies(HttpResponse(), "access", "refresh")
        self.assertTrue(response.cookies["accessToken"]["secure"])
        self.assertEqual(response.cookies["accessToken"]["samesite"], "None")


class MobileNumberTests(SimpleTestCase):
    def test_persian_and_arabic_digits_are_normalized(self):
        from .validators import validate_iranian_mobile
        for phone in ("۰۹۱۲۰۶۹۹۸۰۱", "٠٩١٢٠٦٩٩٨٠١", "09120699801"):
            with self.subTest(phone=phone):
                self.assertEqual(validate_iranian_mobile(phone), "09120699801")


from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from datetime import timedelta
from django.utils import timezone
from .cookies import ACCESS_COOKIE, REFRESH_COOKIE


class SessionPersistenceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser('09120000009', 'test-session-password')
        self.client = APIClient()

    def login(self):
        response = self.client.post('/accounts/login/password/', {
            'phone': self.user.phone, 'password': 'test-session-password',
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        return response

    def test_fresh_app_requests_restore_identity_using_only_cookies(self):
        self.login()
        for _ in range(3):
            restarted = APIClient()
            restarted.cookies = self.client.cookies.copy()
            response = restarted.get('/accounts/profile/')
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data['data']['id'], self.user.pk)

    def test_stale_impersonation_cookie_does_not_invalidate_primary_login(self):
        self.login()
        self.client.cookies['mlkinoImpersonation'] = 'old-session-no-longer-in-database'
        response = self.client.get('/accounts/profile/')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['data']['id'], self.user.pk)

    def test_new_login_and_logout_remove_old_impersonation(self):
        self.client.cookies['mlkinoImpersonation'] = 'old-session'
        response = self.login()
        self.assertEqual(response.cookies['mlkinoImpersonation']['max-age'], 0)
        response = self.client.post('/accounts/logout/')
        self.assertEqual(response.cookies['mlkinoImpersonation']['max-age'], 0)
        self.assertEqual(response.cookies[REFRESH_COOKIE]['max-age'], 0)

    def test_expired_access_restores_profile_with_refresh_cookie(self):
        self.login()
        expired = AccessToken(self.client.cookies[ACCESS_COOKIE].value)
        expired['exp'] = int((timezone.now() - timedelta(seconds=5)).timestamp())
        self.client.cookies[ACCESS_COOKIE] = str(expired)
        self.assertEqual(self.client.get('/accounts/profile/').status_code, 401)
        response = self.client.post('/accounts/token/refresh/')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.client.get('/accounts/profile/').status_code, 200)

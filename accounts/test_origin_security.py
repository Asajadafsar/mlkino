from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, override_settings
from django.middleware.csrf import get_token
from .middleware import TrustedBrowserOriginMiddleware

@override_settings(ALLOWED_HOSTS=['api.mlkino.com'],CORS_ALLOWED_ORIGINS=['https://mlkino.com','https://panel.mlkino.com'],CSRF_TRUSTED_ORIGINS=['https://mlkino.com','https://panel.mlkino.com'])
class BrowserOriginSecurityTests(SimpleTestCase):
    def request(self,origin=None,cookies=False,path='/accounts/token/refresh/',referer=None):
        request=RequestFactory().post(path,{},secure=True,HTTP_HOST='api.mlkino.com')
        if origin is not None:request.META['HTTP_ORIGIN']=origin
        if referer:request.META['HTTP_REFERER']=referer
        if cookies:request.COOKIES['refreshToken']='test-cookie'
        return request
    def check(self,request):return TrustedBrowserOriginMiddleware(lambda r:HttpResponse('ok'))(request)
    def test_foreign_null_and_similar_origins_cannot_mutate_even_login(self):
        for origin in ('https://evil.example','null','https://mlkino.com.evil.example','http://mlkino.com'):
            for path in ('/accounts/login/password/','/accounts/token/refresh/','/panel/users/'):
                self.assertEqual(self.check(self.request(origin,path=path)).status_code,403)
    def test_official_landing_and_panel_support_cookie_mutations(self):
        for origin in ('https://mlkino.com','https://panel.mlkino.com'):
            self.assertEqual(self.check(self.request(origin,cookies=True)).status_code,200)
    def test_cookie_without_browser_provenance_requires_csrf(self):
        self.assertEqual(self.check(self.request(cookies=True)).status_code,403)
        self.assertEqual(self.check(self.request(cookies=True,referer='https://mlkino.com/')).status_code,200)
        request=self.request(cookies=True,referer='https://api.mlkino.com/')
        token=get_token(request);request.COOKIES['csrftoken']=request.META['CSRF_COOKIE'];request.META['HTTP_X_CSRFTOKEN']=token
        self.assertEqual(self.check(request).status_code,200)
    def test_non_browser_without_cookie_can_still_authenticate(self):
        self.assertEqual(self.check(self.request()).status_code,200)

from datetime import timedelta
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from .models import User, OtpToken

class LandingSessionTests(TestCase):
    def setUp(self):
        self.client=APIClient()
        self.user=User.objects.create_user('09127006001','test-password-123',first_name='سارا',last_name='آزمایشی',email='private@example.test')

    def test_guest_gets_401_and_minimal_authenticated_identity_is_not_cacheable(self):
        self.assertEqual(self.client.get('/accounts/session/').status_code,401)
        self.client.force_authenticate(self.user)
        response=self.client.get('/accounts/session/')
        self.assertEqual(response.status_code,200)
        self.assertEqual(set(response.data['data']),{'id','full_name','avatar','role_display','role'})
        self.assertEqual(response.data['data']['full_name'],'سارا آزمایشی')
        self.assertIn('no-store',response['Cache-Control'])

    def test_existing_account_without_address_is_not_a_registration_draft(self):
        self.assertFalse(self.user.has_profile)
        self.assertFalse(self.user.registration_required)
        response=self.client.post('/accounts/login/password/',{'phone':self.user.phone,'password':'test-password-123'},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(response.data['data']['next_step'],'dashboard')
        self.assertFalse(response.data['data']['user']['registration_required'])
        profile=self.client.get('/accounts/profile/')
        self.assertEqual(profile.status_code,200)
        self.assertFalse(profile.data['data']['registration_required'])
        self.assertEqual(self.client.get('/accounts/session/').status_code,200)

    def test_only_unfinished_otp_registration_requires_completion(self):
        draft=User.objects.create_user('09127006002')
        self.assertTrue(draft.registration_required)
        self.client.force_authenticate(draft)
        self.assertTrue(self.client.get('/accounts/profile/').data['data']['registration_required'])
        draft.role='agency';draft.save()
        self.assertFalse(draft.registration_required)
        draft.role='superadmin';draft.save()
        self.assertFalse(draft.registration_required)

    def test_otp_existing_account_with_missing_fields_returns_dashboard(self):
        OtpToken.objects.create(phone=self.user.phone,code='123456',expires_at=timezone.now()+timedelta(minutes=2))
        response=self.client.post('/accounts/verify-otp/',{'phone':self.user.phone,'code':'123456'},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(response.data['data']['next_step'],'dashboard')

    @override_settings(CORS_ALLOWED_ORIGINS=['http://localhost:3001'],CORS_ALLOW_CREDENTIALS=True)
    def test_landing_origin_can_read_cookie_session(self):
        self.client.force_authenticate(self.user)
        response=self.client.get('/accounts/session/',HTTP_ORIGIN='http://localhost:3001')
        self.assertEqual(response['Access-Control-Allow-Origin'],'http://localhost:3001')
        self.assertEqual(response['Access-Control-Allow-Credentials'],'true')

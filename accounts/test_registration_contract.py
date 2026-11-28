from unittest.mock import patch
from datetime import timedelta
from io import BytesIO
from tempfile import TemporaryDirectory
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import User, OtpToken
from .services.jibit import JibitError


class RegistrationContractTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('09127005071')
        self.client = APIClient()
        self.media = TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.media.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        image=BytesIO(); Image.new('RGB',(32,32),'blue').save(image,format='PNG')
        self.avatar=SimpleUploadedFile('avatar.png',image.getvalue(),content_type='image/png')
        self.payload = dict(email='member@example.test', birth_date='1990-01-01', avatar=self.avatar, first_name='نام', last_name='آزمایشی', national_code='1234567891',
                            postal_code='1234567890', password=' spaced-password ',
                            password_confirm=' spaced-password ', user_type='consumer')
        self.address = dict(postal_code='1234567890', province='قم', city='قم', address='نشانی رسمی آزمایشی')

    def complete(self):
        self.client.force_authenticate(self.user)
        return self.client.post('/api/accounts/complete-register/', self.payload, format='multipart')

    @patch('accounts.views.shahkar_match')
    def test_duplicate_national_code_has_a_specific_error(self, identity):
        User.objects.create_user('09127005072', national_code=self.payload['national_code'])
        response = self.complete()
        self.assertEqual(response.status_code, 400)
        self.assertIn('این کد ملی قبلاً ثبت شده است.', response.data['message'])
        self.assertEqual(response.data['errors'][0]['field'], 'national_code')
        identity.assert_not_called()

    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match', return_value=True)
    def test_verified_registration_preserves_exact_password(self, identity, postal):
        postal.return_value = self.address
        response = self.complete()
        self.assertEqual(response.status_code, 201, response.data)
        identity.assert_called_once_with('1234567891', self.user.phone)
        postal.assert_called_once_with('1234567890')
        self.user.refresh_from_db()
        self.assertTrue(self.user.national_code_verified)
        self.assertFalse(self.user.registration_required)
        self.client.force_authenticate(None)
        response = self.client.post('/api/accounts/login/password/', dict(phone=self.user.phone, password=self.payload['password']), format='json')
        self.assertEqual(response.status_code, 200, response.data)

    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match')
    def test_provider_outage_cannot_complete_identity(self, identity, postal):
        identity.side_effect = JibitError('unavailable', status_code=503)
        self.assertEqual(self.complete().status_code, 503)
        postal.assert_not_called()
        self.user.refresh_from_db()
        self.assertTrue(self.user.registration_required)

    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match', return_value=True)
    def test_manual_address_cannot_bypass_postal_outage(self, identity, postal):
        postal.side_effect = JibitError('unavailable', status_code=503)
        self.payload.update(postal_manual=True, **{k:self.address[k] for k in ('province','city','address')})
        response = self.complete()
        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.data['manual_address_allowed'])

    def test_otp_and_existing_password_do_not_skip_incomplete_profile(self):
        self.user.set_password('existing-password')
        self.user.save()
        OtpToken.objects.create(phone=self.user.phone, code='123456', expires_at=timezone.now()+timedelta(minutes=2))
        response = self.client.post('/api/accounts/verify-otp/', dict(phone=self.user.phone, code='123456'), format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['data']['next_step'], 'complete_register')

    def test_all_editable_profile_fields_are_required(self):
        for field in ('email','avatar','birth_date'):
            payload={k:v for k,v in self.payload.items() if k != field}
            self.client.force_authenticate(self.user)
            response=self.client.post('/api/accounts/complete-register/',payload,format='multipart')
            self.assertEqual(response.status_code,400,response.data)
            self.assertIn(field,str(response.data))
            self.avatar.seek(0)

    def test_registration_requires_national_and_postal_codes(self):
        self.payload.pop('national_code')
        self.payload.pop('postal_code')
        self.assertEqual(self.complete().status_code, 400)

    def test_password_reset_requires_otp_and_preserves_exact_password(self):
        OtpToken.objects.create(phone=self.user.phone,code='12345',purpose=OtpToken.Purpose.PASSWORD_RESET,
                                expires_at=timezone.now()+timedelta(minutes=2))
        response=self.client.post('/api/accounts/password/reset/verify-otp/',dict(phone=self.user.phone,code='00000'),format='json')
        self.assertEqual(response.status_code,400)
        response=self.client.post('/api/accounts/password/reset/verify-otp/',dict(phone=self.user.phone,code='12345'),format='json')
        self.assertEqual(response.status_code,200,response.data)
        token=response.data['data']['reset_token']
        payload=dict(token=token,new_password=' reset-password ',new_password_confirm=' reset-password ')
        response=self.client.post('/api/accounts/password/reset/complete/',payload,format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(payload['new_password']))
        self.assertEqual(self.client.post('/api/accounts/password/reset/complete/',payload,format='json').status_code,400)

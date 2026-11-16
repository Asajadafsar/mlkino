from unittest.mock import patch
from io import BytesIO
from tempfile import TemporaryDirectory
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.test import TestCase
from rest_framework.test import APIClient
from .models import User
from .services.jibit import JibitError
class RegistrationOutageTests(TestCase):
    def setUp(self):
        self.user=User.objects.create_user('09127005001');self.client=APIClient();self.client.force_authenticate(self.user)
        self.media=TemporaryDirectory();self.addCleanup(self.media.cleanup);self.override=override_settings(MEDIA_ROOT=self.media.name);self.override.enable();self.addCleanup(self.override.disable)
        image=BytesIO();Image.new('RGB',(32,32),'blue').save(image,format='PNG');self.image_data=image.getvalue()
        self.payload={'email':'member@example.test','birth_date':'1990-01-01','first_name':'نام','last_name':'آزمایشی','national_code':'1234567891','postal_code':'1234567890','password':'test-pass-12345','password_confirm':'test-pass-12345','user_type':'consumer'}
        self.address={'postal_code':'1234567890','province':'قم','city':'قم','address':'قم نشانی رسمی استعلام شده'}
    def post(self,**extra):return self.client.post('/api/accounts/complete-register/',{**self.payload,'avatar':SimpleUploadedFile('avatar.png',self.image_data,content_type='image/png'),**extra},format='multipart')
    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match')
    def test_first_registration_normalizes_persian_national_code(self,identity,postal):
        identity.return_value=True;postal.return_value=self.address
        r=self.post(national_code='۱۲۳۴۵۶۷۸۹۱');self.assertEqual(r.status_code,201,r.data);identity.assert_called_once_with('1234567891',self.user.phone)
        self.user.refresh_from_db();self.assertTrue(self.user.national_code_verified);self.assertEqual(self.user.address_source,'postal')
    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match')
    def test_balance_failure_blocks_registration_without_claiming_verified(self,identity,postal):
        identity.side_effect=JibitError('bad',code='balance.not_enough',status_code=400);postal.return_value=self.address
        r=self.post();self.assertEqual(r.status_code,503,r.data);self.assertIn('اعتبار',r.data['message']);self.user.refresh_from_db();self.assertFalse(self.user.national_code_verified);self.assertFalse(self.user.has_profile);postal.assert_not_called()
    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match')
    def test_manual_postal_cannot_bypass_registration_lookup(self,identity,postal):
        identity.return_value=True;postal.side_effect=JibitError('bad',code='balance.not_enough',status_code=400)
        r=self.post();self.assertEqual(r.status_code,503,r.data);self.assertFalse(r.data['manual_address_allowed']);self.user.refresh_from_db();self.assertFalse(self.user.has_profile)
        r=self.post(postal_manual=True,province='قم',city='قم',address='نشانی دستی کامل دفتر آزمایشی');self.assertEqual(r.status_code,503,r.data);self.user.refresh_from_db();self.assertFalse(self.user.has_profile)
    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match')
    def test_manual_input_cannot_override_a_working_provider(self,identity,postal):
        identity.return_value=True;postal.return_value=self.address
        r=self.post(postal_manual=True,province='تهران',city='تهران',address='نشانی دلخواه کاربر');self.assertEqual(r.status_code,201,r.data);self.user.refresh_from_db();self.assertEqual(self.user.address,self.address['address']);self.assertEqual(self.user.address_source,'postal')
    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match')
    def test_actual_identity_mismatch_blocks_registration(self,identity,postal):
        identity.side_effect=JibitError('mismatch',code='shahkar_mismatch',status_code=400)
        r=self.post();self.assertEqual(r.status_code,400);self.assertIn('به نام',r.data['message']);postal.assert_not_called();self.user.refresh_from_db();self.assertFalse(self.user.has_profile)
    @patch('accounts.views.postal_lookup')
    @patch('accounts.views.shahkar_match')
    def test_invalid_postal_is_not_an_outage_and_bad_manual_address_is_rejected(self,identity,postal):
        identity.return_value=True;postal.side_effect=JibitError('کد پستی نامعتبر',code='postalcode.not_valid',status_code=400)
        self.assertEqual(self.post(postal_manual=True,province='قم',city='قم',address='نشانی کامل نمونه').status_code,400)
        postal.side_effect=JibitError('unavailable',status_code=503)
        self.assertEqual(self.post(postal_manual=True,province='قم',city='شهر نادرست',address='نشانی کامل نمونه').status_code,503)
    @patch('accounts.views.shahkar_match')
    def test_pending_identity_can_be_retried_for_self_only(self,identity):
        self.user.national_code='1234567891';self.user.verification_status='pending';self.user.save();identity.return_value=True
        self.assertEqual(self.client.post('/api/accounts/identity/retry/',{'national_code':'9999999999'},format='json').status_code,400)
        r=self.client.post('/api/accounts/identity/retry/',{},format='json');self.assertEqual(r.status_code,200,r.data);self.user.refresh_from_db();self.assertTrue(self.user.national_code_verified)
    @patch('accounts.views.postal_lookup')
    def test_self_profile_manual_address_during_outage(self,postal):
        postal.side_effect=JibitError('unavailable',status_code=503)
        r=self.client.patch('/api/accounts/profile/',{'postal_code':'1234567890','postal_manual':True,'province':'قم','city':'قم','address':'قم نشانی دستی کامل آزمایشی'},format='json')
        self.assertEqual(r.status_code,200,r.data);self.user.refresh_from_db();self.assertEqual(self.user.address_source,'manual');self.assertNotIn('postal_manual',r.data['data'])

    def test_provider_mismatch_alias_is_never_treated_as_an_outage(self):
        from .lookup_policy import service_error,outage
        for code in ('mobile.national_code.not_match','ownership_mismatch'):
            error=service_error(JibitError('مالکیت کد ملی و شماره موبایل مطابقت ندارد.',code=code),'identity')
            self.assertFalse(outage(error));self.assertEqual(error.status_code,400)

    def test_incomplete_account_can_resume_through_valid_otp(self):
        from .models import OtpToken
        from django.utils import timezone
        from datetime import timedelta
        OtpToken.objects.create(phone=self.user.phone,code='123456',expires_at=timezone.now()+timedelta(minutes=2))
        self.client.force_authenticate(None)
        response=self.client.post('/api/accounts/login/otp/',{'phone':self.user.phone,'code':'123456'},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.assertFalse(response.data['data']['user']['has_profile'])

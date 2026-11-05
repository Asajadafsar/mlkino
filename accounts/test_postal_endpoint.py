from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.services.jibit import JibitError
class PostalEndpointTests(TestCase):
    def setUp(self):
        self.client=APIClient();self.client.force_authenticate(get_user_model().objects.create_user('09127001201'))
    @patch('accounts.views.postal_lookup')
    def test_preserves_provider_failure_status_and_explains_error(self,lookup):
        lookup.side_effect=JibitError('سرویس موقتاً در دسترس نیست',code='providers.not_available',status_code=503)
        r=self.client.get('/accounts/postal/lookup/',{'postal_code':'1234567890'});self.assertEqual(r.status_code,503);self.assertIn('کد پستی',r.data['message']);self.assertTrue(r.data['manual_address_allowed'])
    @patch('accounts.views.postal_lookup')
    def test_valid_lookup_returns_address_without_requiring_profile(self,lookup):
        lookup.return_value={'postal_code':'1234567890','province':'قم','city':'قم','address':'نشانی آزمایشی'}
        r=self.client.get('/accounts/postal/lookup/',{'postal_code':'۱۲۳۴۵۶۷۸۹۰'});self.assertEqual(r.status_code,200,r.data);self.assertEqual(r.data['data']['city'],'قم');lookup.assert_called_once_with('1234567890')

import base64
import hashlib
import hmac
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


class CallConfigTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user('09123334455')

    def test_requires_authentication(self):
        self.assertIn(self.client.get('/panel/chats/call-config/').status_code, (401, 403))

    @override_settings(MLKINO_TURN_SECRET='test-only-secret', MLKINO_TURN_URLS=['turn:example.test:3478?transport=tcp'])
    @patch('panel.call_config.time.time', return_value=1000)
    def test_expiring_user_credentials_and_no_secret_exposure(self, clock):
        self.client.force_authenticate(self.user)
        response = self.client.get('/panel/chats/call-config/')
        self.assertEqual(response.status_code, 200)
        server = response.data['data']['ice_servers'][0]
        self.assertEqual(server['username'], f'4600:{self.user.pk}')
        expected = base64.b64encode(hmac.new(b'test-only-secret', server['username'].encode(), hashlib.sha1).digest()).decode()
        self.assertEqual(server['credential'], expected)
        self.assertNotIn('test-only-secret', str(response.data))
        self.assertEqual(response['Cache-Control'], 'no-store, private')

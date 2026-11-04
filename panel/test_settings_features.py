from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class PanelFeatureSettingsTests(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_superuser('09123333100', 'root-password')
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_root_can_change_visible_panel_modules_and_appearance_exposes_them(self):
        response = self.client.patch('/panel/settings/', {'features': {'views': True, 'chats': False}}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data['data']['features']['views'])
        appearance = self.client.get('/panel/appearance/')
        self.assertEqual(appearance.status_code, 200)
        self.assertFalse(appearance.data['data']['features']['chats'])

    def test_invalid_feature_values_are_rejected(self):
        response = self.client.patch('/panel/settings/', {'features': {'views': 'yes'}}, format='json')
        self.assertEqual(response.status_code, 400)

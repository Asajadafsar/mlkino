from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import ActivityLog, DeviceSession, PasswordResetToken, User


class ManagedPasswordResetTests(TestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_superuser('09008001001', 'demo-admin!V17')
        self.user = User.objects.create_user('09008001002', 'before!V25')
        self.url = f'/api/panel/users/{self.user.pk}/password-reset/'
        self.payload = {'admin_password': 'demo-admin!V17', 'new_password': 'Different-Test-Pass_438!'}

    def test_reauth_updates_hash_and_revokes_device_and_recovery_tokens(self):
        future = timezone.now() + timedelta(days=1)
        session = DeviceSession.objects.create(user=self.user, refresh_key='test-key', expires_at=future)
        recovery = PasswordResetToken.objects.create(user=self.user, expires_at=future)
        client = APIClient()
        client.force_authenticate(self.admin)
        self.assertEqual(client.post(self.url, {**self.payload, 'admin_password': 'wrong'}, format='json').status_code, 403)
        response = client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.user.refresh_from_db()
        session.refresh_from_db()
        recovery.refresh_from_db()
        self.assertTrue(self.user.check_password(self.payload['new_password']))
        self.assertIsNotNone(session.revoked_at)
        self.assertTrue(recovery.is_used)
        audit = ActivityLog.objects.get(event='user.password.reset')
        self.assertEqual(audit.metadata, {'target_type': 'user', 'target_id': self.user.pk})
        self.assertNotIn('password', response.data.get('data', {}) or {})

    def test_an_account_cannot_reset_others_or_another_admin(self):
        client = APIClient()
        client.force_authenticate(self.user)
        self.assertEqual(client.post(self.url, self.payload, format='json').status_code, 403)
        another_admin = User.objects.create_superuser('09008001003', 'other-admin!V63')
        client.force_authenticate(self.admin)
        self.assertEqual(client.post(f'/api/panel/users/{another_admin.pk}/password-reset/',
                                     self.payload, format='json').status_code, 403)

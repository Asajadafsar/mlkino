from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import ImpersonationSession

User = get_user_model()


class PanelRoleFlowTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('09120000001', 'test-admin-password')
        self.user = User.objects.create_user('09120000002', role=User.Role.USER)
        self.other = User.objects.create_user('09120000003', role=User.Role.EXPERT)
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_address_update_is_present_in_fresh_details(self):
        address = {'postal_code': '1234567890', 'province': 'تهران', 'city': 'تهران', 'address': 'نشانی تست'}
        response = self.client.patch(f'/panel/users/{self.user.pk}/', address, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        response = self.client.get(f'/panel/users/{self.user.pk}/')
        for field, value in address.items():
            self.assertEqual(response.data['data'][field], value)

    def test_ticket_admin_replies_and_internal_messages_remain_private(self):
        member = APIClient()
        member.force_authenticate(self.user)
        response = member.post('/panel/tickets/', {'subject': 'تیکت تست', 'category': 'other', 'message': 'پیام تست'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        ticket_id = response.data['data']['id']
        response = self.client.get('/panel/tickets/')
        self.assertIn(ticket_id, [row['id'] for row in response.data['data']['results']])
        response = self.client.post(f'/panel/tickets/{ticket_id}/replies/', {'message': 'پاسخ پشتیبانی'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['data']['status'], 'answered')
        response = self.client.post(f'/panel/tickets/{ticket_id}/replies/', {'message': 'یادداشت داخلی', 'is_internal': True}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        messages = member.get(f'/panel/tickets/{ticket_id}/').data['data']['messages']
        self.assertEqual(len(messages), 2)
        self.assertFalse(any(message['is_internal'] for message in messages))
        member.force_authenticate(self.other)
        self.assertEqual(member.get(f'/panel/tickets/{ticket_id}/').status_code, 404)
        self.assertEqual(self.client.post('/panel/tickets/', {'category': 'other', 'subject': 'تست', 'message': 'تست'}, format='json').status_code, 403)

    def test_normal_user_cannot_manage_users(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get('/panel/users/').status_code, 403)

    def test_passwordless_impersonation_return_and_expiry(self):
        client = APIClient(enforce_csrf_checks=True)
        response = client.post('/accounts/login/password/', {'phone': self.admin.phone, 'password': 'test-admin-password'}, format='json')
        self.assertEqual(response.status_code, 200)
        client.get('/panel/impersonation/csrf/')
        headers = {'HTTP_X_CSRFTOKEN': client.cookies['csrftoken'].value}
        response = client.post(f'/panel/users/{self.user.pk}/impersonate/', {}, format='json', **headers)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(client.get('/accounts/profile/').data['data']['id'], self.user.pk)
        ticket = {'category': 'other', 'subject': 'تیکت ورود مدیریتی', 'message': 'درخواست آزمایشی'}
        denied = client.post('/panel/tickets/', ticket, format='json')
        self.assertEqual(denied.status_code, 403)
        created = client.post('/panel/tickets/', ticket, format='json', **headers)
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data['data']['creator'], self.user.pk)

        response = client.post('/panel/impersonation/exit/', {}, format='json', **headers)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(client.get('/accounts/profile/').data['data']['id'], self.admin.pk)
        response = client.post(f'/panel/users/{self.user.pk}/impersonate/', {}, format='json', **headers)
        self.assertEqual(response.status_code, 200, response.data)
        ImpersonationSession.objects.filter(actor=self.admin, revoked_at__isnull=True).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(client.get('/accounts/profile/').data['data']['id'], self.admin.pk)

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import AgencyExpert, ExpertProfile

User = get_user_model()


class UserManagementScopeTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('09123333000', 'root-password')
        self.agency = User.objects.create_user('09123333001', role='agency')
        self.other_agency = User.objects.create_user('09123333002', role='agency')
        self.expert = User.objects.create_user('09123333003', role='expert')
        self.other_expert = User.objects.create_user('09123333004', role='expert')
        self.member = User.objects.create_user('09123333005', role='user')
        AgencyExpert.objects.create(agency=self.agency, expert=self.expert)
        AgencyExpert.objects.create(agency=self.other_agency, expert=self.other_expert)
        ExpertProfile.objects.create(user=self.expert)
        ExpertProfile.objects.create(user=self.other_expert)
        self.client = APIClient()
        self.client.force_authenticate(self.agency)

    def test_agency_sees_and_edits_only_own_experts(self):
        response = self.client.get('/panel/users/?group=expert')
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row['id'] for row in response.data['data']['results']], [self.expert.pk])
        self.assertEqual(self.client.get(f'/panel/users/{self.other_expert.pk}/').status_code, 404)
        response = self.client.patch(f'/panel/users/{self.expert.pk}/', {'first_name': 'کارشناس', 'job_title': 'فروش', 'job_details': 'توضیحات حرفه‌ای'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.client.patch(f'/panel/users/{self.other_expert.pk}/', {'first_name': 'تغییر'}, format='json').status_code, 404)
        self.assertEqual(self.client.patch(f'/panel/users/{self.expert.pk}/', {'role': 'superadmin'}, format='json').status_code, 403)
        self.assertEqual(self.client.get('/panel/users/?group=agency').status_code, 403)
        groups = self.client.get('/panel/users/groups/').data['data']['results']
        self.assertEqual([group['role'] for group in groups], ['expert'])

    def test_new_expert_is_attached_to_calling_agency_and_cannot_be_attached_elsewhere(self):
        payload = {'phone': '09123333006', 'password': 'expert-password', 'first_name': 'کارشناس', 'last_name': 'جدید', 'role': 'expert'}
        response = self.client.post('/panel/users/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        created = User.objects.get(pk=response.data['data']['id'])
        self.assertTrue(created.check_password('expert-password'))
        self.assertTrue(AgencyExpert.objects.filter(agency=self.agency, expert=created, is_active=True).exists())
        payload.update(phone='09123333007', agency_id=self.other_agency.pk)
        self.assertEqual(self.client.post('/panel/users/', payload, format='json').status_code, 400)
        payload.update(role='user')
        self.assertEqual(self.client.post('/panel/users/', payload, format='json').status_code, 400)

    def test_other_roles_cannot_access_user_management(self):
        for user in (self.member, self.expert):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get('/panel/users/').status_code, 403)
            self.assertEqual(self.client.get('/panel/users/groups/').status_code, 403)
            self.assertEqual(self.client.get(f'/panel/users/{self.member.pk}/').status_code, 403)

    def test_superadmin_manages_all_categories_and_can_create_admin(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get('/panel/users/groups/')
        self.assertEqual(len(response.data['data']['results']), 4)
        self.assertEqual(self.client.get(f'/panel/users/{self.other_expert.pk}/').status_code, 200)
        response = self.client.post('/panel/users/', {'phone': '09123333008', 'password': 'admin-password', 'first_name': 'مدیر', 'last_name': 'جدید', 'role': 'superadmin', 'admin_level': 'support', 'is_staff': True, 'is_superuser': False}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        created = User.objects.get(pk=response.data['data']['id'])
        self.assertEqual(created.role, 'superadmin')
        self.assertTrue(created.is_staff)
        self.assertFalse(created.is_superuser)

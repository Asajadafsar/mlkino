import tempfile
from datetime import timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import AgencyExpert, AgencyProfile, OfficePayment, OfficeSubscription, User
from panel.models import AgencyExpertLink, PropertyRecord
from panel.public_api import public_rows


class OfficeOnboardingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(phone='09120000101', password='test-password', is_staff=True)
        self.office = User.objects.create_user(phone='09120000102', role='agency')
        self.other = User.objects.create_user(phone='09120000103', role='agency')
        self.admin = User.objects.create_user(phone='09120000104', role='superadmin')
        AgencyProfile.objects.create(manager=self.office, agency_name='دفتر نمونه', office_address='تهران', occupancy_type='owner')
        self.subscription = OfficeSubscription.objects.create(office=self.office)
        self.url = '/accounts/role-applications/'

    def as_user(self, user):
        self.client.force_authenticate(user)

    def decision(self, application, **data):
        return self.client.post(f'{self.url}{application}/decision/', {'decision': 'approve', **data}, format='json')

    def test_only_selected_office_can_approve_collaboration(self):
        self.as_user(self.user)
        code = str(self.subscription.code)
        preview = self.client.get('/accounts/office-lookup/', {'code': code})
        self.assertEqual(preview.data['name'], 'دفتر نمونه')
        self.assertEqual(preview.data['active_experts'], 0)
        resume = {'kind': 'expert', 'code': code, 'confirm_office': True, 'job_title': 'مشاور', 'specialties': ['فروش'],
                  'experience_years': 2, 'job_details': 'سابقه کار در فروش املاک'}
        self.assertEqual(self.client.post(self.url, {**resume, 'confirm_office': False}, format='json').status_code, 400)
        response = self.client.post(self.url, resume, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        application = response.data['id']
        self.assertEqual(self.client.post(self.url, resume, format='json').status_code, 400)
        for reviewer in (self.user, self.other, self.admin):
            self.as_user(reviewer)
            self.assertEqual(self.decision(application).status_code, 404)
        self.as_user(self.office)
        self.assertEqual(self.client.get(self.url).data['incoming'][0]['details']['specialties'], ['فروش'])
        self.assertEqual(self.decision(application).status_code, 200)
        self.assertEqual(self.decision(application).status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'expert')
        self.assertTrue(AgencyExpert.objects.filter(agency=self.office, expert=self.user, is_active=True).exists())
        self.assertTrue(AgencyExpertLink.objects.filter(agency=self.office, expert=self.user).exists())

    def test_office_review_with_multipart_profile_and_terms(self):
        buffer = BytesIO()
        Image.new('RGB', (48, 48)).save(buffer, format='PNG')
        self.as_user(self.user)
        with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            response = self.client.post(self.url, {
                'kind': 'office', 'tier': 'free', 'accept_terms': 'true', 'agency_name': 'دفتر جدید',
                'occupancy_type': 'owner', 'landline': '02112345678', 'office_address': 'تهران خیابان نمونه',
                'office_district': '۱', 'office_neighborhood': 'محله نمونه',
                'logo': SimpleUploadedFile('logo.png', buffer.getvalue(), content_type='image/png'),
                'has_business_license': 'false',
            })
            self.assertEqual(response.status_code, 201, response.data)
            application = response.data['id']
            self.as_user(self.office)
            self.assertEqual(self.decision(application).status_code, 404)
            self.as_user(self.admin)
            self.assertEqual(self.client.get(self.url).data['incoming'][0]['profile']['agency_name'], 'دفتر جدید')
            self.assertEqual(self.decision(application).status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'agency')
        self.assertEqual(self.user.office_subscription.active_tier, 'free')

    def test_paid_upgrade_requires_unique_confirmation_and_expires(self):
        self.as_user(self.office)
        response = self.client.post(self.url, {'kind': 'upgrade', 'tier': 'pro', 'accept_terms': True}, format='json')
        application = response.data['id']
        self.as_user(self.admin)
        self.assertEqual(self.decision(application).status_code, 400)
        self.assertEqual(self.decision(application, payment_reference='bank-id-001').status_code, 200)
        self.assertEqual(OfficePayment.objects.get().amount, 299_000)
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.active_tier, 'pro')
        file = PropertyRecord.objects.create(created_by=self.office, office=self.office, kind='file', publication_state='published')
        self.as_user(self.office)
        self.assertEqual(self.client.post('/accounts/office-promotions/', {'file_id': file.id}).status_code, 200)
        self.assertTrue(public_rows().get(pk=file.pk).paid_promotion)
        self.subscription.paid_until = timezone.now() - timedelta(seconds=1)
        self.subscription.save(update_fields=['paid_until'])
        self.assertFalse(public_rows().get(pk=file.pk).paid_promotion)
        self.assertEqual(self.client.post('/accounts/office-promotions/', {'file_id': file.id}).status_code, 403)
        self.assertEqual(self.client.post('/accounts/diamond-ad-copy/', {'facts': 'آپارتمان دو خوابه'}).status_code, 403)
        response = self.client.post(self.url, {'kind': 'upgrade', 'tier': 'pro', 'accept_terms': True}, format='json')
        self.as_user(self.admin)
        self.assertEqual(self.decision(response.data['id'], payment_reference='bank-id-001').status_code, 400)

    def test_demo_gateway_is_configurable_only_by_admin_and_cannot_activate_subscription(self):
        options = {'enabled': True, 'title': 'درگاه نمونه', 'default_result': 'failure'}
        config = '/accounts/gateway-settings/'
        checkout = '/accounts/demo-checkout/'
        self.as_user(self.office)
        self.assertEqual(self.client.put(config, options, format='json').status_code, 403)
        self.as_user(self.admin)
        self.assertEqual(self.client.put(config, options, format='json').status_code, 200)
        self.as_user(self.office)
        self.assertEqual(self.client.post(checkout, {'tier': 'pro'}, format='json').data['result'], 'failure')
        receipt = self.client.post(checkout, {'tier': 'pro', 'result': 'success'}, format='json').data
        self.assertTrue(receipt['reference'].startswith('DEMO-'))
        response = self.client.post(self.url, {'kind': 'upgrade', 'tier': 'pro', 'accept_terms': True}, format='json')
        self.as_user(self.admin)
        self.assertEqual(self.decision(response.data['id'], payment_reference=receipt['reference']).status_code, 400)
        self.assertFalse(OfficePayment.objects.exists())
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.active_tier, 'free')
        self.client.put(config, {**options, 'enabled': False}, format='json')
        self.assertEqual(self.client.post(checkout, {'tier': 'pro'}, format='json').status_code, 403)

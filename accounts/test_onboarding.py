import tempfile
from datetime import timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import AccountNotification, AgencyExpert, AgencyProfile, OfficePayment, OfficeSubscription, RoleApplication, User
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

    def test_office_rotates_its_own_collaboration_code(self):
        original = str(self.subscription.code)
        self.as_user(self.user)
        self.assertEqual(self.client.post('/accounts/office-code/').status_code, 403)
        self.as_user(self.office)
        response = self.client.post('/accounts/office-code/', {'office_id': self.other.pk})
        self.assertEqual(response.status_code, 200, response.data)
        self.subscription.refresh_from_db()
        self.assertNotEqual(str(self.subscription.code), original)
        self.assertFalse(OfficeSubscription.objects.filter(office=self.other).exists())
        self.as_user(self.user)
        self.assertEqual(self.client.get('/accounts/office-lookup/', {'code': original}).status_code, 404)
        self.assertEqual(self.client.get('/accounts/office-lookup/', {'code': self.subscription.code}).data['name'], 'دفتر نمونه')

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

    def test_office_to_expert_requires_destination_then_superadmin(self):
        self.as_user(self.office)
        destination = self.other
        AgencyProfile.objects.create(manager=destination, agency_name='دفتر مقصد', office_address='تهران', occupancy_type='owner')
        code = OfficeSubscription.objects.create(office=destination).code
        params = {'kind': 'expert', 'code': str(code), 'confirm_office': True, 'job_title': 'مشاور',
                  'specialties': ['فروش'], 'experience_years': 2, 'job_details': 'سابقه فروش ملک'}
        response = self.client.post(self.url, params, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        pk = response.data['id']
        self.as_user(self.admin)
        self.assertEqual(self.decision(pk).status_code, 404)
        self.as_user(destination)
        self.assertEqual(self.decision(pk).data['status'], 'pending')
        self.office.refresh_from_db()
        self.assertEqual(self.office.role, 'agency')
        self.as_user(self.admin)
        self.assertEqual(self.decision(pk).data['status'], 'approved')
        self.office.refresh_from_db()
        self.assertEqual(self.office.role, 'expert')
        self.assertTrue(AgencyExpert.objects.filter(expert=self.office, agency=destination, is_active=True).exists())
        self.assertTrue(OfficeSubscription.objects.filter(office=self.office).exists())

    def test_free_office_approval_activates_without_payment(self):
        self.user.role = 'expert'
        self.user.save(update_fields=['role'])
        AgencyExpert.objects.create(expert=self.user, agency=self.office)
        AgencyExpertLink.objects.create(expert=self.user, agency=self.office)
        row = RoleApplication.objects.create(applicant=self.user, kind='office', tier='free',
                                              details={'applicant_role': 'expert', 'monthly_price': 0})
        self.as_user(self.admin)
        response = self.decision(row.pk)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['status'], 'approved')
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'agency')
        self.assertEqual(OfficeSubscription.objects.get(office=self.user).active_tier, 'free')
        self.assertFalse(AgencyExpert.objects.get(expert=self.user).is_active)

    def test_office_review_with_multipart_profile_and_terms(self):
        buffer = BytesIO()
        Image.new('RGB', (48, 48)).save(buffer, format='PNG')
        self.as_user(self.user)
        with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            application_data = {
                'kind': 'office', 'tier': 'free', 'accept_terms': 'true', 'agency_name': 'دفتر جدید',
                'occupancy_type': 'owner', 'landline': '02112345678', 'office_address': 'تهران خیابان نمونه',
                'office_district': '۱', 'office_neighborhood': 'محله نمونه',
                'logo': SimpleUploadedFile('logo.png', buffer.getvalue(), content_type='image/png'),
                'has_business_license': 'false',
            }
            self.assertEqual(self.client.post(self.url, {**application_data, 'accept_terms': 'false'}).status_code, 400)
            application_data['tier'] = 'pro'
            application_data['logo'].seek(0)
            response = self.client.post(self.url, application_data)
            self.assertEqual(response.status_code, 201, response.data)
            application = response.data['id']
            self.as_user(self.office)
            self.assertEqual(self.decision(application).status_code, 404)
            self.as_user(self.admin)
            self.assertEqual(self.client.get(self.url).data['incoming'][0]['profile']['agency_name'], 'دفتر جدید')
            self.assertEqual(self.decision(application).data['status'], 'await_pay')
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'user')
        self.assertFalse(OfficeSubscription.objects.filter(office=self.user).exists())

    def test_paid_upgrade_requires_unique_confirmation_and_expires(self):
        self.as_user(self.office)
        response = self.client.post(self.url, {'kind': 'upgrade', 'tier': 'pro', 'accept_terms': True}, format='json')
        application = response.data['id']
        self.as_user(self.admin)
        self.assertEqual(self.decision(application).data['status'], 'await_pay')
        self.assertEqual(self.decision(application, decision='confirm_payment').status_code, 400)
        self.as_user(self.office)
        self.assertEqual(self.client.post(f'{self.url}{application}/payment/', {'payment_reference': 'bank-id-001'}).status_code, 200)
        self.as_user(self.admin)
        self.assertEqual(self.decision(application, decision='confirm_payment', payment_reference='bank-id-001').status_code, 200)
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
        renewal = response.data['id']
        self.assertEqual(self.decision(renewal).data['status'], 'await_pay')
        self.as_user(self.office)
        self.assertEqual(self.client.post(f'{self.url}{renewal}/payment/', {'payment_reference': 'bank-id-001'}).status_code, 400)
        self.assertEqual(self.subscription.promoted_files.count(), 1)
        self.office.refresh_from_db()
        self.assertEqual(self.office.role, 'agency')

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
        application = response.data['id']
        self.assertEqual(self.decision(application).data['status'], 'await_pay')
        self.as_user(self.office)
        self.assertEqual(self.client.post(f'{self.url}{application}/payment/', {'payment_reference': receipt['reference']}).status_code, 400)
        self.as_user(self.admin)
        self.assertFalse(OfficePayment.objects.exists())
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.active_tier, 'free')
        self.client.put(config, {**options, 'enabled': False}, format='json')
        self.assertEqual(self.client.post(checkout, {'tier': 'pro'}, format='json').status_code, 403)

    def test_office_rejection_requires_reason_and_notifies_applicant_once(self):
        row = RoleApplication.objects.create(applicant=self.user, kind='office', tier='diamond')
        self.as_user(self.admin)
        self.assertEqual(self.decision(row.pk, decision='reject').status_code, 400)
        reason = 'تصویر مجوز خوانا نیست'
        response = self.decision(row.pk, decision='reject', review_note=reason)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.decision(row.pk, decision='reject', review_note=reason).status_code, 400)
        self.assertEqual(AccountNotification.objects.filter(kind='role_application').count(), 1)
        notice = AccountNotification.objects.get(user=self.user, kind='role_application')
        self.assertIn(reason, notice.body)
        self.assertIn(str(row.pk), notice.body)
        self.as_user(self.other)
        self.assertNotIn(reason, str(self.client.get('/accounts/notifications/').data))
        self.as_user(self.user)
        self.assertIn(reason, str(self.client.get('/accounts/notifications/').data))

    def test_paid_office_stays_ordinary_until_receipt_is_confirmed(self):
        profile = AgencyProfile.objects.create(manager=self.user, agency_name='دفتر اشتراکی', occupancy_type='owner', office_address='قم')
        row = RoleApplication.objects.create(applicant=self.user, kind='office', tier='diamond', details={'monthly_price': 999_000})
        self.as_user(self.user)
        url = f'{self.url}{row.pk}/payment/'
        self.assertEqual(self.client.post(url, {'payment_reference': 'receipt-office'}).status_code, 404)
        self.as_user(self.admin)
        self.assertEqual(self.decision(row.pk).data['status'], 'await_pay')
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'user')
        self.assertFalse(OfficeSubscription.objects.filter(office=self.user).exists())
        self.as_user(self.other)
        self.assertEqual(self.client.post(url, {'payment_reference': 'receipt-office'}).status_code, 404)
        self.as_user(self.user)
        self.assertEqual(self.client.post(url, {'payment_reference': 'receipt-office'}).status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'user')
        self.as_user(self.admin)
        self.assertEqual(self.decision(row.pk, decision='confirm_payment', payment_reference='wrong').status_code, 400)
        self.assertEqual(self.decision(row.pk, decision='confirm_payment', payment_reference='receipt-office').data['status'], 'approved')
        self.assertEqual(self.decision(row.pk, decision='confirm_payment', payment_reference='receipt-office').status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'agency')
        subscription = self.user.office_subscription
        self.assertEqual(subscription.active_tier, 'diamond')
        self.assertEqual(AccountNotification.objects.filter(user=self.user, kind='role_application').count(), 2)
        subscription.paid_until = timezone.now() - timedelta(days=1)
        subscription.save(update_fields=['paid_until'])
        self.assertEqual(subscription.active_tier, 'free')
        self.assertEqual(AgencyProfile.objects.get(manager=self.user).id, profile.id)

    def test_resume_download_is_limited_to_applicant_and_selected_office(self):
        from unittest.mock import patch

        storage = RoleApplication._meta.get_field('resume').storage
        self.as_user(self.user)
        with tempfile.TemporaryDirectory() as root, patch.object(storage, 'base_location', root), patch.object(storage, 'location', root):
            resume = SimpleUploadedFile('cv.pdf', b'%PDF-1.4\n%%EOF\n', content_type='application/pdf')
            response = self.client.post(self.url, {
                'kind': 'expert', 'code': str(self.subscription.code), 'confirm_office': 'true',
                'job_title': 'مشاور', 'specialties': 'فروش|مذاکره', 'experience_years': 2,
                'job_details': 'مشاور فروش ملک', 'resume': resume,
            })
            self.assertEqual(response.status_code, 201, response.data)
            self.assertEqual(response.data['details']['specialties'], ['فروش', 'مذاکره'])
            url = f"{self.url}{response.data['id']}/resume/"
            self.as_user(self.other)
            self.assertEqual(self.client.get(url).status_code, 404)
            self.as_user(self.office)
            download = self.client.get(url)
            self.assertEqual(download.status_code, 200)
            self.assertIn('attachment', download['Content-Disposition'])
            self.assertEqual(b''.join(download.streaming_content), b'%PDF-1.4\n%%EOF\n')
            download.close()

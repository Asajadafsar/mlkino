from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import AgencyProfile,ExpertProfile
from .models import AgencyExpertLink,PropertyRecord
class RoleChangeTests(TestCase):
    def setUp(self):
        U=get_user_model();self.root=U.objects.create_superuser('09127004001','test-password');self.admin=U.objects.create_user('09127004002',role='superadmin',is_staff=True);self.agency=U.objects.create_user('09127004003',role='agency');self.expert=U.objects.create_user('09127004004',role='expert')
        self.profile=AgencyProfile.objects.create(manager=self.agency,agency_name='دفتر محفوظ',occupancy_type='owner',office_address='نشانی محفوظ',office_district='منطقه ۴',license_number='keep')
        ExpertProfile.objects.create(user=self.expert,job_title='کارشناس محفوظ')
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.expert)
        PropertyRecord.objects.create(kind='file',created_by=self.expert,data={'city':'قم'})
        self.client=APIClient();self.client.force_authenticate(self.root)
    def change(self,target,role,old=None):
        target.refresh_from_db();response=self.client.post(f'/panel/users/{target.pk}/role/',{'role':role,'expected_role':target.role if old is None else old},format='json');target.refresh_from_db();return response
    def test_agency_round_trip_restores_profile_files_and_linked_permissions(self):
        self.assertEqual(self.change(self.agency,'user').status_code,200)
        self.profile.refresh_from_db();self.assertEqual(self.profile.agency_name,'دفتر محفوظ');self.assertEqual(self.profile.license_number,'keep')
        self.client.force_authenticate(self.agency);self.assertEqual(self.client.get('/panel/dashboard/estate-analytics/').status_code,403);self.assertEqual(self.client.get('/panel/files/').data['data']['total_results'],0)
        self.client.force_authenticate(self.root);self.assertEqual(self.change(self.agency,'agency').status_code,200)
        d=self.client.get(f'/panel/users/{self.agency.pk}/').data['data'];self.assertEqual(d['agency_profile']['agency_name'],'دفتر محفوظ')
        self.client.force_authenticate(self.agency);self.assertEqual(self.client.get('/panel/files/').data['data']['total_results'],1)
    def test_expert_and_new_roles_keep_separate_profiles_and_flags(self):
        self.assertEqual(self.change(self.expert,'agency').status_code,200);self.assertEqual(self.change(self.expert,'superadmin').status_code,200)
        self.expert.refresh_from_db();self.assertTrue(self.expert.is_staff);self.assertFalse(self.expert.is_superuser)
        self.assertEqual(self.change(self.expert,'expert').status_code,200);self.expert.refresh_from_db();self.assertFalse(self.expert.is_staff);self.assertEqual(ExpertProfile.objects.get(user=self.expert).job_title,'کارشناس محفوظ');self.assertTrue(AgencyProfile.objects.filter(manager=self.expert).exists())
    def test_only_admin_can_switch_and_last_root_is_protected_and_stale_update_rejected(self):
        self.client.force_authenticate(self.agency);self.assertEqual(self.change(self.expert,'user').status_code,403)
        self.client.force_authenticate(self.admin);self.assertEqual(self.change(self.expert,'user').status_code,200)
        self.assertEqual(self.change(self.root,'user').status_code,400)
        self.assertEqual(self.change(self.agency,'user',old='expert').status_code,409)
        self.client.force_authenticate(None);self.assertEqual(self.client.post(f'/panel/users/{self.expert.pk}/role/',{}).status_code,401)
    def test_existing_jwt_observes_new_permissions_without_reissuing_token(self):
        from rest_framework_simplejwt.tokens import AccessToken
        token=str(AccessToken.for_user(self.admin));other=APIClient();other.credentials(HTTP_AUTHORIZATION='Bearer '+token)
        self.assertEqual(other.get('/panel/settings/').status_code,200)
        self.assertEqual(self.change(self.admin,'user').status_code,200)
        self.assertEqual(other.get('/panel/settings/').status_code,403)

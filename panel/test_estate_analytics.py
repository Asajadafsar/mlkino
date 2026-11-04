from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import AgencyProfile
from .models import AgencyExpertLink,PropertyRecord,EstateActivity

class EstateAnalyticsTests(TestCase):
    def setUp(self):
        U=get_user_model();self.admin=U.objects.create_superuser('09127001001','test-password')
        self.agency=U.objects.create_user('09127001002',role='agency',province='قم',city='قم')
        self.expert=U.objects.create_user('09127001003',role='expert',first_name='کارشناس من')
        self.other=U.objects.create_user('09127001004',role='agency',province='تهران',city='تهران')
        self.ordinary=U.objects.create_user('09127001005')
        AgencyProfile.objects.create(manager=self.agency,agency_name='دفتر قم',occupancy_type='owner',office_address='قم',office_district='منطقه ۴',office_neighborhood='بنیاد')
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.expert)
        self.file=PropertyRecord.objects.create(kind='file',created_by=self.expert,data={'province':'قم','county':'قم','city':'قم','district':'منطقه ۴','neighborhood':'بنیاد'})
        self.old=PropertyRecord.objects.create(kind='request',created_by=self.expert,data={'province':'قم','city':'قم','district':['منطقه ۴','منطقه ۵'],'neighborhood':['بنیاد','انصار']})
        PropertyRecord.objects.filter(pk=self.old.pk).update(created_at=timezone.now()-timedelta(days=40))
        PropertyRecord.objects.create(kind='file',created_by=self.other,data={'province':'تهران','city':'تهران','district':'منطقه ۱'})
        EstateActivity.objects.create(kind='follow-ups',created_by=self.expert,data={'file_name':'پیگیری'})
        self.client=APIClient()
    def get(self,user,**params):
        self.client.force_authenticate(user);return self.client.get('/panel/dashboard/estate-analytics/',params)
    def test_global_counts_previous_period_and_geographical_comparison(self):
        r=self.get(self.admin,group_by='district');self.assertEqual(r.status_code,200,r.data);d=r.data['data']
        self.assertEqual(d['totals']['files'],2);self.assertEqual(d['totals']['requests'],1)
        self.assertEqual(d['recent']['files'],2);self.assertEqual(d['recent']['requests'],0);self.assertEqual(d['previous']['requests'],1)
        fourth=next(x for x in d['groups'] if x['label']=='منطقه ۴')
        self.assertEqual(fourth['totals']['files'],1);self.assertEqual(fourth['totals']['requests'],1)
        self.assertEqual(sum(x['files'] for x in d['timeline']),2)
        filtered=self.get(self.admin,city='قم',neighborhood='بنیاد').data['data'];self.assertEqual(filtered['totals']['files'],1)
    def test_agency_sees_linked_experts_only_and_cannot_select_other_office(self):
        r=self.get(self.agency,group_by='expert').data['data']
        self.assertEqual(r['totals']['files'],1);self.assertEqual(r['totals']['experts'],1)
        self.assertEqual(len(r['groups']),1);self.assertEqual(r['groups'][0]['totals']['followups'],1)
        self.assertEqual(self.get(self.agency,agency=str(self.other.pk)).status_code,403)
        self.assertEqual(self.get(self.expert).status_code,403);self.assertEqual(self.get(self.ordinary).status_code,403)
        self.client.force_authenticate(None);self.assertEqual(self.client.get('/panel/dashboard/estate-analytics/').status_code,401)
    def test_admin_can_compare_one_agency_and_invalid_period_is_rejected(self):
        self.assertEqual(self.get(self.admin,agency=str(self.agency.pk)).data['data']['totals']['files'],1)
        self.assertEqual(self.get(self.admin,days='bad').status_code,400);self.assertEqual(self.get(self.admin,group_by='password').status_code,400)

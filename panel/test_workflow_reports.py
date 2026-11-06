import json
from datetime import date,timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import User,AgencyProfile
from .models import AgencyExpertLink,PropertyRecord
from .reporting_api import date_range,compile_filters,_csv_cell

class WorkflowReportTests(TestCase):
    def setUp(self):
        self.client=APIClient();self.admin=User.objects.create_superuser('09000002001','test-password')
        self.agency=User.objects.create_user('09000002002','test-password',role='agency',first_name='مدیر قم',province='قم',city='قم')
        self.other=User.objects.create_user('09000002003','test-password',role='agency',first_name='مدیر تهران',province='تهران',city='تهران')
        AgencyProfile.objects.create(manager=self.agency,agency_name='دفتر شهرک قدس',occupancy_type='owner',office_address='قم منطقه ۴ شهرک قدس',office_district='منطقه ۴',office_neighborhood='شهرک قدس',has_business_license=True,license_number='TEST-LICENSE',license_expires_at=timezone.localdate()-timedelta(days=1))
        AgencyProfile.objects.create(manager=self.other,agency_name='دفتر دیگر',occupancy_type='owner',office_address='تهران',has_business_license=False)
        for i in range(5):
            expert=User.objects.create_user(f'0900000210{i}','test-password',role='expert',first_name=f'کارشناس {i}');AgencyExpertLink.objects.create(agency=self.agency,expert=expert)
        PropertyRecord.objects.create(kind='file',created_by=self.agency,office=self.agency,data={'title':'آپارتمان','province':'قم','city':'قم','district':'منطقه ۴','neighborhood':'شهرک قدس','totalPrice':1000,'area':100})
    def get(self,user,**q):self.client.force_authenticate(user);return self.client.get('/panel/workflows/reports/',q)
    def test_combined_geography_license_expert_count_and_registration_date(self):
        r=self.get(self.admin,report='agencies',period='month',province='قم',city='قم',district='منطقه ۴',neighborhood='شهرک قدس',expertCountFrom='5',license='expired',search='مدیر قم')
        self.assertEqual(r.status_code,200,r.data);d=r.data['data'];self.assertEqual(d['total_results'],1);self.assertEqual(d['results'][0]['expert_count'],5);self.assertEqual(d['summary']['expired_license'],1)
        self.assertEqual(self.get(self.admin,report='agencies',expertCountTo=4).data['data']['total_results'],1)
        self.assertEqual(self.get(self.admin,report='agencies',license='without').data['data']['results'][0]['id'],self.other.pk)
    def test_scope_and_invalid_ranges(self):
        self.assertEqual(self.get(self.agency,report='agencies').status_code,403)
        self.assertEqual(self.get(self.agency,report='operations',agency=self.other.pk).status_code,403)
        self.assertEqual(self.get(self.admin,date_from='2026-12-01',date_to='2026-01-01').status_code,400)
        self.assertEqual(self.get(self.admin,report='agencies',expertCountFrom=5,expertCountTo=4).status_code,400)
        self.assertEqual(self.get(self.admin,report='passwords').status_code,400)
        self.client.force_authenticate(None);self.assertEqual(self.client.get('/panel/workflows/reports/').status_code,401)
    def test_safe_filter_ast_and_csv(self):
        tree={'op':'and','rules':[{'field':'expert_count','op':'gt','value':4},{'field':'name','op':'contains','value':'قدس'}]}
        r=self.get(self.admin,report='agencies',filters=json.dumps(tree));self.assertEqual(r.status_code,200,r.data);self.assertEqual(r.data['data']['total_results'],1)
        bad={'field':'user.password','op':'contains','value':'x'};self.assertEqual(self.get(self.admin,report='agencies',filters=json.dumps(bad)).status_code,400)
        r=self.get(self.admin,report='agencies',export='csv');self.assertEqual(r.status_code,200);self.assertIn('text/csv',r['Content-Type']);self.assertTrue(_csv_cell('=HYPERLINK("bad")').startswith("'="))
    def test_jalali_month_year_and_saturday_week(self):
        a,b=date_range({'period':'month'},today=date(2026,11,7));self.assertEqual(a,date(2026,10,23));self.assertEqual(b,date(2026,11,7))
        a,b=date_range({'period':'year'},today=date(2026,11,7));self.assertEqual(a,date(2026,3,21))
        a,b=date_range({'period':'week'},today=date(2026,11,7));self.assertEqual(a,date(2026,11,7))

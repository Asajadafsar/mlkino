from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import PropertyRecord, EstateActivity, AgencyExpertLink
from accounts.models import AgencyProfile

class DashboardReportingTests(TestCase):
    def setUp(self):
        U = get_user_model()
        self.admin=U.objects.create_superuser('09127770001','test')
        self.agency=U.objects.create_user('09127770002',role='agency',province='قم',city='قم')
        self.expert=U.objects.create_user('09127770003',role='expert')
        self.other=U.objects.create_user('09127770004',role='agency',province='تهران',city='تهران')
        self.user=U.objects.create_user('09127770005')
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.expert)
        AgencyProfile.objects.create(manager=self.agency,agency_name='دفتر قم',occupancy_type='owner',office_address='قم',office_city='قم',office_province='قم',office_district='۴')
        self.file=PropertyRecord.objects.create(kind='file',created_by=self.expert,office=self.agency,data={'province':'قم','city':'قم','district':'۴','neighborhood':'بنیاد','propertyType':'آپارتمان','contractType':'فروش','area':100,'totalPrice':2000000000})
        self.request=PropertyRecord.objects.create(kind='request',created_by=self.expert,office=self.agency,data={'province':'قم','city':'قم','district':['۴','۵'],'neighborhood':'بنیاد','propertyType':'آپارتمان','contractType':'فروش','area':120,'totalPrice':2200000000})
        self.contract=EstateActivity.objects.create(kind='contracts',created_by=self.expert,office=self.agency,property=self.file,data={'file_name':'قرارداد قم','agreed_price':2100000000})
        self.foreign=PropertyRecord.objects.create(kind='file',created_by=self.other,office=self.other,data={'province':'تهران','city':'تهران','district':'۱','propertyType':'زمین','contractType':'فروش','area':200,'totalPrice':6000000000})
        self.client=APIClient()
    def report(self,user,**params):
        self.client.force_authenticate(user)
        return self.client.get('/panel/dashboard/estate-overview/',{'report':'1',**params})
    def test_filters_change_counts_distribution_timeline_market_and_groups_together(self):
        response=self.report(self.admin,province='قم',city='قم',district='۴',neighborhood='بنیاد',propertyType='آپارتمان',creatorRoles='expert',office=str(self.agency.pk),expert=str(self.expert.pk),areaFrom='۹۰',areaTo='۱۳۰',priceFrom='۱۰۰۰۰۰۰۰۰۰',priceTo='۳۰۰۰۰۰۰۰۰۰',group_by='district')
        self.assertEqual(response.status_code,200,response.data)
        data=response.data['data']
        self.assertEqual(data['counts']['files']['total'],1)
        self.assertEqual(data['counts']['contracts']['total'],1)
        self.assertEqual(data['counts']['requests']['total'],1)
        self.assertEqual(sum(row['files'] for row in data['timeline']),1)
        self.assertEqual(data['distribution'],[{'label':'آپارتمان','count':1}])
        self.assertEqual(data['market_index']['sample_size'],1)
        self.assertEqual(data['market_index']['price_per_meter'],20000000)
        self.assertIn('قم',data['market_index']['scope'])
        self.assertEqual(len(data['groups']),2)
    def test_no_implicit_tehran_and_role_specific_recent_records(self):
        admin=self.report(self.admin).data['data']
        self.assertEqual(admin['market_index']['sample_size'],2)
        self.assertEqual(admin['market_index']['scope'],'همه محدوده‌های مجاز')
        self.assertEqual(admin['recent_requests'],[])
        self.assertEqual(admin['recent_contracts'],[])
        agency=self.report(self.agency).data['data']
        self.assertEqual([row['id'] for row in agency['recent_contracts']],[self.contract.pk])
        self.assertEqual([row['id'] for row in agency['recent_requests']],[self.request.pk])
    def test_foreign_office_and_expert_filters_never_expand_agency_scope(self):
        data=self.report(self.agency,office=str(self.other.pk)).data['data']
        self.assertEqual(data['counts']['files']['total'],0)
        self.assertNotIn(str(self.other.pk),[row['id'] for row in data['offices']])
        own=self.report(self.user).data['data']
        self.assertEqual(own['counts']['files']['total'],0)
        self.assertEqual(own['experts'],[])
    def test_invalid_ranges_and_group_values_rejected(self):
        for params in ({'priceFrom':'bad'},{'priceFrom':'5','priceTo':'1'},{'areaFrom':'9','areaTo':'1'},{'days':'2'},{'group_by':'password'},{'expert':'abc'}):
            self.assertEqual(self.report(self.admin,**params).status_code,400,params)
    def test_current_previous_periods_and_group_timeline(self):
        PropertyRecord.objects.filter(pk=self.file.pk).update(created_at=timezone.now()-timedelta(days=40))
        data=self.report(self.agency,group_by='city').data['data']
        self.assertEqual(data['counts']['files']['recent'],0)
        self.assertEqual(data['counts']['files']['previous'],1)
        self.assertEqual(sum(row['requests'] for row in data['timeline']),1)
        self.assertEqual(sum(day['requests'] for row in data['groups'] for day in row['timeline'].values()),1)
    def test_contract_without_linked_property_is_excluded_from_property_filters(self):
        EstateActivity.objects.create(kind='contracts',created_by=self.expert,office=self.agency,data={'file_name':'فاقد ملک'})
        self.assertEqual(self.report(self.agency).data['data']['counts']['contracts']['total'],2)
        self.assertEqual(self.report(self.agency,propertyType='آپارتمان').data['data']['counts']['contracts']['total'],1)
    def test_explorer_has_paginated_list_and_does_not_invent_coordinates(self):
        PropertyRecord.objects.bulk_create([PropertyRecord(kind='file',created_by=self.expert,office=self.agency,data={'city':'نامشخص'}) for _ in range(102)])
        self.client.force_authenticate(self.agency)
        params={'detail':'1','paginate':'1','map_layers':'files','page':1}
        first=self.client.get('/panel/dashboard/estate-overview/',params).data['data']
        second=self.client.get('/panel/dashboard/estate-overview/',{**params,'page':2}).data['data']
        self.assertEqual(len(first['rows']),100)
        self.assertEqual(len(second['rows']),3)
        self.assertTrue(first['has_more'])
        self.assertFalse(second['has_more'])
        self.assertEqual(first['matching_items'],103)
        unknown=[row for row in first['rows'] if row['city']=='نامشخص']
        self.assertTrue(all('latitude' not in row for row in unknown))
        self.assertEqual(self.client.get('/panel/dashboard/estate-overview/',{**params,'page':'bad'}).status_code,400)
    def test_distribution_period_filter_excludes_old_records(self):
        PropertyRecord.objects.filter(pk=self.file.pk).update(created_at=timezone.now()-timedelta(days=40))
        current=self.report(self.agency,period_only='1',days='30').data['data']
        self.assertEqual(current['distribution'],[])
        longer=self.report(self.agency,period_only='1',days='90').data['data']
        self.assertEqual(longer['distribution'],[{'label':'آپارتمان','count':1}])
    def test_explorer_contracts_apply_linked_property_filters(self):
        self.client.force_authenticate(self.admin)
        params={'detail':'1','map_layers':'contracts','propertyType':'زمین'}
        self.assertEqual(self.client.get('/panel/dashboard/estate-overview/',params).data['data']['matching_items'],0)
        params['propertyType']='آپارتمان'
        self.assertEqual(self.client.get('/panel/dashboard/estate-overview/',params).data['data']['matching_items'],1)

from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import PropertyRecord,AgencyExpertLink,EstateActivity
class DashboardEstateTests(TestCase):
    def setUp(self):
        U=get_user_model();self.admin=U.objects.create_superuser('09127003001','test-password');self.agency=U.objects.create_user('09127003002',role='agency');self.expert=U.objects.create_user('09127003003',role='expert');self.other=U.objects.create_user('09127003004',role='agency');self.user=U.objects.create_user('09127003005')
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.expert)
        self.file=PropertyRecord.objects.create(kind='file',created_by=self.expert,data={'propertyType':'آپارتمان','province':'قم','city':'قم','district':'منطقه ۴','contractType':'فروش','totalPrice':200})
        PropertyRecord.objects.create(kind='file',created_by=self.other,data={'propertyType':'زمین','province':'تهران','city':'تهران','contractType':'فروش','totalPrice':500})
        self.old=PropertyRecord.objects.create(kind='request',created_by=self.expert,data={'city':'قم'})
        PropertyRecord.objects.filter(pk=self.old.pk).update(created_at=timezone.now()-timedelta(days=40))
        EstateActivity.objects.create(kind='follow-ups',created_by=self.expert,data={'file_name':'پیگیری'})
        self.client=APIClient()
    def get(self,user,**params):
        self.client.force_authenticate(user);return self.client.get('/panel/dashboard/estate-overview/',params)
    def test_city_map_uses_visible_records_and_counters_keep_their_period(self):
        r=self.get(self.agency);self.assertEqual(r.status_code,200,r.data);d=r.data['data'];self.assertEqual(d['matching_files'],1);self.assertEqual(d['points'][0]['city'],'قم');self.assertEqual(d['points'][0]['count'],1);self.assertEqual(d['map_precision'],'city')
        self.assertEqual(d['counts']['files']['total'],1);self.assertEqual(d['counts']['requests']['previous'],1);self.assertEqual(d['counts']['requests']['recent'],0);self.assertEqual(d['counts']['experts']['total'],1);self.assertEqual(d['counts']['followups']['total'],1)
        self.assertEqual(self.get(self.user).data['data']['matching_files'],0)
        self.assertEqual(self.get(self.admin).data['data']['matching_files'],2)
    def test_filters_affect_map_but_not_overall_cards_and_bad_prices_are_rejected(self):
        d=self.get(self.admin,city='قم',propertyType='آپارتمان',priceFrom='۱۵۰',priceTo='۲۵۰').data['data'];self.assertEqual(d['matching_files'],1);self.assertEqual(d['counts']['files']['total'],2)
        self.assertEqual(self.get(self.admin,priceFrom='999').data['data']['matching_files'],0)
        self.assertEqual(self.get(self.admin,priceFrom='bad').status_code,400);self.assertEqual(self.get(self.admin,priceFrom='500',priceTo='100').status_code,400)
        self.client.force_authenticate(None);self.assertEqual(self.client.get('/panel/dashboard/estate-overview/').status_code,401)
    def test_unresolved_locations_are_counted_without_inventing_coordinates(self):
        PropertyRecord.objects.create(kind='file',created_by=self.user,data={'city':'شهر نامشخص'})
        d=self.get(self.user).data['data'];self.assertEqual(d['matching_files'],1);self.assertEqual(d['mapped_files'],0);self.assertEqual(d['points'],[])

    def test_map_tiles_touching_iran_are_available_even_when_center_is_outside(self):
        from tempfile import TemporaryDirectory
        from unittest.mock import patch,Mock
        from django.test import override_settings
        with TemporaryDirectory() as folder,override_settings(MLKINO_TILE_CACHE_DIR=folder),patch('panel.geography_api.requests.get') as get:
            get.return_value=Mock(content=b'\x89PNG\r\n\x1a\nfixture')
            self.client.force_authenticate(self.admin)
            self.assertEqual(self.client.get('/panel/locations/tiles/5/19/12.png').status_code,200)
            self.assertEqual(self.client.get('/panel/locations/tiles/5/0/0.png').status_code,404)
            self.assertEqual(get.call_count,1)

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from .geography_api import catalog
from .settings_models import PanelSettings

class GeographyAdminTests(TestCase):
    def setUp(self):
        U=get_user_model();self.admin=U.objects.create_superuser('09127001101','test-password');self.user=U.objects.create_user('09127001102',role='agency')
        self.client=APIClient();self.client.force_authenticate(self.admin)
        self.city=next(c for c in catalog('cities-filtered') if c['name']=='قم')
        self.parent={'province':self.city['province_id'],'county':self.city['county_id'],'city':self.city['id']}
    def test_qom_source_has_eight_regions_and_filtered_neighborhoods(self):
        d=self.client.get('/panel/locations/manage/',self.parent).data['data']
        self.assertEqual(len(d['districts']),8);self.assertGreater(len(d['neighborhoods']),180)
        r=self.client.get('/panel/locations/',{**self.parent,'level':'neighborhood','district':'منطقه ۸'})
        self.assertEqual(len(r.data['data']['results']),9)
        self.assertTrue(all(x['district']=='منطقه ۸' for x in r.data['data']['results']))
    def test_save_refresh_public_catalog_property_validation_and_settings_preserve(self):
        old=self.client.get('/panel/locations/manage/',self.parent).data['data']
        payload={**self.parent,'revision':old['revision'],'districts':['منطقه ویژه'],'neighborhoods':[{'name':'محله تست','district':'منطقه ویژه','streets':['خیابان تست']}]}
        r=self.client.put('/panel/locations/manage/',payload,format='json');self.assertEqual(r.status_code,200,r.data)
        self.assertEqual(self.client.put('/panel/locations/manage/',payload,format='json').status_code,409)
        self.client.patch('/panel/settings/',{'features':{'files':False}},format='json')
        self.assertIn(str(self.city['id']),PanelSettings.objects.get(pk=1).data['geography'])
        self.client.force_authenticate(self.user)
        d=self.client.get('/panel/locations/',{**self.parent,'level':'district'}).data['data'];self.assertEqual(d['results'][0]['name'],'منطقه ویژه')
        self.assertEqual(self.client.get('/panel/locations/manage/',self.parent).status_code,403)
        self.assertEqual(self.client.put('/panel/locations/manage/',payload,format='json').status_code,403)
        r=self.client.post('/panel/requests/',{'province':'قم','city':'قم','district':['منطقه ویژه'],'neighborhood':['محله تست'],'contractType':'فروش','propertyType':'آپارتمان'},format='json');self.assertEqual(r.status_code,201,r.data)
    def test_invalid_hierarchy_dangling_region_and_duplicate_are_rejected(self):
        d=self.client.get('/panel/locations/manage/',self.parent).data['data'];base={**self.parent,'revision':d['revision'],'districts':['منطقه ۱']}
        for rows in [[{'name':'محله','district':'منطقه ۹','streets':[]}],[{'name':'محله','district':'منطقه ۱','streets':[]}]*2]:
            self.assertEqual(self.client.put('/panel/locations/manage/',{**base,'neighborhoods':rows},format='json').status_code,400)
        self.assertEqual(self.client.get('/panel/locations/manage/',{**self.parent,'province':999}).status_code,400)
    def test_scoped_fields_inherit_legacy_and_can_be_controlled_independently(self):
        PanelSettings.objects.create(pk=1,data={'fields':{'file.direction':False}})
        result=self.client.get('/panel/settings/').data['data']['fields'];self.assertFalse(result['file.sale.direction']);self.assertFalse(result['file.rent.direction'])
        result=self.client.patch('/panel/settings/',{'fields':{'file.rent.direction':True,'request.sale.direction':False}},format='json').data['data']['fields']
        self.assertTrue(result['file.rent.direction']);self.assertFalse(result['file.sale.direction']);self.assertFalse(result['request.sale.direction'])

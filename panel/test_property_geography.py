from unittest.mock import patch, Mock
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from .models import PropertyRecord
from .geography_api import catalog

class PropertyAndGeographyTests(TestCase):
    def setUp(self):
        self.user=get_user_model().objects.create_user('09128888001',role='user')
        self.other=get_user_model().objects.create_user('09128888002',role='user')
        self.admin=get_user_model().objects.create_superuser('09128888003','test-password')
        self.client=APIClient();self.client.force_authenticate(self.user)
        self.payload={'contractType':'فروش','propertyType':'آپارتمان','province':'تهران','county':'تهران','city':'تهران','district':['منطقه ۴'],'neighborhood':[],'areaFrom':70,'areaTo':120,'floorPreferences':['طبقه اول','طبقه آخر']}

    def test_request_saved_with_multiple_floors_and_excluded_fields_removed(self):
        response=self.client.post('/panel/requests/',{**self.payload,'address':'نباید ثبت شود','bathroom':'دو','occupancyStatus':'تخلیه'},format='json')
        self.assertEqual(response.status_code,201,response.data)
        data=response.data['data'];self.assertEqual(data['floorPreferences'],['طبقه اول','طبقه آخر'])
        for name in ['address','bathroom','occupancyStatus','totalFloor']:self.assertNotIn(name,data)
        self.assertEqual(PropertyRecord.objects.count(),1)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get('/panel/requests/').data['data']['total_results'],0)
        self.assertEqual(self.client.get(f"/panel/requests/{data['id']}/").status_code,404)

    def test_search_filters_and_pagination_use_stored_records(self):
        for name,city in [('آپارتمان','تهران'),('ویلایی','شیراز')]:
            PropertyRecord.objects.create(created_by=self.user,kind='request',data={**self.payload,'propertyType':name,'city':city})
        response=self.client.get('/panel/requests/',{'search':'تهران','propertyType':'آپارتمان','page_size':1})
        self.assertEqual(response.data['data']['total_results'],1)
        self.assertEqual(response.data['data']['results'][0]['city'],'تهران')
        self.assertEqual(self.client.get('/panel/requests/',{'city':'کرج'}).data['data']['total_results'],0)

    def test_other_floors_and_any_floor_semantics_and_invalid_range(self):
        response=self.client.post('/panel/requests/',{**self.payload,'floorPreferences':['سایر طبقات']},format='json')
        self.assertEqual(response.status_code,201)
        self.assertEqual(response.data['data']['floorPreferences'],['سایر طبقات'])
        response=self.client.post('/panel/requests/',{**self.payload,'floorPreferences':['فرقی نمی‌کند','طبقه اول']},format='json')
        self.assertEqual(response.data['data']['floorPreferences'],['فرقی نمی‌کند'])
        response=self.client.post('/panel/requests/',{**self.payload,'areaFrom':200,'areaTo':100},format='json')
        self.assertEqual(response.status_code,400)

    def test_ordinary_user_cannot_create_property_file(self):
        self.assertEqual(self.client.post('/panel/files/',self.payload,format='json').status_code,403)

    @patch('panel.geography_api.city_neighborhoods')
    def test_iran_hierarchy_and_tehran_district_four_neighborhoods(self,lookup):
        self.assertEqual(len(catalog('provinces')),31)
        self.assertGreater(len(catalog('counties')),450)
        self.assertGreater(len(catalog('cities-filtered')),1400)
        tehran=next(c for c in catalog('cities-filtered') if c['name']=='تهران')
        rows=[r for r in catalog('neighborhoods') if r['city_id']==tehran['id']]
        lookup.return_value=(rows,True)
        response=self.client.get('/panel/locations/',{'level':'neighborhood','province':'تهران','county':'تهران','city':'تهران','districts':'منطقه ۴'})
        values=response.data['data']['results'];self.assertGreater(len(values),10)
        self.assertTrue(all(r['district']=='منطقه ۴' for r in values))
        response=self.client.get('/panel/locations/',{'level':'city','province':'فارس','county':'شیراز'})
        self.assertIn('شیراز',[r['name'] for r in response.data['data']['results']])
        self.assertNotIn('تهران',[r['name'] for r in response.data['data']['results']])

    def test_field_settings_persist_and_are_exposed_to_users(self):
        self.client.force_authenticate(self.admin)
        response=self.client.patch('/panel/settings/',{'fields':{'request.roomCount':False,'agency.logo':False}},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.client.force_authenticate(self.user)
        self.assertFalse(self.client.get('/panel/appearance/').data['data']['fields']['request.roomCount'])
        self.assertEqual(self.client.patch('/panel/settings/',{'fields':{'agency.logo':True}},format='json').status_code,403)

    @patch('panel.geography_api.requests.get')
    def test_geocoder_marks_approximate_locations_and_rejects_outside_iran(self,get):
        response=Mock();response.json.return_value={'features':[{'geometry':{'coordinates':[51.4,35.7]},'properties':{'name':'خیابان آزمون'}}]};get.return_value=response
        result=self.client.post('/panel/locations/geocode/',{'city':'تهران','address':'خیابان آزمون'},format='json')
        self.assertEqual(result.status_code,200,result.data);self.assertTrue(result.data['data']['needs_confirmation'])
        response.json.return_value={'features':[{'geometry':{'coordinates':[0,0]},'properties':{}}]}
        self.assertEqual(self.client.post('/panel/locations/geocode/',{'city':'تهران','address':'نشانی دیگر'},format='json').status_code,404)

    def test_monthly_charge_only_survives_for_rental_records(self):
        sale=self.client.post('/panel/requests/',{**self.payload,'monthlyCharge':100,'monthlyChargeFrom':100,'monthlyChargeTo':200},format='json')
        self.assertEqual(sale.status_code,201,sale.data)
        self.assertNotIn('monthlyCharge',sale.data['data']);self.assertNotIn('monthlyChargeFrom',sale.data['data'])
        rent=self.client.post('/panel/requests/',{**self.payload,'contractType':'رهن و اجاره','monthlyChargeFrom':100,'monthlyChargeTo':200},format='json')
        self.assertEqual(rent.status_code,201,rent.data);self.assertEqual(rent.data['data']['monthlyChargeTo'],200)
        change=self.client.patch(f"/panel/requests/{rent.data['data']['id']}/",{'contractType':'فروش'},format='json')
        self.assertEqual(change.status_code,200);self.assertNotIn('monthlyChargeTo',change.data['data'])

    def test_reference_list_range_filters_and_request_audiences(self):
        PropertyRecord.objects.create(created_by=self.user,kind='request',data={**self.payload,'requesterType':'owner','areaFrom':80,'areaTo':100,'totalPriceFrom':200,'totalPriceTo':400})
        PropertyRecord.objects.create(created_by=self.user,kind='request',data={**self.payload,'requesterType':'customer','areaFrom':150,'areaTo':200,'totalPriceFrom':600,'totalPriceTo':800})
        response=self.client.get('/panel/requests/',{'requesterType':'owner','areaFrom':90,'areaTo':110,'priceFrom':300,'priceTo':500})
        self.assertEqual(response.data['data']['total_results'],1)
        self.assertEqual(response.data['data']['stats']['total'],2)
        self.assertEqual(response.data['data']['stats']['owner'],1)

    def test_zero_numeric_values_survive_json_submission(self):
        response=self.client.post('/panel/requests/',{**self.payload,'contractType':'رهن و اجاره','roomCount':0,'monthlyChargeFrom':0,'monthlyChargeTo':0},format='json')
        self.assertEqual(response.status_code,201,response.data);self.assertEqual(response.data['data']['roomCount'],0);self.assertEqual(response.data['data']['monthlyChargeFrom'],0)

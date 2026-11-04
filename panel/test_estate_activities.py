from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from .models import EstateActivity, AgencyExpertLink

class EstateActivityTests(TestCase):
    def setUp(self):
        User=get_user_model()
        self.admin=User.objects.create_superuser('09129990001','test-password')
        self.agency=User.objects.create_user('09129990002',role='agency')
        self.expert=User.objects.create_user('09129990003',role='expert')
        self.outsider=User.objects.create_user('09129990004',role='agency')
        self.user=User.objects.create_user('09129990005',role='user')
        self.client=APIClient();self.client.force_authenticate(self.agency)

    def test_create_reload_and_patch_contract_are_persistent(self):
        response=self.client.post('/panel/contracts/',{'file_name':'واحد آزمایشی','contract_type':'فروش','agreed_price':850000000,'contract_datetime':'2026-11-04T10:30:00+03:30','status':'در انتظار امضا','created_by':self.admin.pk},format='json')
        self.assertEqual(response.status_code,201,response.data)
        pk=response.data['data']['id']
        self.assertEqual(EstateActivity.objects.get(pk=pk).created_by_id,self.agency.pk)
        self.assertEqual(self.client.get('/panel/contracts/').data['data']['results'][0]['agreed_price'],850000000)
        self.assertEqual(self.client.patch(f'/panel/contracts/{pk}/',{'status':'فعال','description':'امضا شد'},format='json').status_code,200)
        persisted=self.client.get(f'/panel/contracts/{pk}/').data['data']
        self.assertEqual(persisted['status'],'فعال');self.assertEqual(persisted['description'],'امضا شد')
        self.assertEqual(self.client.get('/panel/follow-ups/').data['data']['total_results'],0)

    def test_followup_status_updates_and_scope_are_enforced(self):
        response=self.client.post('/panel/follow-ups/',{'file_name':'ملک','full_name':'مشتری','phone_number':'09120000000','date':'2026-11-04T12:00:00','description':'تماس'},format='json')
        self.assertEqual(response.status_code,201,response.data);pk=response.data['data']['id']
        self.assertEqual(self.client.patch(f'/panel/follow-ups/{pk}/',{'status':'انجام شده','archive':True,'visitStatus':'visited_liked'},format='json').status_code,200)
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.get('/panel/follow-ups/').data['data']['total_results'],0)
        self.assertEqual(self.client.patch(f'/panel/follow-ups/{pk}/',{'status':'نیازمند اقدام'},format='json').status_code,404)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post('/panel/contracts/',{'file_name':'غیرمجاز'},format='json').status_code,403)
        self.assertEqual(self.client.post('/panel/follow-ups/',{'file_name':'غیرمجاز'},format='json').status_code,403)

    def test_agency_sees_linked_expert_records_but_cannot_overwrite_them(self):
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.expert)
        row=EstateActivity.objects.create(kind='contracts',created_by=self.expert,data={'file_name':'کارشناس','status':'فعال'})
        self.assertEqual(self.client.get('/panel/contracts/').data['data']['total_results'],1)
        self.assertEqual(self.client.patch(f'/panel/contracts/{row.pk}/',{'status':'لغو شده'},format='json').status_code,403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch(f'/panel/contracts/{row.pk}/',{'status':'لغو شده'},format='json').status_code,200)

    def test_bad_money_dates_and_statuses_do_not_write(self):
        for changes in [{'agreed_price':-1},{'agreed_price':'NaN'},{'contract_datetime':'2026-99-99T12:00:00'},{'status':'نامعتبر'},{'image':'javascript:alert(1)'}]:
            response=self.client.post('/panel/contracts/',{'file_name':'نام',**changes},format='json')
            self.assertEqual(response.status_code,400,response.data)
        self.assertEqual(EstateActivity.objects.count(),0)
        self.client.force_authenticate(None)
        self.assertIn(self.client.get('/panel/contracts/').status_code,(401,403))

    def test_zero_amount_is_valid_and_followups_drop_contract_only_fields(self):
        response=self.client.post('/panel/contracts/',{'file_name':'قرارداد','agreed_price':0,'date':'2026-11-04T12:00:00'},format='json')
        self.assertEqual(response.status_code,201,response.data);self.assertEqual(response.data['data']['agreed_price'],0);self.assertNotIn('date',response.data['data'])
        follow=self.client.post('/panel/follow-ups/',{'file_name':'پیگیری','agreed_price':0,'contract_type':'فروش'},format='json')
        self.assertEqual(follow.status_code,201,follow.data);self.assertNotIn('agreed_price',follow.data['data']);self.assertNotIn('contract_type',follow.data['data'])

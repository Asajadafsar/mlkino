from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from django.core.cache import cache
from rest_framework.test import APIClient
from accounts.models import User,AccountNotification
from .models import (PropertyRecord,AgencyExpertLink,PropertyReferral,CRMContact,VisitSlot,PropertyVisit,FinancialDocument,FinancialRateVersion,UserBusinessRole)
from .workflow_services import dispatch,respond,expire_due

class WorkflowTests(TestCase):
    def setUp(self):
        cache.clear();self.client=APIClient()
        self.admin=User.objects.create_superuser('09000001001','test-password')
        self.agency=User.objects.create_user('09000001002','test-password',role='agency',city='قم',province='قم')
        self.expert=User.objects.create_user('09000001003','test-password',role='expert',city='قم',province='قم')
        self.next=User.objects.create_user('09000001004','test-password',role='expert',city='تهران',province='تهران')
        self.owner=User.objects.create_user('09000001005','test-password',first_name='مالک',last_name='تست')
        self.buyer=User.objects.create_user('09000001006','test-password')
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.expert)
        self.row=PropertyRecord.objects.create(kind='file',created_by=self.owner,data={'ownerSubmission':True,'requesterType':'owner','propertyType':'آپارتمان','contractType':'فروش','province':'قم','city':'قم','title':'ملک آزمایشی','area':100,'totalPrice':100000,'ownerPhone':'09000001005','ownerName':'محرمانه','internalNote':'راز','address':'نشانی خصوصی','latitude':34.64,'longitude':50.87})
    def login(self,user):self.client.force_authenticate(user)
    def post(self,path,data,user=None):
        if user:self.login(user)
        return self.client.post('/panel/'+path,data,format='json')
    def test_publication_requires_real_permission_and_public_projection_hides_pii(self):
        r=self.client.get('/panel/public/catalog/');self.assertEqual(r.data['data']['total_results'],0)
        self.assertEqual(self.post(f'workflows/properties/{self.row.pk}/publish/',{'publish':True},self.buyer).status_code,403)
        self.assertEqual(self.post(f'workflows/properties/{self.row.pk}/publish/',{'publish':True},self.admin).status_code,200)
        r=self.client.get(f'/panel/public/catalog/{self.row.pk}/');d=r.data['data'];self.assertEqual(r.status_code,200)
        for key in ('ownerPhone','ownerName','internalNote','address','requesterPhone'):self.assertNotIn(key,d)
        self.assertEqual(self.client.get('/panel/public/catalog/',{'areaFrom':'200','areaTo':'100'}).status_code,400)
        self.assertEqual(self.client.get('/panel/public/catalog/',{'bbox':'bad'}).status_code,400)
        self.assertEqual(self.client.get('/panel/public/catalog/',{'city':'تهران'}).data['data']['total_results'],0)
    def test_routing_geographic_accept_and_crm_are_idempotent(self):
        ref=dispatch(self.row.pk,self.owner);self.assertEqual(ref.expert_id,self.expert.pk)
        self.assertEqual(dispatch(self.row.pk).pk,ref.pk)
        accepted=respond(ref.pk,self.expert,'accept',True);self.assertEqual(accepted.status,'accepted')
        respond(ref.pk,self.expert,'accept',True)
        self.row.refresh_from_db();self.assertEqual(self.row.office_id,self.agency.pk);self.assertEqual(self.row.publication_state,'published');self.assertEqual(CRMContact.objects.count(),1)
        self.assertEqual(self.post(f'workflows/assignments/{ref.pk}/respond/',{'decision':'reject'},self.buyer).status_code,404)
    def test_rejection_and_expiry_advance_once(self):
        ref=dispatch(self.row.pk);respond(ref.pk,self.expert,'reject');second=PropertyReferral.objects.get(property=self.row,status='pending');self.assertEqual(second.expert_id,self.next.pk)
        PropertyReferral.objects.filter(pk=second.pk).update(expires_at=timezone.now()-timedelta(seconds=1))
        self.assertEqual(expire_due(),1);self.assertEqual(expire_due(),0);self.assertEqual(PropertyReferral.objects.filter(property=self.row,status='market').count(),1)
    def test_owner_draft_does_not_dispatch_and_submit_does(self):
        data={'propertyType':'آپارتمان','contractType':'فروش','province':'قم','city':'قم','publicationStatus':'draft'}
        r=self.post('workflows/owner-submissions/',data,self.owner);self.assertEqual(r.status_code,201,r.data);pk=r.data['data']['id'];self.assertFalse(PropertyReferral.objects.filter(property_id=pk).exists())
        r=self.client.patch(f'/panel/files/{pk}/',{'publicationStatus':'pending'},format='json');self.assertEqual(r.status_code,200,r.data);self.assertTrue(PropertyReferral.objects.filter(property_id=pk).exists())
    def test_favorites_persist_deduplicate_and_do_not_expose_drafts(self):
        self.row.publication_state='published';self.row.save()
        first=self.post('workflows/favorites/',{'property_id':self.row.pk},self.buyer);self.assertEqual(first.status_code,201)
        self.assertEqual(self.post('workflows/favorites/',{'property_id':self.row.pk}).status_code,200)
        self.assertEqual(self.client.get('/panel/workflows/favorites/').data['data']['total_results'],1)
        self.login(self.owner);self.assertEqual(self.client.get('/panel/workflows/favorites/').data['data']['total_results'],0)
        self.row.publication_state='draft';self.row.save();self.login(self.buyer);self.assertEqual(self.client.get('/panel/workflows/favorites/').data['data']['total_results'],0)
    def test_visit_capacity_conflict_permissions_cancel(self):
        self.row.assigned_expert=self.expert;self.row.office=self.agency;self.row.publication_state='published';self.row.save()
        start=timezone.now()+timedelta(days=1);payload={'property_id':self.row.pk,'starts_at':start.isoformat(),'ends_at':(start+timedelta(hours=1)).isoformat(),'capacity':1}
        slot=self.post('workflows/visit-slots/',payload,self.expert);self.assertEqual(slot.status_code,201,slot.data);sid=slot.data['data']['id']
        self.assertEqual(self.post('workflows/visit-slots/',payload).status_code,400)
        booking=self.post('workflows/visits/',{'slot_id':sid},self.buyer);self.assertEqual(booking.status_code,201);bid=booking.data['data']['id']
        self.assertEqual(self.post('workflows/visits/',{'slot_id':sid},self.owner).status_code,400)
        self.login(self.buyer);self.assertEqual(self.client.patch(f'/panel/workflows/visits/{bid}/',{'status':'confirmed'},format='json').status_code,403)
        self.login(self.expert);self.assertEqual(self.client.patch(f'/panel/workflows/visits/{bid}/',{'status':'confirmed'},format='json').status_code,200)
        self.login(self.buyer);self.assertEqual(self.client.patch(f'/panel/workflows/visits/{bid}/',{'status':'cancelled'},format='json').status_code,200)
        self.assertEqual(self.post('workflows/visits/',{'slot_id':sid},self.owner).status_code,201)
    def test_financial_balancing_posting_reversal_and_decimal_snapshot(self):
        import uuid
        data={'kind':'invoice','amount':'100.01','direction':'debit','entries':[{'account':'cash','debit':'100.01','credit':'0'},{'account':'income','credit':'100.01','debit':'0'}]}
        self.assertEqual(self.post('workflows/finance/',data,self.owner).status_code,403)
        bad={**data,'entries':[{'account':'cash','debit':'100','credit':'0'},{'account':'income','credit':'99','debit':'0'}]};self.assertEqual(self.post('workflows/finance/',bad,self.agency).status_code,400)
        r=self.post('workflows/finance/',{**data,'metadata':{'payment_date':None}});self.assertEqual(r.status_code,201,r.data);pk=r.data['data']['id']
        self.assertEqual(self.post(f'workflows/finance/{pk}/post/',{}).status_code,200);self.assertEqual(self.post(f'workflows/finance/{pk}/post/',{}).status_code,200)
        original=FinancialDocument.objects.get(pk=pk);self.assertEqual(original.amount,Decimal('100.01'))
        reverse=self.post('workflows/finance/',{'kind':'reversal','amount':'1','reverses_id':pk,'idempotency_key':str(uuid.uuid4())});self.assertEqual(reverse.status_code,201,reverse.data)
        self.assertEqual(self.post(f'workflows/finance/{reverse.data["data"]["id"]}/post/',{}).status_code,200)
        original.refresh_from_db();self.assertEqual(original.status,'reversed');ledger=self.client.get('/panel/workflows/ledger/').data['data']['results'];self.assertTrue(all(Decimal(r['balance'])==0 for r in ledger))
        self.login(self.owner);self.assertEqual(self.client.get(f'/panel/workflows/finance/{pk}/').status_code,404)
    def test_financial_rate_versions_and_idempotency(self):
        import uuid
        rate=self.post('workflows/financial-settings/',{'effective_from':str(timezone.localdate()),'mode':'agreed','commission_rate':'2.50','tax_rate':'10','expert_share_rate':'40','deductions':'0'},self.agency);self.assertEqual(rate.status_code,201,rate.data)
        calculation=self.post('workflows/commission/calculate/',{'rate_version_id':rate.data['data']['id'],'transaction_amount':'100000'});self.assertEqual(calculation.data['data']['expert_share'],'1000.00');self.assertEqual(calculation.data['data']['office_share'],'1500.00')
        key=str(uuid.uuid4());payload={'kind':'payment','amount':'100','idempotency_key':key}
        first=self.post('workflows/finance/',payload);again=self.post('workflows/finance/',payload);self.assertEqual(first.data['data']['id'],again.data['data']['id'])
        self.assertEqual(self.post('workflows/finance/',{'kind':'payment','amount':'100'}).status_code,400)
    def test_supplemental_finance_role_scoped_to_office(self):
        r=self.post('workflows/roles/',{'user_id':self.buyer.pk,'workspace_id':self.agency.pk,'roles':['finance']},self.admin);self.assertEqual(r.status_code,200)
        self.assertEqual(self.post('workflows/finance/',{'kind':'invoice','amount':'20'},self.buyer).status_code,201)
        self.assertEqual(self.post('workflows/finance/',{'kind':'invoice','amount':'20','workspace_id':self.next.pk}).status_code,403)
        UserBusinessRole.objects.filter(user=self.buyer).delete()
        self.assertEqual(self.client.get('/panel/workflows/finance/').data['data']['total_results'],0)
        self.assertEqual(self.post('workflows/finance/',{'kind':'invoice','amount':'20'}).status_code,403)
    def test_expert_share_versions_preserve_original_calculations(self):
        from accounts.models import ExpertProfile
        from .models import ExpertShareAgreement
        profile=ExpertProfile.objects.create(user=self.expert,commission_share_rate=Decimal('35.1234'))
        rate=self.post('workflows/financial-settings/',{'effective_from':str(timezone.localdate()),'commission_rate':'2','expert_share_rate':'10','mode':'agreed'},self.agency)
        payload={'rate_version_id':rate.data['data']['id'],'transaction_amount':'100000','expert_id':self.expert.pk}
        first=self.post('workflows/commission/calculate/',payload);self.assertEqual(first.status_code,200,first.data)
        self.assertEqual(first.data['data']['expert_share'],'702.47')
        first_version=first.data['data']['agreement_version']
        profile.commission_share_rate=Decimal('50');profile.save()
        second=self.post('workflows/commission/calculate/',payload)
        self.assertEqual(second.data['data']['expert_share'],'1000.00')
        self.assertNotEqual(first_version,second.data['data']['agreement_version'])
        self.assertEqual(ExpertShareAgreement.objects.get(pk=first_version).share_percent,Decimal('35.1234'))
        self.assertEqual(self.post('workflows/commission/calculate/',{**payload,'rate_version_id':'invalid'}).status_code,400)
    def test_contact_requires_login_and_public_catalog_hides_phone(self):
        self.row.publication_state='published';self.row.assigned_expert=self.expert
        self.row.data['workPhone']=self.expert.phone;self.row.save()
        self.assertIsNone(self.client.get(f'/panel/public/catalog/{self.row.pk}/').data['data']['expert']['work_phone'])
        self.assertIn(self.client.get(f'/panel/workflows/properties/{self.row.pk}/contact/').status_code,(401,403))
        self.login(self.buyer)
        response=self.client.get(f'/panel/workflows/properties/{self.row.pk}/contact/')
        self.assertEqual(response.status_code,200,response.data);self.assertEqual(response.data['data']['phone'],self.expert.phone)
        self.assertIn('no-store',response['Cache-Control'])
    def test_workflow_pagination_search_role_and_favorite_ids(self):
        from .models import PropertyFavorite
        CRMContact.objects.bulk_create([CRMContact(workspace=self.agency,name=f'مخاطب {i}',phone=f'0900001{i:04}',roles=['owner' if i%2 else 'buyer']) for i in range(30)])
        self.login(self.agency)
        owners=self.client.get('/panel/workflows/contacts/',{'role':'owner'})
        self.assertEqual(owners.data['data']['total_results'],15)
        FinancialDocument.objects.bulk_create([FinancialDocument(workspace=self.agency,created_by=self.agency,kind='invoice',direction='debit',amount='100',status='posted',description=f'سند تست {i}') for i in range(30)])
        first=self.client.get('/panel/workflows/finance/',{'page':1,'page_size':10}).data['data']
        second=self.client.get('/panel/workflows/finance/',{'page':2,'page_size':10}).data['data']
        self.assertEqual(first['total_results'],30);self.assertEqual(len(second['results']),10)
        self.assertFalse({x['id'] for x in first['results']}&{x['id'] for x in second['results']})
        self.assertEqual(Decimal(first['summary']['debit']),Decimal('3000'))
        self.assertEqual(self.client.get('/panel/workflows/finance/',{'search':'تست 29'}).data['data']['total_results'],1)
        self.assertEqual(self.client.get('/panel/workflows/finance/',{'page_size':500}).status_code,400)
        rows=PropertyRecord.objects.bulk_create([PropertyRecord(kind='file',created_by=self.expert,publication_state='published',data={'city':'قم','propertyType':'آپارتمان'}) for _ in range(30)])
        PropertyFavorite.objects.bulk_create([PropertyFavorite(property=row,user=self.buyer) for row in rows]);self.login(self.buyer)
        self.assertEqual(len(self.client.get('/panel/workflows/favorites/').data['data']['results']),24)
        self.assertEqual(len(self.client.get('/panel/workflows/favorites/',{'ids':'true'}).data['data']['ids']),30)
    def test_commission_invoice_has_separate_tax_and_immutable_snapshot(self):
        rate=self.post('workflows/financial-settings/',{'effective_from':str(timezone.localdate()),'commission_rate':'2','tax_rate':'10','expert_share_rate':'40','mode':'agreed'},self.agency).data['data']['id']
        payload={'kind':'invoice','amount':'2200','rate_version_id':rate,'transaction_amount':'100000','description':'کمیسیون معامله'}
        response=self.post('workflows/finance/',payload);self.assertEqual(response.status_code,201,response.data)
        row=response.data['data'];self.assertEqual(row['calculation']['invoice_total'],'2200.00')
        self.assertEqual(next(e['credit'] for e in row['entries'] if e['account']=='tax_payable'),'200.00')
        self.assertEqual(self.post('workflows/finance/',{**payload,'amount':'2000'}).status_code,400)
        self.assertEqual(self.post('workflows/commission/calculate/',{'rate_version_id':rate,'transaction_amount':'100000','date':'2026-99-99'}).status_code,400)
    def test_role_downgrade_revokes_business_access_without_deleting_records(self):
        from accounts.models import ExpertProfile
        profile=ExpertProfile.objects.create(user=self.expert,job_details='اطلاعات حفظ‌شده')
        self.row.assigned_expert=self.expert;self.row.office=self.agency;self.row.publication_state='published';self.row.save()
        professional=PropertyRecord.objects.create(kind='file',created_by=self.expert,data={'requesterType':'owner'})
        CRMContact.objects.create(workspace=self.agency,expert=self.expert,name='مخاطب',phone=self.owner.phone,roles=['owner'])
        ref=PropertyReferral.objects.create(property=self.row,expert=self.expert,expires_at=timezone.now()+timedelta(minutes=20))
        slot=VisitSlot.objects.create(property=self.row,expert=self.expert,starts_at=timezone.now()+timedelta(days=1),ends_at=timezone.now()+timedelta(days=1,hours=1))
        visit=PropertyVisit.objects.create(slot=slot,visitor=self.buyer)
        self.expert.role='user';self.expert.save();self.login(self.expert)
        self.assertEqual(self.client.get(f'/panel/files/{self.row.pk}/').status_code,404)
        self.assertEqual(self.client.get(f'/panel/files/{professional.pk}/').status_code,404)
        self.assertEqual(self.client.get('/panel/workflows/contacts/').data['data']['total_results'],0)
        self.assertEqual(self.client.get('/panel/workflows/assignments/').data['data']['total_results'],0)
        self.assertEqual(self.client.get('/panel/workflows/visits/').data['data']['total_results'],0)
        self.assertEqual(self.post(f'workflows/properties/{self.row.pk}/publish/',{'publish':True}).status_code,403)
        self.assertIn(self.post(f'workflows/assignments/{ref.pk}/respond/',{'decision':'accept'}).status_code,(403,404))
        self.assertEqual(self.client.patch(f'/panel/workflows/visits/{visit.pk}/',{'status':'confirmed'},format='json').status_code,404)
        self.assertEqual(self.client.get(f'/panel/public/catalog/{self.row.pk}/').status_code,404)
        self.expert.role='expert';self.expert.save();self.login(self.expert)
        self.assertEqual(self.client.get(f'/panel/files/{self.row.pk}/').status_code,200)
        self.assertEqual(self.client.get('/panel/workflows/contacts/').data['data']['total_results'],1)
        self.assertEqual(ExpertProfile.objects.get(pk=profile.pk).job_details,'اطلاعات حفظ‌شده')
        self.assertEqual(self.client.get(f'/panel/public/catalog/{self.row.pk}/').status_code,200)
    def test_rental_acceptance_links_landlord_and_tenant_crm_roles(self):
        self.row.data['contractType']='رهن و اجاره';self.row.save()
        ref=dispatch(self.row.pk);respond(ref.pk,self.expert,'accept')
        self.assertEqual(set(CRMContact.objects.get(user=self.owner).roles),{'owner','landlord'})
        request=PropertyRecord.objects.create(kind='request',created_by=self.buyer,data={'contractType':'رهن و اجاره','province':'قم','city':'قم','requesterType':'customer'})
        ref=dispatch(request.pk);respond(ref.pk,self.expert,'accept')
        self.assertEqual(CRMContact.objects.get(user=self.buyer).roles,['tenant'])
    def test_new_agency_cannot_inherit_an_experts_previous_office_records(self):
        from .models import EstateActivity
        other=User.objects.create_user('09000001009','test-password',role='agency')
        AgencyExpertLink.objects.create(agency=other,expert=self.expert)
        self.row.office=self.agency;self.row.assigned_expert=self.expert;self.row.publication_state='published';self.row.save()
        contract=EstateActivity.objects.create(kind='contracts',created_by=self.expert,assigned_expert=self.expert,office=self.agency,data={'file_name':'قرارداد دفتر قبلی'})
        CRMContact.objects.create(workspace=self.agency,expert=self.expert,name='مخاطب دفتر قبلی',phone=self.owner.phone,roles=['owner'])
        self.login(other)
        self.assertEqual(self.client.get(f'/panel/files/{self.row.pk}/').status_code,404)
        self.assertEqual(self.client.get(f'/panel/contracts/{contract.pk}/').status_code,404)
        self.assertEqual(self.post(f'workflows/properties/{self.row.pk}/publish/',{'publish':True}).status_code,403)
        AgencyExpertLink.objects.filter(agency=self.agency,expert=self.expert).delete();self.login(self.expert)
        self.assertEqual(self.client.get(f'/panel/files/{self.row.pk}/').status_code,404)
        self.assertEqual(self.client.get('/panel/workflows/contacts/').data['data']['total_results'],0)
        self.assertEqual(self.client.get(f'/panel/public/catalog/{self.row.pk}/').status_code,404)
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.expert)
        self.assertEqual(self.client.get(f'/panel/files/{self.row.pk}/').status_code,200)
    def test_expert_settlement_uses_real_scoped_payee_and_is_visible_only_to_recipient(self):
        import uuid
        self.login(self.agency)
        people=self.client.get('/panel/workflows/finance/',{'experts':'true'}).data['data']['results']
        self.assertEqual([p['id'] for p in people],[self.expert.pk])
        payload={'kind':'settlement','amount':'50','expert_id':self.expert.pk,'idempotency_key':str(uuid.uuid4()),'description':'تسویه سهم کارشناس'}
        result=self.post('workflows/finance/',payload);self.assertEqual(result.status_code,201,result.data)
        pk=result.data['data']['id'];self.assertEqual(result.data['data']['payee_expert_id'],self.expert.pk)
        self.assertEqual(CRMContact.objects.get(pk=result.data['data']['party_id']).user_id,self.expert.pk)
        self.assertEqual(self.post('workflows/finance/',payload).data['data']['id'],pk)
        self.assertEqual(self.post('workflows/finance/',{**payload,'expert_id':self.next.pk,'idempotency_key':str(uuid.uuid4())}).status_code,404)
        self.login(self.expert);self.assertEqual(self.client.get(f'/panel/workflows/finance/{pk}/').status_code,200)
        self.assertEqual(self.post(f'workflows/finance/{pk}/post/',{}).status_code,403)
        self.login(self.next);self.assertEqual(self.client.get(f'/panel/workflows/finance/{pk}/').status_code,404)
    def test_chat_context_and_archive_are_scoped(self):
        self.row.publication_state='published';self.row.assigned_expert=self.expert;self.row.save()
        first=self.post(f'workflows/properties/{self.row.pk}/chat/',{},self.buyer);self.assertEqual(first.status_code,200,first.data)
        again=self.post(f'workflows/properties/{self.row.pk}/chat/',{});self.assertEqual(first.data['data']['chat_id'],again.data['data']['chat_id'])
        self.assertEqual(self.post('workflows/archive/',{'entity_type':'property','id':self.row.pk,'archived':True},self.buyer).status_code,404)
        self.assertEqual(self.post('workflows/archive/',{'entity_type':'property','id':self.row.pk,'archived':True},self.owner).status_code,200)
        self.assertEqual(self.client.get(f'/panel/public/catalog/{self.row.pk}/').status_code,404)
    def test_disabled_feature_blocks_backend_not_just_menu(self):
        from .settings_models import PanelSettings
        PanelSettings.objects.create(pk=1,data={'features':{'favorites':False}});cache.clear()
        self.assertEqual(self.post('workflows/favorites/',{'property_id':self.row.pk},self.buyer).status_code,403)

    def test_invoice_partial_payment_overpayment_and_immutable_receipt(self):
        import uuid
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test import override_settings
        from tempfile import TemporaryDirectory
        self.login(self.agency)
        invoice=self.post('workflows/finance/',{'kind':'invoice','amount':'1000'}).data['data']['id']
        self.post(f'workflows/finance/{invoice}/post/',{})
        payment=self.post('workflows/finance/',{'kind':'payment','amount':'400','invoice_id':invoice,'idempotency_key':str(uuid.uuid4())}).data['data']['id']
        self.post(f'workflows/finance/{payment}/post/',{})
        d=self.client.get(f'/panel/workflows/finance/{invoice}/').data['data'];self.assertEqual(d['payment_status'],'partial');self.assertEqual(Decimal(d['outstanding']),Decimal('600'))
        second=self.post('workflows/finance/',{'kind':'payment','amount':'700','invoice_id':invoice,'idempotency_key':str(uuid.uuid4())}).data['data']['id']
        self.assertEqual(self.post(f'workflows/finance/{second}/post/',{}).status_code,400)
        with TemporaryDirectory() as media,override_settings(MEDIA_ROOT=media):
            bad=SimpleUploadedFile('malware.html',b'<script>alert(1)</script>',content_type='text/html')
            self.assertEqual(self.client.post(f'/panel/workflows/finance/{second}/receipt/',{'receipt':bad},format='multipart').status_code,400)
            pdf=SimpleUploadedFile('receipt.pdf',b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF',content_type='application/pdf')
            r=self.client.post(f'/panel/workflows/finance/{second}/receipt/',{'receipt':pdf},format='multipart');self.assertEqual(r.status_code,200,r.data)
            self.login(self.owner);self.assertEqual(self.client.get(f'/panel/workflows/finance/{second}/receipt/').status_code,404)
            self.login(self.agency);r=self.client.get(f'/panel/workflows/finance/{second}/receipt/');self.assertEqual(r.status_code,200);self.assertIn('no-store',r['Cache-Control']);self.assertTrue(b''.join(r.streaming_content).startswith(b'%PDF'))
    def test_saved_filter_owner_scope_and_activity_links(self):
        payload={'name':'قم','report':'operations','filters':{'city':'قم'}}
        one=self.post('workflows/saved-filters/',payload,self.agency);self.assertEqual(one.status_code,201)
        self.assertEqual(self.post('workflows/saved-filters/',payload).data['data']['id'],one.data['data']['id'])
        self.login(self.owner);self.assertEqual(self.client.delete(f'/panel/workflows/saved-filters/{one.data["data"]["id"]}/').status_code,404)
        self.row.assigned_expert=self.expert;self.row.office=self.agency;self.row.save()
        contact=CRMContact.objects.create(workspace=self.agency,name='مالک',phone='09000001005',roles=['owner'])
        activity=self.post('contracts/',{'file_name':'قرارداد متصل','status':'نهایی','agreed_price':'123.45','property_id':self.row.pk,'party_id':contact.pk,'expert_id':self.expert.pk},self.agency)
        self.assertEqual(activity.status_code,201,activity.data);self.assertEqual(activity.data['data']['property_id'],self.row.pk);self.assertEqual(activity.data['data']['party_ids'],[contact.pk]);self.assertEqual(activity.data['data']['agreed_price'],'123.45')
    def test_owner_partial_draft_can_save_without_city(self):
        response=self.post('workflows/owner-submissions/',{'propertyType':'آپارتمان','contractType':'فروش','publicationStatus':'draft'},self.owner)
        self.assertEqual(response.status_code,201,response.data);pk=response.data['data']['id']
        self.assertFalse(PropertyReferral.objects.filter(property_id=pk).exists())
        self.assertEqual(self.client.patch(f'/panel/files/{pk}/',{'publicationStatus':'pending'},format='json').status_code,400)

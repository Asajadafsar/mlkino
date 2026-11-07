"""Idempotent demo-only fixtures. Never copy a live database or call providers."""
from datetime import timedelta
from decimal import Decimal
from io import BytesIO
import copy,json,uuid
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand,CommandError
from django.db import transaction,connection
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from PIL import Image,ImageDraw
from accounts.models import User,AgencyProfile,ExpertProfile,AgencyExpert,AccountNotification,ActivityLog,Announcement
from panel.models import (AgencyExpertLink,PropertyRecord,EstateActivity,DirectConversation,DirectMessage,
    PersonalReminder,ImportantTask,TaskAssignment,PanelSettings)
from panel.workflow_models import (CRMContact,ExpertPermission,PropertyPin,PropertyReferral,WorkflowEvent,PropertyFavorite,VisitSlot,
    PropertyVisit,VisitAssignment,PropertyOffer,FinancialRateVersion,FinancialDocument,UserBusinessRole,PropertyChat)
from panel.finance_api import clean_entries,calc

NAMESPACE='MLKINO-DEMO-v1'
CITIES=[('قم','قم','منطقه ۴','بنیاد',34.6416,50.8746),('تهران','تهران','منطقه ۱','نیاوران',35.8104,51.4674),('فارس','شیراز','','معالی‌آباد',29.6610,52.4780),('اصفهان','اصفهان','','مرداویج',32.6091,51.6713),('خراسان رضوی','مشهد','','احمدآباد',36.3047,59.5786)]


def require_demo_environment():
    name=str(settings.DATABASES.get('default',{}).get('NAME','')).lower()
    if getattr(settings,'MLKINO_DEMO_ENV',False) is not True or getattr(settings,'MLKINO_DEMO_SEED_ALLOWED',False) is not True or 'demo' not in name:
        raise CommandError('Seed فقط با MLKINO_DEMO_ENV=True و MLKINO_DEMO_SEED_ALLOWED=True در دیتابیس مستقل دارای نام demo مجاز است؛ Production مجاز نیست.')
    if getattr(settings,'DATABASE_ROUTERS',[]):raise CommandError('برای جلوگیری از ارسال داده به دیتابیس دیگر، Seed با router دیتابیس مجاز نیست.')


def verify_demo_connection():
    # Check the live PostgreSQL connection too; a misleading NAME or service
    # alias must not route writes into a different live database.
    if connection.vendor!='postgresql':raise CommandError('اجرای واقعی Seed فقط در PostgreSQL محیط Demo سرور مجاز است.')
    with connection.cursor() as cursor:
        cursor.execute('SELECT current_database()');actual=str(cursor.fetchone()[0])
    declared=str(settings.DATABASES['default']['NAME'])
    if actual!=declared or 'demo' not in actual.lower():raise CommandError('دیتابیس متصل‌شده با دیتابیس Demo اعلام‌شده مطابقت ندارد؛ هیچ داده‌ای ساخته نشد.')


def key(value):return str(uuid.uuid5(uuid.NAMESPACE_URL,NAMESPACE+':'+str(value)))
def marker(value):return NAMESPACE+':'+str(value)

def property_picture(index):
    from django.core.files.storage import default_storage
    key=f'demo_seed/properties/demo-house-{index%5}.webp'
    if not default_storage.exists(key):
        image=Image.new('RGB',(960,600),['#d8e8f3','#e5e4f5','#e8e5dc','#dcece3','#dce4f4'][index%5]);draw=ImageDraw.Draw(image)
        draw.rectangle((0,430,960,600),fill='#9ab69b');draw.rectangle((180,200,780,470),fill='#f2ede4');draw.polygon([(130,210),(480,65),(830,210)],fill='#425675')
        for x in (240,530):draw.rectangle((x,250,x+150,370),fill='#6a9abb');draw.line((x+75,250,x+75,370),fill='white',width=5)
        draw.rectangle((425,340,520,470),fill='#796656');draw.rectangle((0,0,960,38),fill='#16385b');draw.text((18,12),'MLKINO DEMO - SYNTHETIC PROPERTY - NOT FOR SALE',fill='white')
        stream=BytesIO();image.save(stream,format='WEBP',quality=80,method=5);default_storage.save(key,ContentFile(stream.getvalue(),name=key))
    base=getattr(settings,'MLKINO_DEMO_PUBLIC_BASE_URL','https://demo.invalid').rstrip('/')
    return base+default_storage.url(key)


class Command(BaseCommand):
    help='ایجاد داده نمایشی کامل فقط در محیط Demo ایزوله؛ بدون SMS یا استعلام هویتی/پستی.'
    def add_arguments(self,p):
        p.add_argument('--profile',choices=['small','full'],default='full')
        p.add_argument('--password',default='123456789')
        p.add_argument('--dry-run',action='store_true')
    def handle(self,*args,**opts):
        require_demo_environment()
        if len(opts['password'])<8:raise CommandError('رمز حساب آزمایشی باید حداقل ۸ کاراکتر باشد.')
        size=8 if opts['profile']=='small' else 40
        if opts['dry_run']:
            self.stdout.write(json.dumps({'namespace':NAMESPACE,'mode':'dry-run','profile':opts['profile'],'property_count':size,'writes':0},ensure_ascii=False));return
        verify_demo_connection()
        with transaction.atomic():
            manifest=self.seed(size,opts['password'])
        self.stdout.write(json.dumps(manifest,ensure_ascii=False,indent=2))

    def seed(self,size,password):
        from panel.settings_api import DEFAULTS
        initial=copy.deepcopy(DEFAULTS);initial['general']['panelName']='ملکینو — محیط نمایشی'
        settings_row,_=PanelSettings.objects.get_or_create(pk=1,defaults={'data':initial})
        metadata=settings_row.data.get('_demo_seed',{})
        if not isinstance(metadata,dict):raise CommandError('فراداده Demo معتبر نیست؛ داده موجود بازنویسی نشد.')
        epoch=metadata.get(NAMESPACE)
        new_namespace=not epoch
        if not epoch:
            epoch=timezone.now().isoformat();settings_row.data={**settings_row.data,'_demo_seed':{**metadata,NAMESPACE:epoch}};settings_row.save(update_fields=['data','updated_at'])
        now=parse_datetime(epoch)
        if not now:raise CommandError('زمان مرجع Demo معتبر نیست.')
        today=timezone.localdate(now);users=[]
        def user(index,role,city_index=0):
            phone='09000'+str(100000+index)
            u=User.objects.filter(phone=phone).first()
            email=f'user-{index}@mlkino-demo.example.invalid'
            if u and u.email!=email:raise CommandError('شماره رزروشده با داده دیگری تداخل دارد؛ هیچ داده موجودی تغییر نکرد.')
            if not u:
                u=User.objects.create_user(phone,password,role=role,email=email,first_name='نمایشی',last_name=f'{role} {index}',is_staff=role=='superadmin',is_superuser=role=='superadmin')
                province,city,*_=CITIES[city_index%len(CITIES)]
                u.province=province;u.city=city;u.address='نشانی مصنوعی صرفاً برای نمایش؛ فاقد اعتبار واقعی'
                u.verification_status='pending';u.national_code_verified=False;u.phone_verified=False;u.save()
            if u.role!=role:raise CommandError('نقش حساب Demo قبلاً تغییر کرده است؛ Seed آن را بازنویسی نمی‌کند.')
            if not u.check_password(password):u.set_password(password);u.save(update_fields=['password'])
            users.append(u);return u
        admin=user(1,'superadmin');agencies=[user(10+i,'agency',i) for i in range(5)]
        expert_offices=[0,0,1,0,1,0,1,0,1,2,2,2]
        experts=[user(30+i,'expert',expert_offices[i]) for i in range(12 if size>8 else 3)]
        market=user(20,'agency')
        AgencyProfile.objects.get_or_create(manager=market,defaults={'agency_name':'بازار املاک ملکینو — نمایشی','occupancy_type':'owner','office_address':'دفتر مرجع سیستمی، فقط محیط نمایشی','description':NAMESPACE})
        clients=[user(60+i,'user',i) for i in range(12 if size>8 else 4)]
        for i,agency in enumerate(agencies):
            province,city,district,neighborhood,*_=CITIES[i]
            profile,_=AgencyProfile.objects.get_or_create(manager=agency,defaults={'agency_name':'دفتر نمایشی '+city,'occupancy_type':'owner','office_address':'نشانی نمایشی دفتر '+city,'office_district':district,'office_neighborhood':neighborhood,'has_business_license':i%2==0,'license_number':f'DEMO-NOT-VALID-{i}' if i%2==0 else '','description':NAMESPACE+' — صرفاً نمایشی و بدون پروانه معتبر','office_verification_status':'pending'})
            if i%2==0 and not profile.license_image:
                canvas=Image.new('RGB',(600,320),'#f0f5ff');ImageDraw.Draw(canvas).text((25,130),'DEMO ONLY - NOT A VALID LICENSE',fill='#2450a4')
                image=BytesIO();canvas.save(image,'WEBP',quality=85);profile.license_image.save('demo-license.webp',ContentFile(image.getvalue()))
        for i,expert in enumerate(experts):
            agency=agencies[expert_offices[i]]
            AgencyExpertLink.objects.get_or_create(agency=agency,expert=expert)
            AgencyExpert.objects.get_or_create(agency=agency,expert=expert,defaults={'is_active':True})
            ExpertProfile.objects.get_or_create(user=expert,defaults={'expert_code':f'DEMO-EXPERT-{i}','job_title':'کارشناس نمایشی','experience_years':i+1,'job_details':NAMESPACE})
            ExpertPermission.objects.get_or_create(workspace=agency,expert=expert,defaults={'updated_by':agency,'permissions':{
                'can_create_files':True,'can_manage_requests':i%4!=0,'can_manage_contacts':True,
                'can_manage_visits':True,'can_manage_followups':True,'can_manage_finance':i%3==0,
            }})
        contacts=[]
        for i,client in enumerate(clients):
            ws=agencies[i%len(agencies)];expert=next((e for n,e in enumerate(experts) if expert_offices[n]==i%len(agencies)),None);role=['owner','buyer','landlord','tenant'][i%4]
            contact,_=CRMContact.objects.get_or_create(workspace=ws,phone=client.phone,defaults={'user':client,'expert':expert,'name':'مخاطب نمایشی '+str(i),'national_code':f'{9900000000+i:010d}','phone2':'025000'+f'{1000+i:04d}','job':['کارمند','فروشنده','پزشک','آزاد'][i%4],'roles':[role],'data':{'demo_namespace':NAMESPACE,'province':client.province,'city':client.city,'budget':'4500000000','note':'داده کاملاً مصنوعی؛ تماس واقعی نگیرید'}})
            if contact.data.get('demo_namespace')==NAMESPACE:
                contact.national_code=contact.national_code or f'{9900000000+i:010d}';contact.phone2=contact.phone2 or '025000'+f'{1000+i:04d}';contact.job=contact.job or ['کارمند','فروشنده','پزشک','آزاد'][i%4]
                contact.save(update_fields=['national_code','phone2','job','updated_at'])
            contacts.append(contact);UserBusinessRole.objects.get_or_create(user=client,workspace=ws,role=role)
        UserBusinessRole.objects.get_or_create(user=experts[0],workspace=agencies[0],role='finance')
        rows=[]
        for i in range(size):
            index=i%len(CITIES);province,city,district,neighborhood,lat,lon=CITIES[index]
            expert=experts[i%len(experts)];office=agencies[expert_offices[i%len(experts)]];creator=clients[i%len(clients)] if i%3==0 else expert
            token=marker(f'property-{i}')
            row=PropertyRecord.objects.filter(data__demo_key=token).first()
            if not row:
                kind='request' if i%3==0 else 'file';state=['published','draft','pending','published'][i%4]
                data={'demo_key':token,'demo_namespace':NAMESPACE,'source':'landing' if i%3==0 else 'panel','title':f'ملک نمایشی {i+1} — {city}','contractType':'رهن و اجاره' if i%2 else 'فروش','propertyType':['آپارتمان','ویلا','زمین','تجاری','اداری'][i%5],'province':province,'city':city,'district':[district] if kind=='request' else district,'neighborhood':[neighborhood] if kind=='request' else neighborhood,'area':70+i*11,'areaFrom':70+i*5,'areaTo':150+i*5,'totalPrice':3000000000+i*150000000,'mortgagePrice':300000000+i*20000000,'monthlyRent':5000000+i*1000000,'roomCount':i%4+1,'ownerName':'مالک نمایشی '+str(i),'ownerPhone':clients[i%len(clients)].phone,'ownerNationalId':f'{9900000000+i%len(clients):010d}','workPhone':expert.phone,'latitude':lat+(i%4)*0.0005,'longitude':lon+(i%3)*0.0005,'description':'این ملک کاملاً نمایشی است و برای معامله واقعی اعتبار ندارد.','images':[property_picture(i)],'amenities':['پارکینگ','آسانسور'] if i%2 else ['انباری'],'floorPreferences':['طبقه اول'] if kind=='request' else [],'requesterType':'owner' if i%6==0 else 'customer','status':'فعال','requestStatus':'در انتظار بررسی'}
                row=PropertyRecord.objects.create(kind=kind,created_by=creator,data=data,publication_state=state,assigned_expert=expert if state=='published' else None,office=office,featured=i%5==0,archived_at=now-timedelta(days=1) if i%13==12 else None)
                PropertyRecord.objects.filter(pk=row.pk).update(created_at=now-timedelta(days=i*2),updated_at=now-timedelta(hours=i))
            rows.append(row)
            if row.data.get('demo_namespace')==NAMESPACE and not row.data.get('source'):
                row.data={**row.data,'source':'landing' if i%3==0 else 'panel'};row.save(update_fields=['data','updated_at'])
            status='accepted' if row.publication_state in ('published','draft') else ['pending','rejected','expired','market'][(i//4)%4]
            ref,ref_created=PropertyReferral.objects.get_or_create(property=row,attempt=1,defaults={'expert':None if status=='market' else expert,'status':status,'expires_at':now+timedelta(minutes=20) if status=='pending' else now-timedelta(days=1)})
            if ref_created and status=='accepted' and not row.assigned_expert_id:
                row.assigned_expert=expert;row.save(update_fields=['assigned_expert'])
            if ref_created and status=='market':
                row.office=market;row.save(update_fields=['office'])
            if status in ('rejected','expired'):
                successor=experts[(i+1)%len(experts)]
                PropertyReferral.objects.get_or_create(property=row,attempt=2,defaults={'expert':successor,'status':'pending','expires_at':now+timedelta(minutes=20)})
            WorkflowEvent.objects.get_or_create(property=row,event='demo.referral.'+status,defaults={'actor':admin,'metadata':{'demo_namespace':NAMESPACE,'referral_id':ref.pk,'status':status}})
        published=[r for r in rows if r.kind=='file' and r.publication_state=='published' and not r.archived_at]
        requests=[r for r in rows if r.kind=='request']
        for i,row in enumerate(published):
            expert=row.assigned_expert or experts[0]
            PropertyFavorite.objects.get_or_create(user=clients[i%len(clients)],property=row)
            PropertyPin.objects.get_or_create(user=expert,property=row)
            slot,_=VisitSlot.objects.get_or_create(property=row,expert=expert,starts_at=now.replace(hour=10,minute=0,second=0,microsecond=0)+timedelta(days=2+i),defaults={'ends_at':now.replace(hour=11,minute=0,second=0,microsecond=0)+timedelta(days=2+i),'capacity':2})
            visit,_=PropertyVisit.objects.get_or_create(slot=slot,visitor=clients[i%len(clients)],defaults={'visitor_contact':contacts[i%len(contacts)],'assigned_expert':expert,'visitor_name':'بازدیدکننده نمایشی '+str(i),'visitor_phone':clients[i%len(clients)].phone,'preferred_days':['شنبه','دوشنبه'],'preferred_time':'ساعت ۱۷ تا ۱۹','notes':'هماهنگی نمایشی؛ تماس واقعی نگیرید.','status':['pending','confirmed','cancelled','rejected'][i%4],'expires_at':now+timedelta(minutes=20)})
            if visit.status=='pending':VisitAssignment.objects.get_or_create(visit=visit,attempt=1,defaults={'expert':expert,'status':'pending','expires_at':visit.expires_at or now+timedelta(minutes=20)})
            elif visit.status=='confirmed' and i%2:
                visit.result='follow_up';visit.status_description='مشتری برای تصمیم نهایی زمان بیشتری خواست.';visit.next_follow_up_at=now+timedelta(days=3);visit.save(update_fields=['result','status_description','next_follow_up_at'])
            peer=clients[i%len(clients)];u1,u2=sorted([peer.pk,expert.pk])
            chat,_=DirectConversation.objects.get_or_create(user1_id=u1,user2_id=u2)
            PropertyChat.objects.get_or_create(property=row,user=peer,defaults={'conversation':chat})
            DirectMessage.objects.get_or_create(conversation=chat,sender=peer,body=marker('message-'+str(row.pk)),defaults={'read_at':now if i%2 else None})
            if requests:PropertyOffer.objects.get_or_create(request=requests[i%len(requests)],property=row,created_by=expert,defaults={'message':'پیشنهاد صرفاً نمایشی '+NAMESPACE})
        for i,expert in enumerate(experts):
            ws=agencies[expert_offices[i]];contact=next(c for c in contacts if c.workspace_id==ws.pk)
            contract,_=EstateActivity.objects.get_or_create(kind='contracts',created_by=expert,data__demo_key=marker('contract-'+str(i)),defaults={'data':{'demo_key':marker('contract-'+str(i)),'file_name':'قرارداد نمایشی '+str(i),'contract_type':'فروش','agreed_price':5000000000+i*200000000,'status':['فعال','در انتظار امضا','لغو شده','پایان یافته'][i%4],'contract_datetime':(now-timedelta(days=i)).isoformat(),'description':'فاقد اعتبار معامله واقعی'}})
            EstateActivity.objects.get_or_create(kind='follow-ups',created_by=expert,data__demo_key=marker('followup-'+str(i)),defaults={'data':{'demo_key':marker('followup-'+str(i)),'file_name':'پیگیری نمایشی '+str(i),'full_name':contact.name,'phone_number':contact.phone,'status':['در حال پیگیری','انجام شده','نیازمند اقدام'][i%3],'date':(now+timedelta(days=i)).isoformat()}})
            rate,_=FinancialRateVersion.objects.get_or_create(workspace=ws,expert=expert,valid_from=today-timedelta(days=365),data__demo_namespace=NAMESPACE,defaults={'data':{'mode':'agreed','commission_rate':'0.50','tax_rate':'0.00','expert_share_rate':str(35+i%4*5),'deductions':'0.00','demo_namespace':NAMESPACE}})
            for kind in ['invoice','payment','settlement']:
                calculation=calc(Decimal(str(contract.data['agreed_price'])),rate)
                amount=Decimal(calculation['gross'])+Decimal(calculation['tax'])
                if kind=='payment' and i%2:amount=(amount/2).quantize(Decimal('.01'))
                if kind=='settlement':amount=Decimal(calculation['expert_share'])
                identity=uuid.UUID(key(f'finance-{i}-{kind}'))
                FinancialDocument.objects.get_or_create(idempotency_key=identity,defaults={'workspace':ws,'created_by':ws,'approved_by':ws if i%3 else None,'activity':contract,'party':contact if contact.workspace_id==ws.pk else None,'rate_version':rate,'kind':kind,'direction':'debit' if kind=='invoice' else 'credit','amount':amount,'status':'draft' if i%3==0 else 'posted','description':'سند نمایشی؛ فاقد اعتبار مالی واقعی','entries':clean_entries(None,amount,kind),'calculation':calculation,'data':{'demo_namespace':NAMESPACE,'tracking_number':'DEMO-'+str(i)},'posted_at':now-timedelta(days=i) if i%3 else None})
            if i%4==1:
                original=FinancialDocument.objects.get(idempotency_key=uuid.UUID(key(f'finance-{i}-payment')))
                if original.status in ('posted','reversed'):
                    reverse,created=FinancialDocument.objects.get_or_create(idempotency_key=uuid.UUID(key(f'finance-{i}-reversal')),defaults={'workspace':ws,'created_by':ws,'approved_by':ws,'activity':contract,'party':original.party,'reverses':original,'kind':'reversal','direction':'debit','amount':original.amount,'status':'posted','description':'برگشت نمایشی؛ فاقد اعتبار واقعی','entries':[{'account':e['account'],'debit':e['credit'],'credit':e['debit']} for e in original.entries],'data':{'demo_namespace':NAMESPACE},'posted_at':now})
                    if created and original.status=='posted':original.status='reversed';original.save(update_fields=['status'])
            PersonalReminder.objects.get_or_create(owner=expert,title=marker('reminder-'+str(i)),defaults={'description':'پیگیری نمایشی','remind_at':now+timedelta(days=i+1)})
            AccountNotification.objects.get_or_create(user=expert,kind='demo',title=marker('notification-'+str(i)),defaults={'body':'اعلان آزمایشی بدون ارسال پیامک','link':'/assignments','read_at':now if i%2 else None})
            task,_=ImportantTask.objects.get_or_create(created_by=admin,title=marker('task-'+str(i)),defaults={'description':'کار نمایشی','due_date':today+timedelta(days=i)})
            TaskAssignment.objects.get_or_create(task=task,assignee=expert,defaults={'status':'pending'})
            ActivityLog.objects.get_or_create(actor=expert,event='demo.seed',path=marker('audit-'+str(i)),defaults={'category':'demo','status_code':200,'metadata':{'demo_namespace':NAMESPACE,'description':'رویداد مصنوعی نمایشی'}})
        Announcement.objects.get_or_create(title=marker('announcement'),defaults={'description':'این محیط شامل داده مصنوعی است؛ هیچ پرداخت یا معامله واقعی انجام ندهید.','status':'published','created_by':admin})
        if new_namespace:
            workflow=dict(settings_row.data.get('workflow',{}));routing={'enabled':True,'response_minutes':20,'max_attempts':20,'mode':'round_robin',**workflow.get('routing',{})}
            if not routing.get('market_office_id'):routing['market_office_id']=market.pk
            workflow['routing']=routing;settings_row.data={**settings_row.data,'workflow':workflow};settings_row.save(update_fields=['data','updated_at'])
        return {'namespace':NAMESPACE,'profile':'small' if size==8 else 'full','users':[{'phone':u.phone,'role':u.role} for u in users],'counts':{'users':len(users),'offices':len(agencies),'experts':len(experts),'contacts':len(contacts),'properties':len(rows),'published':len(published)},'notice':'فقط داده نمایشی؛ ارسال SMS و استعلام هویت انجام نشد. رمزها و توکن‌ها در این خروجی نیستند.'}

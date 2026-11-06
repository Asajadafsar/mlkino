"""Authenticated, tenant-scoped estate workflows built on existing records."""
from datetime import timedelta
import re
from django.db import transaction
from django.db.models import Q,Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError,PermissionDenied
from accounts.models import User
from accounts.notices import notify
from .models import (PropertyRecord,AgencyExpertLink,CRMContact,PropertyReferral,PropertyFavorite,VisitSlot,PropertyVisit,PropertyOffer,UserBusinessRole,PropertyChat,DirectConversation,EstateActivity,FinancialDocument)
from .settings_api import envelope,is_superadmin
from .settings_models import PanelSettings
from .workflow_services import workspaces,workspace,audit,feature,dispatch,respond,policy,ROUTING_DEFAULTS
from .property_api import scope,serialize as property_serialize,validate_payload,normalize
from .public_api import public_serialize,public_rows
from .finance_api import money

def ident(value):
    try:
        assert not isinstance(value,(bool,float)) and str(value).isdigit()
        n=int(value);assert n>0
    except (ValueError,TypeError,AssertionError):raise ValidationError('شناسه معتبر انتخاب کنید.')
    return n
def results(qs,serialize,limit=200):return {'results':[serialize(x) for x in qs[:limit]],'total_results':qs.count()}
def can_manage(user,row):
    if not(is_superadmin(user) or row.assigned_expert_id==user.pk or row.created_by_id==user.pk and user.role in ('expert','agency') or user.role=='agency' and row.office_id==user.pk):raise PermissionDenied('مدیریت این پرونده مجاز نیست.')
def view_property(user,pk):
    row=get_object_or_404(PropertyRecord.objects.select_related('assigned_expert','created_by','office'),pk=pk)
    if (row.publication_state!='published' or row.archived_at) and not scope(user).filter(pk=pk).exists():raise PermissionDenied('این ملک قابل مشاهده نیست.')
    return row

def contact_scope(user):
    qs=CRMContact.objects.select_related('workspace','expert','user')
    if is_superadmin(user):return qs
    if user.role=='agency':return qs.filter(workspace=user)
    granted=UserBusinessRole.objects.filter(user=user,role='finance').values_list('workspace_id',flat=True)
    return qs.filter(Q(expert=user)|Q(workspace=user)|Q(workspace_id__in=granted))
def contact_json(r):return {'id':r.pk,'name':r.name,'full_name':r.name,'phone':r.phone,'roles':r.roles,'kind':('lessor' if r.roles[0]=='landlord' else r.roles[0]) if r.roles else 'owner','office_id':r.workspace_id,'workspace_id':r.workspace_id,'expert_id':r.expert_id,'user_id':r.user_id,'created_at':r.created_at.isoformat(),'properties':list(r.properties.values_list('id',flat=True)),'activities':list(r.estate_activities.values_list('id',flat=True)),**r.data}

class ContactsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,pk=None):
        feature('crm');qs=contact_scope(request.user)
        if pk:return envelope(contact_json(get_object_or_404(qs,pk=pk)))
        if request.query_params.get('search'):qs=qs.filter(Q(name__icontains=request.query_params['search'])|Q(phone__icontains=request.query_params['search']))
        rows=list(qs)
        kind=request.query_params.get('kind')
        if kind:rows=[x for x in rows if ('landlord' if kind=='lessor' else kind) in x.roles]
        return envelope({'results':[contact_json(x) for x in rows[:200]],'total_results':len(rows)})
    def post(self,request):return self.save(request)
    def patch(self,request,pk):return self.save(request,pk)
    @transaction.atomic
    def save(self,request,pk=None):
        feature('crm')
        if request.user.role not in ('agency','expert') and not is_superadmin(request.user):raise PermissionDenied('مدیریت CRM برای این نقش مجاز نیست.')
        d=request.data;allowed={'name','full_name','phone','roles','kind','email','notes','province','city','district','neighborhood','budget_min','budget_max','expert_id','user_id','workspace_id'}
        if set(d)-allowed:raise ValidationError('فیلد CRM معتبر نیست.')
        row=get_object_or_404(contact_scope(request.user).select_for_update(of=('self',)),pk=pk) if pk else None
        name=d.get('name',d.get('full_name',row.name if row else ''));phone=normalize(d.get('phone',row.phone if row else '')).replace(' ','').replace('-','')
        if not isinstance(name,str) or not 2<=len(name.strip())<=200 or not re.fullmatch(r'\+?\d{8,15}',phone):raise ValidationError('نام و شماره تماس معتبر وارد کنید.')
        roles=d.get('roles')
        if roles is None:roles=[{'lessor':'landlord'}.get(d['kind'],d['kind'])] if d.get('kind') else row.roles if row else ['owner']
        if not isinstance(roles,list) or not roles or not set(roles)<={'owner','buyer','landlord','tenant'}:raise ValidationError('نوع مخاطب معتبر نیست.')
        ws=ident(d.get('workspace_id') or (row.workspace_id if row else workspace(request.user)))
        get_object_or_404(User.objects.select_for_update(of=('self',)),pk=ws)
        if ws not in workspaces(request.user) and not is_superadmin(request.user):raise PermissionDenied('دفتر متعلق به شما نیست.')
        expert_id=ident(d['expert_id']) if d.get('expert_id') else row.expert_id if row else request.user.pk if request.user.role=='expert' else None
        if expert_id and expert_id!=ws and not AgencyExpertLink.objects.filter(agency_id=ws,expert_id=expert_id).exists():raise ValidationError('کارشناس متعلق به دفتر نیست.')
        metadata=dict(row.data) if row else {}
        for k in ('email','notes','province','city','district','neighborhood'):
            if k in d:
                if not isinstance(d[k],str) or len(d[k])>(5000 if k=='notes' else 254):raise ValidationError('اطلاعات مخاطب معتبر نیست.')
                metadata[k]=d[k]
        for k in ('budget_min','budget_max'):
            if k in d:metadata[k]=str(money(d[k]))
        if money(metadata.get('budget_min',0))>money(metadata.get('budget_max','100000000000000000')):raise ValidationError('بازه بودجه معتبر نیست.')
        if row is None:
            row=CRMContact.objects.filter(workspace_id=ws,phone=phone).first()
            if row:roles=list(set(row.roles+roles))
            else:row=CRMContact(workspace_id=ws,phone=phone)
        if row.pk and CRMContact.objects.filter(workspace_id=ws,phone=phone).exclude(pk=row.pk).exists():raise ValidationError('این شماره قبلاً در دفتر ثبت شده است؛ مخاطب موجود را ویرایش کنید.')
        row.name=name.strip();row.phone=phone;row.roles=roles;row.expert_id=expert_id;row.data=metadata
        if d.get('user_id'):
            u=get_object_or_404(User,pk=ident(d['user_id']))
            if u.phone!=phone:raise ValidationError('شماره حساب با مخاطب مطابقت ندارد.')
            row.user=u
        row.save();audit(request.user,'crm.saved','contact',row.pk)
        return envelope(contact_json(row),code=200 if pk else 201)

def referral_scope(user):
    qs=PropertyReferral.objects.select_related('property','expert')
    if is_superadmin(user):return qs
    if user.role=='agency':return qs.filter(Q(property__office=user)|Q(expert_id__in=AgencyExpertLink.objects.filter(agency=user).values('expert_id')))
    return qs.filter(Q(expert=user)|Q(property__created_by=user))
def referral_json(r):return {'id':r.pk,'property_id':r.property_id,'property_title':r.property.data.get('title') or r.property.data.get('propertyType','ملک'),'expert_id':r.expert_id,'expert_name':r.expert.full_name if r.expert else 'بازار املاک ملکینو','status':r.status,'expires_at':r.expires_at.isoformat() if r.expires_at else None,'attempt':r.attempt,'created_at':r.created_at.isoformat(),'history':[{'event':e.event,'actor_id':e.actor_id,'created_at':e.created_at.isoformat()} for e in r.property.workflow_events.all()[:100]]}
class AssignmentsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('assignments');qs=referral_scope(request.user)
        if request.query_params.get('status'):qs=qs.filter(status=request.query_params['status'])
        return envelope(results(qs,referral_json))
class AssignmentRespondView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,pk):
        feature('assignments');get_object_or_404(referral_scope(request.user),pk=pk)
        decision=request.data.get('decision')
        if decision not in ('accept','reject') or not isinstance(request.data.get('publish',False),bool):raise ValidationError('پاسخ ارجاع معتبر نیست.')
        return envelope(referral_json(respond(pk,request.user,decision,request.data.get('publish',False))))
class AssignmentReferView(APIView):
    permission_classes=[IsAuthenticated]
    @transaction.atomic
    def post(self,request,pk):
        feature('assignments')
        if not is_superadmin(request.user):raise PermissionDenied('ارجاع دستی فقط برای سوپرادمین مجاز است.')
        ref=get_object_or_404(PropertyReferral,pk=pk)
        PropertyRecord.objects.select_for_update(of=('self',)).get(pk=ref.property_id)
        ref=PropertyReferral.objects.select_for_update(of=('self',)).get(pk=pk)
        if ref.status=='accepted':raise ValidationError('ارجاع پذیرفته‌شده بدون بررسی پرونده قابل انتقال نیست.')
        if ref.status in ('pending','market'):ref.status='rejected';ref.save(update_fields=['status','updated_at'])
        expert=get_object_or_404(User,pk=ident(request.data.get('expert_id')),role='expert',is_active=True)
        return envelope(referral_json(dispatch(ref.property_id,request.user,expert)))
class OwnerSubmissionView(APIView):
    permission_classes=[IsAuthenticated]
    @transaction.atomic
    def post(self,request):
        feature('files');d=validate_payload(request,'file');d['requesterType']='owner'
        draft=d.get('publicationStatus')=='draft'
        row=PropertyRecord.objects.create(kind='file',created_by=request.user,data=d,publication_state='draft' if draft else 'pending')
        audit(request.user,'property.owner.submitted','property',row.pk,property=row)
        if not draft:dispatch(row.pk,request.user)
        return envelope(property_serialize(row),code=201)
class PropertyPublishView(APIView):
    permission_classes=[IsAuthenticated]
    @transaction.atomic
    def post(self,request,pk):
        feature('files');row=get_object_or_404(PropertyRecord.objects.select_for_update(of=('self',)),pk=pk);can_manage(request.user,row)
        publish=request.data.get('publish')
        if not isinstance(publish,bool):raise ValidationError('وضعیت انتشار معتبر نیست.')
        if row.archived_at:raise ValidationError('ابتدا پرونده را از بایگانی بازیابی کنید.')
        if publish:validate_payload(request,row.kind,row.data)
        row.publication_state='published' if publish else 'draft';row.data={**row.data,'publicationStatus':row.publication_state};row.save(update_fields=['publication_state','data','updated_at']);audit(request.user,'property.publication','property',row.pk,property=row,status=row.publication_state)
        return envelope(property_serialize(row))
class FavoritesView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('favorites');qs=PropertyFavorite.objects.filter(user=request.user,property__publication_state='published',property__archived_at=None).select_related('property__assigned_expert','property__office__agency_profile','property__created_by')
        return envelope(results(qs,lambda r:{'id':r.pk,'property_id':r.property_id,'property':public_serialize(r.property)}))
    def post(self,request):
        feature('favorites');row=get_object_or_404(public_rows(),pk=ident(request.data.get('property_id')))
        fav,created=PropertyFavorite.objects.get_or_create(user=request.user,property=row)
        return envelope({'id':fav.pk,'property_id':row.pk},code=201 if created else 200)
    def delete(self,request,pk):
        feature('favorites');PropertyFavorite.objects.filter(user=request.user,property_id=pk).delete();return envelope({'deleted':True})

def slot_json(r):
    booked=r.bookings.filter(status__in=['pending','confirmed']).count()
    return {'id':r.pk,'property_id':r.property_id,'property_title':r.property.data.get('title',r.property.data.get('propertyType','ملک')),'expert_id':r.expert_id,'starts_at':r.starts_at.isoformat(),'ends_at':r.ends_at.isoformat(),'capacity':r.capacity,'available':max(0,r.capacity-booked),'active':r.active}
class VisitSlotsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('visits');qs=VisitSlot.objects.filter(active=True,starts_at__gt=timezone.now()).select_related('property')
        if request.query_params.get('property_id'):
            row=view_property(request.user,ident(request.query_params['property_id']));qs=qs.filter(property=row)
        elif not is_superadmin(request.user):qs=qs.filter(Q(property__publication_state='published')|Q(expert=request.user))
        return envelope(results(qs,slot_json))
    @transaction.atomic
    def post(self,request):
        feature('visits');row=get_object_or_404(PropertyRecord.objects.select_for_update(of=('self',)),pk=ident(request.data.get('property_id')));can_manage(request.user,row)
        try:start=parse_datetime(str(request.data.get('starts_at','')));end=parse_datetime(str(request.data.get('ends_at','')))
        except (ValueError,TypeError):raise ValidationError('زمان بازدید معتبر وارد کنید.')
        if not start or not end or timezone.is_naive(start) or timezone.is_naive(end) or start<=timezone.now() or end<=start or end-start>timedelta(hours=12):raise ValidationError('زمان بازدید باید آینده، دارای منطقه زمانی و پایان بعد از شروع باشد.')
        capacity=ident(request.data.get('capacity',1))
        if capacity>50:raise ValidationError('ظرفیت حداکثر ۵۰ نفر است.')
        expert=row.assigned_expert or request.user
        # Serializes slots across an expert as well as a property.
        User.objects.select_for_update(of=('self',)).get(pk=expert.pk)
        if VisitSlot.objects.filter(active=True,expert=expert,starts_at__lt=end,ends_at__gt=start).exists():raise ValidationError('این زمان با برنامه بازدید کارشناس تداخل دارد.')
        slot=VisitSlot.objects.create(property=row,expert=expert,starts_at=start,ends_at=end,capacity=capacity);audit(request.user,'visit.slot.created','visit_slot',slot.pk,property=row)
        return envelope(slot_json(slot),code=201)

def visit_scope(user):
    qs=PropertyVisit.objects.select_related('slot__property','visitor','slot__expert')
    if is_superadmin(user):return qs
    return qs.filter(Q(visitor=user)|Q(slot__expert=user)|Q(slot__property__office=user,slot__property__office__role='agency'))
def visit_json(r):return {'id':r.pk,'slot_id':r.slot_id,'property_id':r.slot.property_id,'property_title':r.slot.property.data.get('title') or r.slot.property.data.get('propertyType','ملک'),'visitor_name':r.visitor.full_name,'user_id':r.visitor_id,'expert_id':r.slot.expert_id,'starts_at':r.slot.starts_at.isoformat(),'ends_at':r.slot.ends_at.isoformat(),'status':r.status,'created_at':r.created_at.isoformat()}
class VisitsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):feature('visits');return envelope(results(visit_scope(request.user),visit_json))
    @transaction.atomic
    def post(self,request):
        feature('visits');User.objects.select_for_update(of=('self',)).get(pk=request.user.pk)
        slot=get_object_or_404(VisitSlot.objects.select_for_update(of=('self',)).select_related('property'),pk=ident(request.data.get('slot_id')),active=True)
        view_property(request.user,slot.property_id)
        if slot.starts_at<=timezone.now():raise ValidationError('زمان انتخاب‌شده گذشته است.')
        old=slot.bookings.filter(visitor=request.user,status__in=['pending','confirmed']).first()
        if old:return envelope(visit_json(old))
        if slot.bookings.filter(status__in=['pending','confirmed']).count()>=slot.capacity:raise ValidationError('ظرفیت این بازه تکمیل شده است.')
        if PropertyVisit.objects.filter(visitor=request.user,status__in=['pending','confirmed'],slot__starts_at__lt=slot.ends_at,slot__ends_at__gt=slot.starts_at).exists():raise ValidationError('با بازدید دیگری که رزرو کرده‌اید تداخل دارد.')
        row=PropertyVisit.objects.create(slot=slot,visitor=request.user);audit(request.user,'visit.booked','visit',row.pk,property=slot.property)
        notify(slot.expert,'visit','درخواست بازدید جدید',link=f'/visits?visit={row.pk}')
        return envelope(visit_json(row),code=201)
    @transaction.atomic
    def patch(self,request,pk):
        feature('visits');row=get_object_or_404(visit_scope(request.user).select_for_update(of=('self',)),pk=pk)
        status=request.data.get('status')
        if status not in ('confirmed','rejected','cancelled'):raise ValidationError('وضعیت بازدید معتبر نیست.')
        if row.visitor_id==request.user.pk and row.slot.expert_id!=request.user.pk and not is_superadmin(request.user) and status!='cancelled':raise PermissionDenied('فقط کارشناس می‌تواند بازدید را تأیید یا رد کند.')
        if row.status in ('cancelled','rejected') and status!=row.status:raise ValidationError('بازدید بسته‌شده را دوباره رزرو کنید.')
        row.status=status;row.save(update_fields=['status','updated_at']);audit(request.user,'visit.changed','visit',row.pk,property=row.slot.property,status=status)
        notify(row.visitor,'visit','وضعیت بازدید تغییر کرد',link=f'/visits?visit={row.pk}');return envelope(visit_json(row))

class OffersView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('offers');qs=PropertyOffer.objects.select_related('request','property','created_by')
        if not is_superadmin(request.user):qs=qs.filter(Q(created_by=request.user)|Q(request__created_by=request.user)|Q(request__assigned_expert=request.user))
        return envelope(results(qs,lambda r:{'id':r.pk,'request_id':r.request_id,'property_id':r.property_id,'message':r.message,'created_by':r.created_by_id,'created_at':r.created_at.isoformat(),'property':public_serialize(r.property)}))
    def post(self,request):
        feature('offers');target=get_object_or_404(public_rows(),pk=ident(request.data.get('request_id')),kind='request')
        row=get_object_or_404(scope(request.user),pk=ident(request.data.get('property_id')),kind='file',publication_state='published',archived_at=None)
        message=request.data.get('message','')
        if not isinstance(message,str) or len(message)>2000:raise ValidationError('پیام معتبر وارد کنید.')
        offer,created=PropertyOffer.objects.get_or_create(request=target,property=row,created_by=request.user,defaults={'message':message})
        if created:notify(target.created_by,'offer','ملک پیشنهادی برای درخواست شما',link=f'/offers?offer={offer.pk}');audit(request.user,'offer.created','offer',offer.pk,property=target)
        return envelope({'id':offer.pk,'request_id':target.pk,'property_id':row.pk,'message':offer.message},code=201 if created else 200)

class PropertyChatView(APIView):
    permission_classes=[IsAuthenticated]
    @transaction.atomic
    def post(self,request,pk):
        feature('chats');row=view_property(request.user,pk);expert=row.assigned_expert or row.created_by
        if expert.pk==request.user.pk:raise ValidationError('امکان گفت‌وگو با خودتان وجود ندارد.')
        from .models import ChatBlock
        from accounts.models import AccountPreferences
        pref=AccountPreferences.objects.filter(user=expert).first()
        a,b=sorted([request.user.pk,expert.pk])
        if pref and not pref.privacy.get('allow_new_conversations',True) and not DirectConversation.objects.filter(user1_id=a,user2_id=b).exists():raise PermissionDenied('این کاربر گفتگوی جدید را غیرفعال کرده است.')
        if ChatBlock.objects.filter(Q(blocker=request.user,blocked=expert)|Q(blocker=expert,blocked=request.user)).exists():raise PermissionDenied('این گفتگو امکان‌پذیر نیست.')
        pair=sorted([request.user.pk,expert.pk]);chat,_=DirectConversation.objects.get_or_create(user1_id=pair[0],user2_id=pair[1])
        PropertyChat.objects.get_or_create(property=row,user=request.user,defaults={'conversation':chat})
        return envelope({'chat_id':chat.pk,'property_id':row.pk})

class ArchiveView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('archives')
        from .estate_activity_api import visible,serialize
        properties=scope(request.user).filter(archived_at__isnull=False)
        activities=[x for x in visible(request.user) if x.data.get('archive')]
        data=[{'entity_type':'property',**property_serialize(x)} for x in properties]+[{'entity_type':'activity',**serialize(x)} for x in activities]
        from .models import ConversationArchive
        data += [{'id':x.conversation_id,'entity_type':'conversation','title':'گفتگوی بایگانی‌شده','created_at':x.archived_at.isoformat()} for x in ConversationArchive.objects.filter(user=request.user)]
        search=normalize(request.query_params.get('search',''))
        if search:data=[r for r in data if search in normalize(str(r))]
        return envelope({'results':data[:200],'total_results':len(data)})
    @transaction.atomic
    def post(self,request):
        feature('archives');kind=request.data.get('entity_type');pk=ident(request.data.get('id'));archived=request.data.get('archived')
        if not isinstance(archived,bool):raise ValidationError('وضعیت بایگانی معتبر نیست.')
        if kind=='property':
            row=get_object_or_404(scope(request.user).select_for_update(of=('self',)),pk=pk)
            if row.created_by_id!=request.user.pk:can_manage(request.user,row)
            row.archived_at=timezone.now() if archived else None
            if archived:row.publication_state='draft'
            row.save(update_fields=['archived_at','publication_state','updated_at'])
        elif kind=='activity':
            from .estate_activity_api import visible,can_write
            can_write(request.user);row=get_object_or_404(visible(request.user).select_for_update(of=('self',)),pk=pk)
            if row.created_by_id!=request.user.pk and not is_superadmin(request.user):raise PermissionDenied()
            row.data={**row.data,'archive':archived};row.save(update_fields=['data','updated_at'])
        elif kind=='conversation':
            from .models import ConversationArchive
            chat=get_object_or_404(DirectConversation.objects.filter(Q(user1=request.user)|Q(user2=request.user)),pk=pk)
            if archived:ConversationArchive.objects.get_or_create(conversation=chat,user=request.user)
            else:ConversationArchive.objects.filter(conversation=chat,user=request.user).delete()
        else:raise ValidationError('نوع بایگانی معتبر نیست.')
        audit(request.user,'archive.changed',kind,pk,status='archived' if archived else 'restored')
        return envelope({'id':pk,'archived':archived})

class RoutingSettingsView(APIView):
    permission_classes=[IsAuthenticated]
    def check(self,user):
        if not is_superadmin(user):raise PermissionDenied('تنظیمات توزیع فقط برای سوپرادمین مجاز است.')
    def get(self,request):self.check(request.user);return envelope(policy())
    @transaction.atomic
    def put(self,request):
        self.check(request.user);d=request.data;allowed=set(ROUTING_DEFAULTS)|{'market_office_id'}
        if set(d)-allowed:raise ValidationError('فیلد تنظیمات توزیع معتبر نیست.')
        result={**policy(),**d}
        for key in ('enabled','notifications'):
            if not isinstance(result[key],bool):raise ValidationError('مقدار فعال‌سازی معتبر نیست.')
        if result['mode'] not in ('round_robin','market'):raise ValidationError('حالت توزیع معتبر نیست.')
        for key,maximum in [('response_minutes',1440),('max_attempts',1000)]:
            if isinstance(result[key],bool) or not isinstance(result[key],int) or not 1<=result[key]<=maximum:raise ValidationError('تایمر یا حداکثر تلاش خارج از محدوده است.')
        if not isinstance(result['geographic_priority'],list) or set(result['geographic_priority'])!={'neighborhood','district','city','province','other'} or len(result['geographic_priority'])!=5:raise ValidationError('اولویت جغرافیایی باید شامل هر پنج مرحله بدون تکرار باشد.')
        if not isinstance(result['expert_order'],list) or len(result['expert_order'])>1000 or any(not isinstance(x,int) for x in result['expert_order']):raise ValidationError('ترتیب کارشناسان معتبر نیست.')
        if result.get('market_office_id'):get_object_or_404(User,pk=ident(result['market_office_id']),role='agency',is_active=True)
        obj,_=PanelSettings.objects.select_for_update(of=('self',)).get_or_create(pk=1);cfg=dict(obj.data or {});wf=dict(cfg.get('workflow',{}));wf['routing']=result;cfg['workflow']=wf;obj.data=cfg;obj.save();cache.delete('mlkino:system-settings');audit(request.user,'routing.settings.changed','settings',1)
        return envelope(result)

class BusinessRolesView(APIView):
    permission_classes=[IsAuthenticated]
    def check(self,user):
        if not is_superadmin(user):raise PermissionDenied('مدیریت نقش تکمیلی فقط برای سوپرادمین مجاز است.')
    def get(self,request):
        self.check(request.user)
        return envelope({'results':list(UserBusinessRole.objects.values('id','user_id','workspace_id','role')),'users':[{'id':u.pk,'name':u.full_name or u.phone} for u in User.objects.filter(is_active=True)[:1000]],'workspaces':[{'id':u.pk,'name':getattr(getattr(u,'agency_profile',None),'agency_name',u.full_name)} for u in User.objects.filter(role='agency',is_active=True).select_related('agency_profile')],'total_results':UserBusinessRole.objects.count()})
    @transaction.atomic
    def post(self,request):
        self.check(request.user);u=get_object_or_404(User,pk=ident(request.data.get('user_id')));ws=get_object_or_404(User,pk=ident(request.data.get('workspace_id')),role='agency')
        roles=request.data.get('roles')
        if not isinstance(roles,list) or not set(roles)<={'owner','buyer','landlord','tenant','finance'}:raise ValidationError('نقش معتبر نیست.')
        UserBusinessRole.objects.filter(user=u,workspace=ws).exclude(role__in=roles).delete()
        for role in set(roles):UserBusinessRole.objects.get_or_create(user=u,workspace=ws,role=role)
        audit(request.user,'roles.business.changed','user',u.pk);return envelope({'user_id':u.pk,'workspace_id':ws.pk,'roles':roles})

class WorkflowOverviewView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        from .finance_api import finance_scope
        from .estate_activity_api import visible
        return envelope({'counts':{'contacts':contact_scope(request.user).count(),'assignments':referral_scope(request.user).count(),'pending_assignments':referral_scope(request.user).filter(status='pending').count(),'visits':visit_scope(request.user).count(),'finance':finance_scope(request.user).count(),'files':scope(request.user).filter(kind='file').count(),'requests':scope(request.user).filter(kind='request').count(),'contracts':visible(request.user).filter(kind='contracts').count()},'permissions':{'manage_routing':is_superadmin(request.user),'manage_crm':is_superadmin(request.user) or request.user.role in ('agency','expert')},'market_name':'بازار املاک ملکینو'})

class ActivityAttachmentView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,pk):
        from .estate_activity_api import visible
        from django.http import FileResponse,Http404
        row=get_object_or_404(visible(request.user),pk=pk)
        if not row.attachment:raise Http404
        response=FileResponse(row.attachment.open('rb'),as_attachment=True,filename='attachment'+__import__('pathlib').Path(row.attachment.name).suffix,content_type='application/octet-stream')
        response['Cache-Control']='private, no-store';response['X-Content-Type-Options']='nosniff';response['Content-Security-Policy']="sandbox; default-src 'none'";return response
    @transaction.atomic
    def post(self,request,pk):
        from .estate_activity_api import visible,can_write
        can_write(request.user);row=get_object_or_404(visible(request.user).select_for_update(of=('self',)),pk=pk)
        if row.created_by_id!=request.user.pk and row.assigned_expert_id!=request.user.pk and not is_superadmin(request.user) and row.office_id!=request.user.pk:raise PermissionDenied()
        upload=request.FILES.get('attachment')
        if not upload:raise ValidationError('پیوست را انتخاب کنید.')
        from accounts.media_processing import sanitized_document
        row.attachment=sanitized_document(upload);row.save(update_fields=['attachment','updated_at']);audit(request.user,'activity.attachment.saved','activity',row.pk)
        return envelope({'id':row.pk,'attachment_url':f'/panel/workflows/activities/{row.pk}/attachment/'})

class SavedFiltersView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        from .models import SavedReportFilter
        return envelope({'results':list(SavedReportFilter.objects.filter(user=request.user).values('id','name','report','filters'))})
    def post(self,request):
        from .models import SavedReportFilter
        import json
        name=request.data.get('name');report=request.data.get('report');filters=request.data.get('filters')
        if not isinstance(name,str) or not 1<=len(name.strip())<=100 or report not in ('operations','agencies','experts','finance') or not isinstance(filters,dict) or len(json.dumps(filters))>10000:raise ValidationError('فیلتر ذخیره‌شده معتبر نیست.')
        allowed={'date_from','date_to','period','province','city','district','neighborhood','expert','agency','status','priceFrom','priceTo','areaFrom','areaTo','search','expertCountFrom','expertCountTo','license','filters','report','group_by','ordering'}
        if set(filters)-allowed:raise ValidationError('فیلد فیلتر معتبر نیست.')
        row,_=SavedReportFilter.objects.update_or_create(user=request.user,name=name.strip(),defaults={'report':report,'filters':filters})
        return envelope({'id':row.pk,'name':row.name,'report':row.report,'filters':row.filters},code=201)
    def delete(self,request,pk):
        from .models import SavedReportFilter
        row=get_object_or_404(SavedReportFilter,user=request.user,pk=pk);row.delete();return envelope({'deleted':True})


class PropertyContactView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,pk):
        row=view_property(request.user,pk)
        phone=row.data.get('work_phone') or row.data.get('workPhone')
        if not phone:raise ValidationError('شماره کاری برای این ملک ثبت نشده است؛ از گفتگو استفاده کنید.')
        from accounts.validators import validate_iranian_mobile
        try:phone=validate_iranian_mobile(phone)
        except Exception:raise ValidationError('شماره کاری قابل تماس نیست؛ با پشتیبانی تماس بگیرید.')
        response=envelope({'phone':phone,'property_id':row.pk});response['Cache-Control']='private, no-store';return response

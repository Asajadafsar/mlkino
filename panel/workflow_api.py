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
from .models import (PropertyRecord,AgencyExpertLink,CRMContact,ExpertPermission,PropertyPin,PropertyReferral,PropertyFavorite,VisitSlot,PropertyVisit,VisitAssignment,PropertyOffer,UserBusinessRole,PropertyChat,DirectConversation,EstateActivity,FinancialDocument,ExpertShareAgreement)
from .settings_api import envelope,is_superadmin
from .settings_models import PanelSettings
from .workflow_services import (workspaces,workspace,audit,feature,dispatch,respond,policy,ROUTING_DEFAULTS,
    EXPERT_PERMISSION_DEFAULTS,expert_permissions,require_expert_permission,touch_contact,dispatch_visit,respond_visit,
    visit_office_id,calculate_visit_commission)
from .property_api import scope,serialize as property_serialize,validate_payload,normalize
from .public_api import public_serialize,public_rows
from .finance_api import money
from .workflow_pagination import filtered,paginate

def ident(value):
    try:
        assert not isinstance(value,(bool,float)) and str(value).isdigit()
        n=int(value);assert n>0
    except (ValueError,TypeError,AssertionError):raise ValidationError('شناسه معتبر انتخاب کنید.')
    return n
def results(qs,serialize,request):return paginate(filtered(qs,request),request,serialize)
def can_manage(user,row):
    if not is_superadmin(user) and user.role not in ('agency','expert'):raise PermissionDenied('مدیریت حرفه‌ای این پرونده برای نقش شما مجاز نیست.')
    if not is_superadmin(user) and not scope(user).filter(pk=row.pk).exists():raise PermissionDenied('این پرونده در محدوده دفتر شما نیست.')
    if not(is_superadmin(user) or row.assigned_expert_id==user.pk or row.created_by_id==user.pk and user.role in ('expert','agency') or user.role=='agency' and row.office_id==user.pk):raise PermissionDenied('مدیریت این پرونده مجاز نیست.')
def view_property(user,pk):
    row=get_object_or_404(PropertyRecord.objects.select_related('assigned_expert','created_by','office'),pk=pk)
    if not public_rows().filter(pk=pk).exists() and not scope(user).filter(pk=pk).exists():raise PermissionDenied('این ملک قابل مشاهده نیست.')
    return row

def contact_scope(user):
    qs=CRMContact.objects.select_related('workspace','expert','user')
    if is_superadmin(user):return qs
    if user.role=='agency':return qs.filter(workspace=user)
    granted=UserBusinessRole.objects.filter(user=user,role='finance').values_list('workspace_id',flat=True)
    if user.role=='expert':return qs.filter(Q(expert=user,workspace_id__in=workspaces(user))|Q(workspace=user)|Q(workspace_id__in=granted))
    return qs.filter(workspace_id__in=granted)
def contact_json(r):
    properties=[{'id':row.pk,'kind':row.kind,'title':row.data.get('title') or row.data.get('propertyType','ملک'),'contractType':row.data.get('contractType'),'city':row.data.get('city'),'source':row.data.get('source','panel'),'publication_state':row.publication_state,'updated_at':row.updated_at.isoformat()} for row in r.properties.all()[:100]]
    return {'id':r.pk,'name':r.name,'full_name':r.name,'phone':r.phone,'phone2':r.phone2,'job':r.job,'national_code':r.national_code,'roles':r.roles,'kind':('lessor' if r.roles[0]=='landlord' else r.roles[0]) if r.roles else 'owner','office_id':r.workspace_id,'workspace_id':r.workspace_id,'expert_id':r.expert_id,'user_id':r.user_id,'created_at':r.created_at.isoformat(),'properties':[x['id'] for x in properties],'property_records':properties,'file_count':sum(x['kind']=='file' for x in properties),'request_count':sum(x['kind']=='request' for x in properties),'activities':list(r.estate_activities.values_list('id',flat=True)),**r.data}

class ContactsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,pk=None):
        feature('crm');qs=contact_scope(request.user)
        if request.user.role=='expert':require_expert_permission(request.user,'can_manage_contacts')
        if pk:return envelope(contact_json(get_object_or_404(qs,pk=pk)))
        national=normalize(request.query_params.get('national_code')).replace(' ','')
        if national:
            if not re.fullmatch(r'\d{10}',national):raise ValidationError({'national_code':'کد ملی باید ۱۰ رقم باشد.'})
            rows=list(qs.filter(national_code=national))
            return envelope({'results':[contact_json(x) for x in rows],'total_results':len(rows),'exists':bool(rows)})
        if request.query_params.get('search'):qs=qs.filter(Q(name__icontains=request.query_params['search'])|Q(phone__icontains=request.query_params['search']))
        rows=list(qs)
        kind=request.query_params.get('kind') or request.query_params.get('role')
        if kind:rows=[x for x in rows if ('landlord' if kind=='lessor' else kind) in x.roles]
        return envelope(paginate(rows,request,contact_json))
    def post(self,request):return self.save(request)
    def patch(self,request,pk):return self.save(request,pk)
    @transaction.atomic
    def save(self,request,pk=None):
        feature('crm')
        if request.user.role not in ('agency','expert') and not is_superadmin(request.user):raise PermissionDenied('مدیریت CRM برای این نقش مجاز نیست.')
        if request.user.role=='expert':require_expert_permission(request.user,'can_manage_contacts')
        d=request.data;allowed={'name','full_name','phone','phone2','job','national_code','roles','kind','email','notes','province','city','district','neighborhood','budget_min','budget_max','expert_id','user_id','workspace_id'}
        if set(d)-allowed:raise ValidationError('فیلد CRM معتبر نیست.')
        row=get_object_or_404(contact_scope(request.user).select_for_update(of=('self',)),pk=pk) if pk else None
        name=d.get('name',d.get('full_name',row.name if row else ''));phone=normalize(d.get('phone',row.phone if row else '')).replace(' ','').replace('-','')
        if not isinstance(name,str) or not 2<=len(name.strip())<=200 or not re.fullmatch(r'\+?\d{8,15}',phone):raise ValidationError('نام و شماره تماس معتبر وارد کنید.')
        roles=d.get('roles')
        if roles is None:roles=[{'lessor':'landlord'}.get(d['kind'],d['kind'])] if d.get('kind') else row.roles if row else ['owner']
        if not isinstance(roles,list) or not roles or not set(roles)<={'owner','buyer','landlord','tenant','expert'}:raise ValidationError('نوع مخاطب معتبر نیست.')
        ws=ident(d.get('workspace_id') or (row.workspace_id if row else workspace(request.user)))
        get_object_or_404(User.objects.select_for_update(of=('self',)),pk=ws)
        if ws not in workspaces(request.user) and not is_superadmin(request.user):raise PermissionDenied('دفتر متعلق به شما نیست.')
        staff_user=None
        if 'expert' in roles:
            if row and 'expert' in row.roles and row.user_id and row.phone==phone:staff_user=row.user
            else:
                staff_user=User.objects.filter(phone=phone,role='expert').first()
                if not staff_user or not AgencyExpertLink.objects.filter(agency_id=ws,expert=staff_user).exists():raise ValidationError('کارشناس طرف حساب باید عضو همین دفتر باشد.')
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
        national=normalize(d.get('national_code',row.national_code if row else '')).replace(' ','') or None
        if national:
            from accounts.validators import validate_iranian_national_code
            try:national=validate_iranian_national_code(national)
            except Exception:raise ValidationError({'national_code':'کد ملی معتبر ۱۰ رقمی وارد کنید.'})
        phone2=normalize(d.get('phone2',row.phone2 if row else '')).replace(' ','').replace('-','')
        if phone2 and not re.fullmatch(r'\+?\d{8,15}',phone2):raise ValidationError({'phone2':'تلفن دوم معتبر وارد کنید.'})
        job=d.get('job',row.job if row else '')
        if not isinstance(job,str) or len(job)>200:raise ValidationError({'job':'شغل معتبر وارد کنید.'})
        if row is None:
            row=(CRMContact.objects.filter(workspace_id=ws,national_code=national).first() if national else None) or CRMContact.objects.filter(workspace_id=ws,phone=phone).first()
            if row:roles=list(set(row.roles+roles))
            else:row=CRMContact(workspace_id=ws,phone=phone)
        if row.pk and CRMContact.objects.filter(workspace_id=ws,phone=phone).exclude(pk=row.pk).exists():raise ValidationError('این شماره قبلاً در دفتر ثبت شده است؛ مخاطب موجود را ویرایش کنید.')
        if national and CRMContact.objects.filter(workspace_id=ws,national_code=national).exclude(pk=row.pk).exists():raise ValidationError('این کد ملی قبلاً در همین دفتر ثبت شده است؛ همان مخاطب را انتخاب کنید.')
        row.name=name.strip();row.phone=phone;row.phone2=phone2;row.job=job.strip();row.national_code=national;row.roles=roles;row.expert_id=expert_id;row.data=metadata
        if d.get('user_id'):
            u=get_object_or_404(User,pk=ident(d['user_id']))
            if u.phone!=phone:raise ValidationError('شماره حساب با مخاطب مطابقت ندارد.')
            row.user=u
        if staff_user:row.user=staff_user
        row.save();audit(request.user,'crm.saved','contact',row.pk)
        return envelope(contact_json(row),code=200 if pk else 201)

def referral_scope(user):
    qs=PropertyReferral.objects.select_related('property','expert')
    if is_superadmin(user):return qs
    if user.role=='agency':return qs.filter(Q(property__office=user)|Q(expert_id__in=AgencyExpertLink.objects.filter(agency=user).values('expert_id')))
    if user.role=='expert':return qs.filter(Q(expert=user)|Q(property__created_by=user))
    return qs.filter(property_id__in=scope(user).values('pk'))
def referral_json(r):return {'id':r.pk,'property_id':r.property_id,'property_title':r.property.data.get('title') or r.property.data.get('propertyType','ملک'),'expert_id':r.expert_id,'expert_name':r.expert.full_name if r.expert else 'بازار املاک ملکینو','status':r.status,'expires_at':r.expires_at.isoformat() if r.expires_at else None,'attempt':r.attempt,'created_at':r.created_at.isoformat(),'history':[{'event':e.event,'actor_id':e.actor_id,'created_at':e.created_at.isoformat()} for e in r.property.workflow_events.all()[:100]]}
class AssignmentsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('assignments');qs=referral_scope(request.user)
        if request.query_params.get('status'):qs=qs.filter(status=request.query_params['status'])
        if request.query_params.get('kind') in ('file','request'):qs=qs.filter(property__kind=request.query_params['kind'])
        if request.query_params.get('source') in ('landing','panel'):qs=qs.filter(property__data__source=request.query_params['source'])
        return envelope(results(qs,referral_json,request))
class AssignmentRespondView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,pk):
        feature('assignments');referral=get_object_or_404(referral_scope(request.user),pk=pk)
        if request.user.role=='expert':require_expert_permission(request.user,'can_manage_files' if referral.property.kind=='file' else 'can_manage_requests')
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
        feature('files');d=validate_payload(request,'file');d['requesterType']='owner';d['ownerSubmission']=True;d['source']='landing'
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
        if request.user.role=='expert':require_expert_permission(request.user,'can_publish',row.office_id)
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
        if request.query_params.get('ids')=='true':return envelope({'ids':list(qs.values_list('property_id',flat=True))})
        return envelope(results(qs,lambda r:{'id':r.pk,'property_id':r.property_id,'property':public_serialize(r.property)},request))
    def post(self,request):
        feature('favorites');row=get_object_or_404(public_rows(),pk=ident(request.data.get('property_id')))
        fav,created=PropertyFavorite.objects.get_or_create(user=request.user,property=row)
        return envelope({'id':fav.pk,'property_id':row.pk},code=201 if created else 200)
    def delete(self,request,pk):
        feature('favorites');PropertyFavorite.objects.filter(user=request.user,property_id=pk).delete();return envelope({'deleted':True})

class PropertyPinView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,pk):
        row=get_object_or_404(scope(request.user),pk=pk)
        if request.user.role=='expert':require_expert_permission(request.user,'can_manage_files' if row.kind=='file' else 'can_manage_requests',row.office_id)
        pin,created=PropertyPin.objects.get_or_create(user=request.user,property=row)
        audit(request.user,'property.pinned','property_pin',pin.pk,property=row)
        return envelope({'property_id':row.pk,'pinned':True},code=201 if created else 200)
    def delete(self,request,pk):
        row=get_object_or_404(scope(request.user),pk=pk)
        PropertyPin.objects.filter(user=request.user,property=row).delete()
        audit(request.user,'property.unpinned','property',row.pk,property=row)
        return envelope({'property_id':row.pk,'pinned':False})

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
        return envelope(results(qs,slot_json,request))
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
    qs=PropertyVisit.objects.select_related('slot__property__office__agency_profile','visitor','visitor_contact','slot__expert','assigned_expert')
    if is_superadmin(user):return qs
    if user.role=='expert':return qs.filter(Q(visitor=user)|Q(visitor_contact__user=user)|Q(assignments__expert=user,assignments__status='pending')|Q(assigned_expert=user,status__in=['confirmed','completed'])).distinct()
    if user.role=='agency':return qs.filter(Q(visitor=user)|Q(slot__property__office=user))
    return qs.filter(Q(visitor=user)|Q(visitor_contact__user=user)|Q(slot__property__created_by=user)|Q(slot__property__crm_contacts__user=user)).distinct()
def visit_json(r):
    expert=r.assigned_expert or r.slot.expert;office=getattr(r.slot.property,'office',None);profile=getattr(office,'agency_profile',None) if office else None
    timeline=[{'attempt':a.attempt,'expert_id':a.expert_id,'expert_name':a.expert.full_name or a.expert.phone,'status':a.status,'expires_at':a.expires_at.isoformat(),'created_at':a.created_at.isoformat()} for a in r.assignments.select_related('expert').all()]
    total=r.owner_commission+r.buyer_commission
    return {'id':r.pk,'slot_id':r.slot_id,'property_id':r.slot.property_id,'property_title':r.slot.property.data.get('title') or r.slot.property.data.get('propertyType','ملک'),'visitor_name':r.visitor_name or (r.visitor.full_name if r.visitor else r.visitor_contact.name if r.visitor_contact else ''),'visitor_phone':r.visitor_phone or (r.visitor.phone if r.visitor else r.visitor_contact.phone if r.visitor_contact else ''),'preferred_days':r.preferred_days,'preferred_time':r.preferred_time,'notes':r.notes,'user_id':r.visitor_id,'contact_id':r.visitor_contact_id,'expert_id':expert.pk if expert else None,'expert_name':expert.full_name if expert else None,'expert_avatar':f'/accounts/avatar/{expert.pk}/' if expert and expert.avatar else None,'office_id':office.pk if office else None,'office_name':getattr(profile,'agency_name',None),'office_address':getattr(profile,'office_address',None),'starts_at':r.slot.starts_at.isoformat(),'ends_at':r.slot.ends_at.isoformat(),'status':r.status,'expires_at':r.expires_at.isoformat() if r.expires_at else None,'result':r.result,'status_description':r.status_description,'next_follow_up_at':r.next_follow_up_at.isoformat() if r.next_follow_up_at else None,'owner_commission':str(r.owner_commission),'buyer_commission':str(r.buyer_commission),'commission_total':str(total),'expert_share':str(r.expert_share),'office_share':str(r.office_share),'timeline':timeline,'created_at':r.created_at.isoformat()}
class VisitsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('visits');qs=visit_scope(request.user)
        if request.query_params.get('property_id'):qs=qs.filter(slot__property_id=ident(request.query_params['property_id']))
        return envelope(results(qs,visit_json,request))
    @transaction.atomic
    def post(self,request):
        feature('visits');User.objects.select_for_update(of=('self',)).get(pk=request.user.pk)
        professional=request.user.role in ('expert','agency','superadmin') or is_superadmin(request.user)
        if request.user.role=='expert':require_expert_permission(request.user,'can_manage_visits')
        if request.data.get('slot_id'):
            slot=get_object_or_404(VisitSlot.objects.select_for_update(of=('self',)).select_related('property'),pk=ident(request.data.get('slot_id')),active=True)
        elif professional:
            property_row=get_object_or_404(PropertyRecord.objects.select_for_update(of=('self',)),pk=ident(request.data.get('property_id')),kind='file')
            can_manage(request.user,property_row)
            start=parse_datetime(str(request.data.get('starts_at','')));end=parse_datetime(str(request.data.get('ends_at','')))
            if not start or not end or timezone.is_naive(start) or timezone.is_naive(end) or end<=start:raise ValidationError('زمان بازدید معتبر وارد کنید.')
            slot=VisitSlot.objects.create(property=property_row,expert=property_row.assigned_expert or request.user,starts_at=start,ends_at=end,capacity=50)
        else:raise ValidationError('زمان آزاد بازدید را انتخاب کنید.')
        view_property(request.user,slot.property_id)
        if slot.starts_at<=timezone.now():raise ValidationError('زمان انتخاب‌شده گذشته است.')
        old=slot.bookings.filter(visitor=request.user,status__in=['pending','confirmed']).first() if not professional else None
        if old:return envelope(visit_json(old))
        if slot.bookings.filter(status__in=['pending','confirmed']).count()>=slot.capacity:raise ValidationError('ظرفیت این بازه تکمیل شده است.')
        if not professional and PropertyVisit.objects.filter(visitor=request.user,status__in=['pending','confirmed'],slot__starts_at__lt=slot.ends_at,slot__ends_at__gt=slot.starts_at).exists():raise ValidationError('با بازدید دیگری که رزرو کرده‌اید تداخل دارد.')
        name=request.data.get('visitor_name') or request.user.full_name or 'کاربر ملکینو';phone=normalize(request.data.get('visitor_phone') or request.user.phone).replace(' ','').replace('-','')
        if not isinstance(name,str) or not 2<=len(name.strip())<=200 or not re.fullmatch(r'09\d{9}',phone):raise ValidationError('نام و شماره تماس خریدار را معتبر وارد کنید.')
        days=request.data.get('preferred_days',[])
        if isinstance(days,str):days=[days]
        if not isinstance(days,list) or len(days)>14 or any(not isinstance(x,str) or len(x)>50 for x in days):raise ValidationError('روزهای مناسب بازدید معتبر نیست.')
        preferred=request.data.get('preferred_time','');notes=request.data.get('notes','')
        if not isinstance(preferred,str) or len(preferred)>100 or not isinstance(notes,str) or len(notes)>3000:raise ValidationError('زمان یا توضیحات بازدید معتبر نیست.')
        contact=None;visitor=None if professional else request.user
        if professional:
            contact_id=request.data.get('contact_id')
            if contact_id:contact=get_object_or_404(contact_scope(request.user),pk=ident(contact_id))
            else:contact=CRMContact.objects.filter(workspace_id=slot.property.office_id or workspace(request.user),phone=phone).first()
            visitor=contact.user if contact and contact.user_id else None
        row=PropertyVisit.objects.create(slot=slot,visitor=visitor,visitor_contact=contact,visitor_name=name.strip(),visitor_phone=phone,preferred_days=days,preferred_time=preferred.strip(),notes=notes.strip());audit(request.user,'visit.booked','visit',row.pk,property=slot.property)
        dispatch_visit(row.pk,request.user)
        return envelope(visit_json(row),code=201)
    @transaction.atomic
    def patch(self,request,pk):
        feature('visits');row=get_object_or_404(visit_scope(request.user).select_for_update(of=('self',)),pk=pk)
        if request.data.get('decision'):
            row=respond_visit(row.pk,request.user,request.data.get('decision'))
            return envelope(visit_json(PropertyVisit.objects.get(pk=row.pk)))
        if request.data.get('result'):
            if request.user.role=='expert':require_expert_permission(request.user,'can_manage_visits',visit_office_id(row))
            manager=is_superadmin(request.user) or request.user.role=='agency' and row.slot.property.office_id==request.user.pk or row.assigned_expert_id==request.user.pk
            if not manager or row.status!='confirmed':raise PermissionDenied('ثبت روند فقط برای مسئول بازدید تأییدشده مجاز است.')
            result=request.data.get('result')
            if result not in ('liked','disliked','follow_up'):raise ValidationError('نتیجه بازدید معتبر نیست.')
            description=request.data.get('description','')
            if not isinstance(description,str) or not description.strip() or len(description)>5000:raise ValidationError('توضیحات و نظر مشتری را وارد کنید.')
            row.result=result;row.status_description=description.strip();row.status='completed'
            row.next_follow_up_at=None
            if result=='follow_up':
                follow=parse_datetime(str(request.data.get('next_follow_up_at','')))
                if not follow or timezone.is_naive(follow) or follow<=timezone.now():raise ValidationError('تاریخ پیگیری بعدی باید در آینده باشد.')
                row.next_follow_up_at=follow
            if result=='liked':
                row.owner_commission=money(request.data.get('owner_commission',0));row.buyer_commission=money(request.data.get('buyer_commission',0))
                calculate_visit_commission(row)
            row.save(update_fields=['result','status_description','status','next_follow_up_at','owner_commission','buyer_commission','expert_share','office_share','updated_at'])
            if result=='follow_up':
                activity=EstateActivity.objects.create(kind='follow-ups',created_by=request.user,property=row.slot.property,assigned_expert=row.assigned_expert,office=row.slot.property.office,data={'file_name':row.slot.property.data.get('title') or row.slot.property.data.get('propertyType','ملک'),'status':'نیازمند اقدام','description':description.strip(),'due_at':follow.isoformat(),'visit_id':row.pk})
                if row.visitor_contact_id:activity.parties.add(row.visitor_contact)
            audit(request.user,'visit.result','visit',row.pk,property=row.slot.property,status=result)
            if row.visitor:notify(row.visitor,'visit','نتیجه بازدید ثبت شد.',link=f'/visits?visit={row.pk}')
            notify(row.slot.property.created_by,'visit','روند بازدید فایل شما به‌روزرسانی شد.',link=f'/visits?visit={row.pk}')
            return envelope(visit_json(row))
        status=request.data.get('status')
        if status not in ('confirmed','rejected','cancelled'):raise ValidationError('وضعیت بازدید معتبر نیست.')
        manager=is_superadmin(request.user) or request.user.role=='expert' and row.assigned_expert_id==request.user.pk or request.user.role=='agency' and row.slot.property.office_id==request.user.pk
        if not manager and status!='cancelled':raise PermissionDenied('فقط مسئول پرونده می‌تواند بازدید را تأیید یا رد کند.')
        if row.status in ('cancelled','rejected') and status!=row.status:raise ValidationError('بازدید بسته‌شده را دوباره رزرو کنید.')
        row.status=status;row.save(update_fields=['status','updated_at']);audit(request.user,'visit.changed','visit',row.pk,property=row.slot.property,status=status)
        if row.visitor:notify(row.visitor,'visit','وضعیت بازدید تغییر کرد',link=f'/visits?visit={row.pk}')
        return envelope(visit_json(row))

class OffersView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('offers');qs=PropertyOffer.objects.select_related('request','property','created_by')
        if not is_superadmin(request.user):qs=qs.filter(Q(created_by=request.user)|Q(request__created_by=request.user)|Q(request__assigned_expert=request.user))
        return envelope(results(qs,lambda r:{'id':r.pk,'request_id':r.request_id,'property_id':r.property_id,'message':r.message,'created_by':r.created_by_id,'created_at':r.created_at.isoformat(),'property':public_serialize(r.property)},request))
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
        return envelope(paginate(data,request))
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

class ExpertPermissionsView(APIView):
    permission_classes=[IsAuthenticated]
    allowed=set(EXPERT_PERMISSION_DEFAULTS)
    def context(self,request,expert_id):
        expert=get_object_or_404(User,pk=expert_id,role='expert')
        if is_superadmin(request.user):
            workspace_id=ident(request.query_params.get('workspace_id') or request.data.get('workspace_id') or AgencyExpertLink.objects.filter(expert=expert).values_list('agency_id',flat=True).first())
        else:
            if request.user.role!='agency':raise PermissionDenied('تنظیم اختیارات فقط برای مدیر دفتر مجاز است.')
            workspace_id=request.user.pk
        if not AgencyExpertLink.objects.filter(agency_id=workspace_id,expert=expert).exists():raise PermissionDenied('این کارشناس عضو دفتر انتخاب‌شده نیست.')
        return expert,workspace_id
    def response(self,expert,workspace_id):
        values=expert_permissions(expert,workspace_id);profile=getattr(expert,'expert_profile',None)
        return {'expert_id':expert.pk,'workspace_id':workspace_id,'permissions':values,'expert_share_percent':str(profile.commission_share_rate) if profile and profile.commission_share_rate is not None else '0'}
    def get(self,request,expert_id):
        expert,workspace_id=self.context(request,expert_id);return envelope(self.response(expert,workspace_id))
    @transaction.atomic
    def patch(self,request,expert_id):
        expert,workspace_id=self.context(request,expert_id);values=request.data.get('permissions')
        if not isinstance(values,dict) or set(values)!=self.allowed or any(not isinstance(v,bool) for v in values.values()):raise ValidationError('همه اختیارات کارشناس را با مقدار روشن یا خاموش ارسال کنید.')
        row,_=ExpertPermission.objects.update_or_create(workspace_id=workspace_id,expert=expert,defaults={'permissions':values,'updated_by':request.user})
        if 'expert_share_percent' in request.data:
            from accounts.models import ExpertProfile
            percent=money(request.data['expert_share_percent'])
            if percent>100:raise ValidationError('سهم کارشناس باید بین صفر تا صد درصد باشد.')
            profile,_=ExpertProfile.objects.get_or_create(user=expert);profile.commission_share_rate=percent;profile.save(update_fields=['commission_share_rate','updated_at'])
            latest=ExpertShareAgreement.objects.filter(workspace_id=workspace_id,expert=expert,valid_from__lte=timezone.localdate()).order_by('-valid_from','-id').first()
            if not latest or latest.share_percent!=percent:
                ExpertShareAgreement.objects.create(workspace_id=workspace_id,expert=expert,share_percent=percent,valid_from=timezone.localdate())
        audit(request.user,'expert.permissions.changed','expert_permission',row.pk,status='updated')
        return envelope(self.response(expert,workspace_id))

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

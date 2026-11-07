import uuid
from datetime import timedelta
from django.db import transaction
from django.db.models import Q,Count
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied,ValidationError
from accounts.models import User,ActivityLog
from accounts.notices import notify
from .models import (AgencyExpertLink,PropertyRecord,PropertyReferral,WorkflowEvent,CRMContact,
    UserBusinessRole,ExpertPermission,PropertyVisit,VisitAssignment,ExpertShareAgreement)
from .settings_api import is_superadmin
from .settings_runtime import system_settings
from .property_api import normalize

ROUTING_DEFAULTS={'enabled':True,'mode':'round_robin','response_minutes':20,'max_attempts':20,'geographic_priority':['neighborhood','district','city','province','other'],'expert_order':[],'notifications':True}
EXPERT_PERMISSION_DEFAULTS={
    'can_manage_files':True,'can_manage_requests':True,'can_manage_visits':True,
    'can_manage_contacts':True,'can_manage_followups':True,'can_manage_finance':True,
    'can_publish':True,
}
def policy():return {**ROUTING_DEFAULTS,**system_settings().get('workflow',{}).get('routing',{})}
def feature(key):
    if system_settings().get('features',{}).get(key,True) is False:raise PermissionDenied('این قابلیت توسط مدیر غیرفعال شده است.')
def workspaces(user):
    return {user.pk,*AgencyExpertLink.objects.filter(expert=user).values_list('agency_id',flat=True),*UserBusinessRole.objects.filter(user=user,role='finance').values_list('workspace_id',flat=True)}
def workspace(user):
    if user.role=='expert':return AgencyExpertLink.objects.filter(expert=user).order_by('id').values_list('agency_id',flat=True).first() or user.pk
    return UserBusinessRole.objects.filter(user=user,role='finance').order_by('id').values_list('workspace_id',flat=True).first() or user.pk

def expert_permissions(user,workspace_id=None):
    """Return an explicit office policy while keeping old offices backwards compatible."""
    if user.role!='expert':return dict(EXPERT_PERMISSION_DEFAULTS)
    workspace_id=workspace_id or workspace(user)
    row=ExpertPermission.objects.filter(workspace_id=workspace_id,expert=user).first()
    values=dict(EXPERT_PERMISSION_DEFAULTS)
    if row:
        values.update({key:value for key,value in row.permissions.items() if key in values and isinstance(value,bool)})
    return values

def require_expert_permission(user,key,workspace_id=None):
    if is_superadmin(user) or user.role=='agency':return
    if user.role!='expert' or not expert_permissions(user,workspace_id).get(key,False):
        raise PermissionDenied('مدیر دفتر این اختیار را برای حساب شما فعال نکرده است.')

def audit(actor,event,entity,pk,property=None,**metadata):
    clean={k:v for k,v in metadata.items() if k in ('status','attempt','decision','reference','previous_status')}
    WorkflowEvent.objects.create(property=property,actor=actor,event=event,metadata={'entity_type':entity,'entity_id':pk,**clean})
    session=getattr(actor,'_mlkino_impersonation_session',None)
    ActivityLog.objects.create(actor=actor,real_actor=session.actor if session else actor,impersonation_session=session,event=event,category='workflow',metadata={'target_type':entity,'target_id':str(pk),**clean},request_id=uuid.uuid4())

def touch_contact(row,expert):
    is_file=row.kind=='file' or row.data.get('requesterType')=='owner'
    prefix='owner' if is_file else 'customer'
    phone=row.data.get(prefix+'Phone') or row.data.get('ownerPhone') or row.created_by.phone
    name=row.data.get(prefix+'Name') or row.data.get('ownerName') or row.created_by.full_name or 'متقاضی'
    national=row.data.get(prefix+'NationalId') or row.data.get(prefix+'NationalCode')
    national=normalize(national).replace(' ','') or None
    roles=(['owner','landlord'] if row.data.get('contractType')=='رهن و اجاره' else ['owner']) if is_file else (['tenant'] if row.data.get('contractType')=='رهن و اجاره' else ['buyer'])
    ws=row.office_id or workspace(expert)
    match=CRMContact.objects.filter(workspace_id=ws,national_code=national).first() if national else None
    if not match:match=CRMContact.objects.filter(workspace_id=ws,phone=phone).first()
    defaults={'name':name,'expert':expert,'user':row.created_by if row.created_by.phone==phone else User.objects.filter(phone=phone).first(),'roles':roles,'national_code':national,'phone2':row.data.get(prefix+'Phone2',''),'job':row.data.get(prefix+'Job',''),'data':{'province':row.data.get('province',''),'city':row.data.get('city','')}}
    if match:
        contact,created=match,False
    else:
        contact,created=CRMContact.objects.get_or_create(workspace_id=ws,phone=phone,defaults=defaults)
    if not created:
        contact.roles=list(dict.fromkeys(contact.roles+roles));contact.expert=expert
        contact.name=name or contact.name;contact.national_code=national or contact.national_code
        contact.phone2=row.data.get(prefix+'Phone2') or contact.phone2;contact.job=row.data.get(prefix+'Job') or contact.job
        contact.save(update_fields=['name','roles','expert','national_code','phone2','job','updated_at'])
    contact.properties.add(row)
    if row.data.get('partyContactId')!=contact.pk:
        row.data={**row.data,'partyContactId':contact.pk,'partyRole':roles[0]}
        row.save(update_fields=['data','updated_at'])
    return contact

def candidates(row,config):
    previous=set(row.referrals.exclude(expert=None).values_list('expert_id',flat=True))
    users=list(User.objects.filter(role='expert',is_active=True,account_status='active').exclude(pk__in=previous).annotate(referral_load=Count('property_referrals',filter=Q(property_referrals__status='pending'))))
    order=config.get('expert_order',[])
    agencies={}
    for link in AgencyExpertLink.objects.filter(expert_id__in=[u.pk for u in users]).select_related('agency__agency_profile').order_by('id'):
        agencies.setdefault(link.expert_id,link)
    def priority(user):
        agency=agencies.get(user.pk)
        profile=getattr(agency.agency,'agency_profile',None) if agency else None
        match={'neighborhood':getattr(profile,'office_neighborhood',''),'district':getattr(profile,'office_district',''),'city':user.city,'province':user.province}
        rank=len(config['geographic_priority'])
        for i,key in enumerate(config['geographic_priority']):
            values=row.data.get(key);values=values if isinstance(values,list) else [values]
            if key=='other' or match.get(key) and normalize(match[key]) in [normalize(x) for x in values]:rank=i;break
        return rank,order.index(user.pk) if user.pk in order else len(order),user.referral_load,user.pk
    return sorted(users,key=priority)

@transaction.atomic
def dispatch(property_id,actor=None,explicit_expert=None):
    row=PropertyRecord.objects.select_for_update(of=('self',)).get(pk=property_id)
    if row.archived_at:return None
    existing=row.referrals.filter(status__in=['pending','accepted','market']).first()
    if existing:return existing
    config=policy()
    if not config['enabled'] and explicit_expert is None:return None
    attempt=row.referrals.count()+1
    eligible=candidates(row,config)
    chosen=explicit_expert or (eligible[0] if eligible and attempt<=config['max_attempts'] and config['mode']!='market' else None)
    if chosen and (chosen.role!='expert' or not chosen.is_active or chosen.account_status!='active'):raise ValidationError('کارشناس فعال و مجاز انتخاب کنید.')
    status='pending' if chosen else 'market'
    referral=PropertyReferral.objects.create(property=row,expert=chosen,status=status,attempt=attempt,expires_at=timezone.now()+timedelta(minutes=config['response_minutes']) if chosen else None)
    row.publication_state='pending'
    if not chosen and config.get('market_office_id'):row.office_id=config['market_office_id']
    row.save(update_fields=['publication_state','office','updated_at'])
    audit(actor,'routing.assigned' if chosen else 'routing.market','referral',referral.pk,property=row,status=status,attempt=attempt)
    if chosen and config['notifications']:notify(chosen,'referral','درخواست جدید برای بررسی',link=f'/assignments?referral={referral.pk}')
    if not chosen:
        for manager in User.objects.filter(role='superadmin',is_active=True):notify(manager,'referral','درخواست در بازار املاک ملکینو',link='/assignments')
    return referral

@transaction.atomic
def respond(referral_id,user,decision,publish=False):
    if not is_superadmin(user) and user.role!='expert':raise PermissionDenied('پاسخ به ارجاع فقط برای کارشناس فعال مجاز است.')
    ref=PropertyReferral.objects.select_related('property').get(pk=referral_id)
    row=PropertyRecord.objects.select_for_update(of=('self',)).get(pk=ref.property_id)
    ref=PropertyReferral.objects.select_for_update(of=('self',)).get(pk=referral_id)
    if ref.expert_id!=user.pk and not is_superadmin(user):raise PermissionDenied('این ارجاع متعلق به شما نیست.')
    target='accepted' if decision=='accept' else 'rejected'
    if ref.status==target:return ref
    if ref.status!='pending':raise ValidationError('این ارجاع دیگر قابل پاسخ نیست.')
    if decision=='accept' and (not ref.expert or ref.expert.role!='expert' or not ref.expert.is_active or ref.expert.account_status!='active'):raise ValidationError('کارشناس این ارجاع فعال نیست؛ پرونده باید دوباره ارجاع شود.')
    if ref.expires_at<=timezone.now():
        ref.status='expired';ref.save(update_fields=['status','updated_at']);audit(user,'routing.expired','referral',ref.pk,property=row,status='expired');dispatch(row.pk,user);return ref
    ref.status=target;ref.save(update_fields=['status','updated_at'])
    audit(user,'routing.responded','referral',ref.pk,property=row,decision=decision,status=target)
    if decision=='accept':
        row.assigned_expert_id=ref.expert_id;row.office_id=workspace(ref.expert);row.publication_state='published' if publish else 'draft';row.data={**row.data,'publicationStatus':row.publication_state};row.save(update_fields=['assigned_expert','office','publication_state','data','updated_at']);touch_contact(row,ref.expert)
        notify(row.created_by,'referral','درخواست شما پذیرفته شد',link=f'/{"files" if row.kind=="file" else "requests"}/{row.pk}')
    else:dispatch(row.pk,user)
    return ref

def expire_due(limit=200):
    ids=list(PropertyReferral.objects.filter(status='pending',expires_at__lte=timezone.now()).values_list('pk',flat=True)[:limit])
    count=0
    for pk in ids:
        with transaction.atomic():
            candidate=PropertyReferral.objects.get(pk=pk)
            PropertyRecord.objects.select_for_update(of=('self',)).get(pk=candidate.property_id)
            ref=PropertyReferral.objects.select_for_update(of=('self',)).get(pk=pk)
            if ref.status!='pending' or ref.expires_at>timezone.now():continue
            ref.status='expired';ref.save(update_fields=['status','updated_at']);audit(None,'routing.expired','referral',ref.pk,property=ref.property,status='expired');dispatch(ref.property_id);count+=1
    return count

def visit_office_id(visit):
    row=visit.slot.property
    if row.office_id:return row.office_id
    expert=row.assigned_expert or visit.slot.expert
    return AgencyExpertLink.objects.filter(expert=expert).order_by('id').values_list('agency_id',flat=True).first()

def visit_candidates(visit):
    office_id=visit_office_id(visit)
    used=set(visit.assignments.values_list('expert_id',flat=True))
    if office_id:
        ids=AgencyExpertLink.objects.filter(agency_id=office_id,expert__role='expert',expert__is_active=True,expert__account_status='active').order_by('id').values_list('expert_id',flat=True)
        experts=list(User.objects.filter(pk__in=ids).exclude(pk__in=used))
        order={pk:i for i,pk in enumerate(ids)}
        experts.sort(key=lambda x:(0 if x.pk==visit.slot.expert_id else 1,order.get(x.pk,999999),x.pk))
        return experts
    fallback=visit.slot.expert
    return [fallback] if fallback.pk not in used and fallback.role=='expert' and fallback.is_active else []

@transaction.atomic
def dispatch_visit(visit_id,actor=None):
    visit=PropertyVisit.objects.select_related('slot__property','slot__expert').select_for_update(of=('self',)).get(pk=visit_id)
    current=visit.assignments.filter(status='pending').first()
    if current:return current
    experts=visit_candidates(visit)
    if not experts:
        visit.assigned_expert=None;visit.expires_at=None
        visit.save(update_fields=['assigned_expert','expires_at','updated_at'])
        audit(actor,'visit.queue.exhausted','visit',visit.pk,property=visit.slot.property,status='unassigned')
        return None
    expert=experts[0];expires=timezone.now()+timedelta(minutes=policy()['response_minutes'])
    assignment=VisitAssignment.objects.create(visit=visit,expert=expert,attempt=visit.assignments.count()+1,expires_at=expires)
    visit.assigned_expert=expert;visit.expires_at=expires;visit.status='pending'
    visit.save(update_fields=['assigned_expert','expires_at','status','updated_at'])
    audit(actor,'visit.queue.assigned','visit_assignment',assignment.pk,property=visit.slot.property,status='pending',attempt=assignment.attempt)
    notify(expert,'visit','درخواست بازدید جدید؛ پیش از تأیید با خریدار تماس بگیرید.',link=f'/visits?visit={visit.pk}')
    return assignment

@transaction.atomic
def respond_visit(visit_id,user,decision):
    if decision not in ('accept','reject'):raise ValidationError('پاسخ بازدید معتبر نیست.')
    visit=PropertyVisit.objects.select_related('slot__property','visitor').select_for_update(of=('self',)).get(pk=visit_id)
    assignment=VisitAssignment.objects.select_for_update(of=('self',)).filter(visit=visit,status='pending').first()
    if not assignment:raise ValidationError('این درخواست بازدید دیگر در صف پاسخ نیست.')
    if not is_superadmin(user) and assignment.expert_id!=user.pk:raise PermissionDenied('این نوبت بازدید متعلق به شما نیست.')
    require_expert_permission(user,'can_manage_visits',visit_office_id(visit))
    if assignment.expires_at<=timezone.now():
        assignment.status='expired';assignment.save(update_fields=['status','updated_at'])
        audit(user,'visit.queue.expired','visit_assignment',assignment.pk,property=visit.slot.property,status='expired')
        dispatch_visit(visit.pk,user)
        return visit
    assignment.status='accepted' if decision=='accept' else 'rejected';assignment.save(update_fields=['status','updated_at'])
    audit(user,'visit.queue.responded','visit_assignment',assignment.pk,property=visit.slot.property,decision=decision,status=assignment.status)
    if decision=='accept':
        visit.assigned_expert_id=assignment.expert_id;visit.status='confirmed';visit.expires_at=None
        visit.save(update_fields=['assigned_expert','status','expires_at','updated_at'])
        if visit.visitor_id:notify(visit.visitor,'visit','درخواست بازدید شما تأیید شد.',link=f'/visits?visit={visit.pk}')
        if visit.slot.property.created_by_id!=visit.visitor_id:
            notify(visit.slot.property.created_by,'visit','یک بازدید برای فایل شما تأیید شد.',link=f'/visits?visit={visit.pk}')
        audit(user,'visit.confirmed','visit',visit.pk,property=visit.slot.property,status='confirmed')
    else:dispatch_visit(visit.pk,user)
    return visit

def expire_visit_due(limit=200):
    ids=list(VisitAssignment.objects.filter(status='pending',expires_at__lte=timezone.now()).values_list('visit_id',flat=True)[:limit]);count=0
    for visit_id in ids:
        with transaction.atomic():
            visit=PropertyVisit.objects.select_for_update(of=('self',)).get(pk=visit_id)
            assignment=VisitAssignment.objects.select_for_update(of=('self',)).filter(visit=visit,status='pending').first()
            if not assignment or assignment.expires_at>timezone.now():continue
            assignment.status='expired';assignment.save(update_fields=['status','updated_at'])
            audit(None,'visit.queue.expired','visit_assignment',assignment.pk,property=visit.slot.property,status='expired')
            dispatch_visit(visit.pk);count+=1
    return count

def calculate_visit_commission(visit):
    total=visit.owner_commission+visit.buyer_commission
    office_id=visit_office_id(visit)
    agreement=ExpertShareAgreement.objects.filter(workspace_id=office_id,expert_id=visit.assigned_expert_id,valid_from__lte=timezone.localdate()).first() if office_id and visit.assigned_expert_id else None
    percent=agreement.share_percent if agreement else 0
    visit.expert_share=(total*percent/100).quantize(__import__('decimal').Decimal('.01'))
    visit.office_share=total-visit.expert_share
    return total

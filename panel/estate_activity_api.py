"""Scoped CRM follow-ups and contract records; no payment or signature side effects."""
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import EstateActivity, AgencyExpertLink
from .settings_api import envelope, is_superadmin, http_url
from .property_api import normalize

STATUSES={'follow-ups':{'در حال پیگیری','انجام شده','نیازمند اقدام'},'contracts':{'فعال','در انتظار امضا','لغو شده','پایان یافته','پیش‌نویس','در حال بررسی','نهایی','بایگانی‌شده','لغوشده'}}
FIELDS={'file_name','status','expert_name','full_name','phone_number','date','description','meeting_manager','contract_datetime','agreed_price','price_difference','owner_commission','buyer_commission','image','contract_type','visitStatus','nextStatus','statusDescription','archive','property_id','party_ids','party_id','expert_id','office_id','assignee_id','due_at','priority','call_result','result','notes'}
MONEY={'agreed_price','price_difference','owner_commission','buyer_commission'}

def visible(user):
    qs=EstateActivity.objects.select_related('created_by')
    if is_superadmin(user):return qs
    from .models import UserBusinessRole
    finance=UserBusinessRole.objects.filter(user=user,role='finance').values_list('workspace_id',flat=True)
    if user.role=='agency':
        experts=AgencyExpertLink.objects.filter(agency=user).values('expert_id')
        return qs.filter(Q(office=user)|Q(office__isnull=True,created_by=user)|Q(office__isnull=True,created_by_id__in=experts))
    if user.role=='expert':
        offices=AgencyExpertLink.objects.filter(expert=user).values_list('agency_id',flat=True)
        return qs.filter((Q(created_by=user)|Q(assigned_expert=user))&(Q(office__isnull=True)|Q(office=user)|Q(office_id__in=offices))|Q(office_id__in=finance))
    return qs.filter(Q(office_id__in=finance)|Q(parties__user=user)).distinct()

def can_write(user):
    if not is_superadmin(user) and user.role not in ('agency','expert'):raise PermissionDenied('ثبت و ویرایش این بخش برای نقش شما مجاز نیست.')

def clean(incoming,kind,previous=None):
    if not isinstance(incoming,dict):raise ValidationError('اطلاعات فرم معتبر نیست.')
    allowed=FIELDS- (MONEY|{'contract_datetime','meeting_manager','contract_type'}) if kind=='follow-ups' else FIELDS-{'full_name','phone_number','date','expert_name','visitStatus','nextStatus','statusDescription','archive'}
    data={**{k:v for k,v in (previous or {}).items() if k in allowed},**{k:v for k,v in incoming.items() if k in allowed}}
    if not isinstance(data.get('file_name'),str) or not data['file_name'].strip():raise ValidationError({'file_name':'نام ملک را وارد کنید.'})
    for key in FIELDS-MONEY-{'archive','property_id','party_ids','party_id','expert_id','office_id','assignee_id'}:
        if key not in data:continue
        if data[key] is None:data[key]=''
        if not isinstance(data[key],str) or len(data[key])> (10000 if key in ('description','statusDescription') else 1000):raise ValidationError({key:'مقدار معتبر وارد کنید.'})
    data.setdefault('status','در حال پیگیری' if kind=='follow-ups' else 'فعال')
    if data['status'] not in STATUSES[kind]:raise ValidationError({'status':'وضعیت معتبر انتخاب کنید.'})
    from decimal import Decimal,InvalidOperation
    for key in MONEY&data.keys():
        try:value=Decimal(normalize(data[key]).replace(',',''))
        except (TypeError,ValueError,InvalidOperation):raise ValidationError({key:'مبلغ معتبر وارد کنید.'})
        if not value.is_finite() or abs(value)>Decimal('1e16') or key!='price_difference' and value<0 or value.as_tuple().exponent < -2:raise ValidationError({key:'مبلغ خارج از محدوده است.'})
        data[key]=int(value) if value==value.to_integral_value() else format(value,'f')
    for key in ('date','contract_datetime','due_at'):
        if data.get(key):
            try:parsed=parse_datetime(data[key])
            except ValueError:parsed=None
            if parsed is None:raise ValidationError({key:'تاریخ معتبر وارد کنید.'})
    if data.get('image') and not http_url(data['image']):raise ValidationError({'image':'نشانی تصویر معتبر نیست.'})
    if data.get('contract_type') not in (None,'','فروش','رهن و اجاره'):raise ValidationError({'contract_type':'نوع قرارداد معتبر نیست.'})
    if 'archive' in data and not isinstance(data['archive'],bool):raise ValidationError({'archive':'مقدار معتبر نیست.'})
    return data

def serialize(row):return {**row.data,**({'expert_name':row.data.get('expert_name') or row.created_by.full_name} if row.kind=='follow-ups' else {}),'id':row.pk,'created_at':row.created_at.isoformat(),'updated_at':row.updated_at.isoformat(),'property_id':row.property_id,'party_ids':list(row.parties.values_list('id',flat=True)),'party_id':row.parties.values_list('id',flat=True).first(),'expert_id':row.assigned_expert_id,'office_id':row.office_id,'attachment_url':f'/panel/workflows/activities/{row.pk}/attachment/' if row.attachment else None}

class EstateActivityListView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind):return envelope({'results':[serialize(row) for row in visible(request.user).filter(kind=kind)],'total_results':visible(request.user).filter(kind=kind).count()})
    @transaction.atomic
    def post(self,request,kind):
        can_write(request.user)
        data=clean(request.data,kind)
        if kind=='follow-ups' and not data.get('expert_name'):data['expert_name']=request.user.full_name
        row=EstateActivity.objects.create(kind=kind,created_by=request.user,data=data)
        link_activity(row,request.user,data)
        return envelope(serialize(row),message='اطلاعات ثبت شد.',code=201)

class EstateActivityDetailView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind,pk):return envelope(serialize(get_object_or_404(visible(request.user),kind=kind,pk=pk)))
    @transaction.atomic
    def patch(self,request,kind,pk):
        can_write(request.user);row=get_object_or_404(visible(request.user),kind=kind,pk=pk)
        if row.created_by_id!=request.user.pk and not is_superadmin(request.user):raise PermissionDenied('ویرایش این پرونده مجاز نیست.')
        row.data=clean(request.data,kind,row.data);link_activity(row,request.user,row.data);row.save(update_fields=['data','updated_at'])
        return envelope(serialize(row),message='تغییرات ذخیره شد.')


def link_activity(row,user,data):
    from .workflow_services import workspace,audit
    from .workflow_api import ident,contact_scope
    from .property_api import scope
    from accounts.models import User
    if data.get('property_id'):row.property=get_object_or_404(scope(user),pk=ident(data['property_id']))
    ws=ident(data.get('office_id') or row.office_id or workspace(user))
    if not is_superadmin(user) and ws!=workspace(user):raise PermissionDenied('دفتر قرارداد متعلق به شما نیست.')
    row.office_id=ws
    expert_id=data.get('expert_id') or data.get('assignee_id') or row.assigned_expert_id or (user.pk if user.role=='expert' else None)
    if expert_id:
        expert=get_object_or_404(User,pk=ident(expert_id),is_active=True)
        if expert.pk!=ws and not AgencyExpertLink.objects.filter(agency_id=ws,expert=expert).exists():raise ValidationError('مسئول پرونده متعلق به دفتر نیست.')
        row.assigned_expert=expert
    if 'party_ids' in data or data.get('party_id'):
        ids=data.get('party_ids') or [data['party_id']]
        if not isinstance(ids,list) or len(ids)>20:raise ValidationError('طرفین قرارداد معتبر نیستند.')
        ids=[ident(x) for x in ids];contacts=contact_scope(user).filter(pk__in=ids)
        if contacts.count()!=len(set(ids)):raise PermissionDenied('یک طرف قرارداد خارج از دسترسی شماست.')
        row.parties.set(contacts)
    row.save(update_fields=['property','office','assigned_expert'])
    audit(user,'activity.saved','activity',row.pk,property=row.property)

"""Scoped CRM follow-ups and contract records; no payment or signature side effects."""
import math
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import EstateActivity, AgencyExpertLink
from .settings_api import envelope, is_superadmin, http_url
from .property_api import normalize

STATUSES={'follow-ups':{'در حال پیگیری','انجام شده','نیازمند اقدام'},'contracts':{'فعال','در انتظار امضا','لغو شده','پایان یافته'}}
FIELDS={'file_name','status','expert_name','full_name','phone_number','date','description','meeting_manager','contract_datetime','agreed_price','price_difference','owner_commission','buyer_commission','image','contract_type','visitStatus','nextStatus','statusDescription','archive'}
MONEY={'agreed_price','price_difference','owner_commission','buyer_commission'}

def visible(user):
    qs=EstateActivity.objects.select_related('created_by')
    if is_superadmin(user):return qs
    ids={user.pk}
    if user.role=='agency':ids.update(AgencyExpertLink.objects.filter(agency=user).values_list('expert_id',flat=True))
    return qs.filter(created_by_id__in=ids)

def can_write(user):
    if not is_superadmin(user) and user.role not in ('agency','expert'):raise PermissionDenied('ثبت و ویرایش این بخش برای نقش شما مجاز نیست.')

def clean(incoming,kind,previous=None):
    if not isinstance(incoming,dict):raise ValidationError('اطلاعات فرم معتبر نیست.')
    allowed=FIELDS- (MONEY|{'contract_datetime','meeting_manager','contract_type'}) if kind=='follow-ups' else FIELDS-{'full_name','phone_number','date','expert_name','visitStatus','nextStatus','statusDescription','archive'}
    data={**{k:v for k,v in (previous or {}).items() if k in allowed},**{k:v for k,v in incoming.items() if k in allowed}}
    if not isinstance(data.get('file_name'),str) or not data['file_name'].strip():raise ValidationError({'file_name':'نام ملک را وارد کنید.'})
    for key in FIELDS-MONEY-{'archive'}:
        if key not in data:continue
        if data[key] is None:data[key]=''
        if not isinstance(data[key],str) or len(data[key])> (10000 if key in ('description','statusDescription') else 1000):raise ValidationError({key:'مقدار معتبر وارد کنید.'})
    data.setdefault('status','در حال پیگیری' if kind=='follow-ups' else 'فعال')
    if data['status'] not in STATUSES[kind]:raise ValidationError({'status':'وضعیت معتبر انتخاب کنید.'})
    for key in MONEY&data.keys():
        try:value=float(normalize(data[key]).replace(',',''))
        except (TypeError,ValueError):raise ValidationError({key:'مبلغ معتبر وارد کنید.'})
        if not math.isfinite(value) or abs(value)>1e16 or key!='price_difference' and value<0:raise ValidationError({key:'مبلغ خارج از محدوده است.'})
        data[key]=int(value) if value.is_integer() else value
    for key in ('date','contract_datetime'):
        if data.get(key):
            try:parsed=parse_datetime(data[key])
            except ValueError:parsed=None
            if parsed is None:raise ValidationError({key:'تاریخ معتبر وارد کنید.'})
    if data.get('image') and not http_url(data['image']):raise ValidationError({'image':'نشانی تصویر معتبر نیست.'})
    if data.get('contract_type') not in (None,'','فروش','رهن و اجاره'):raise ValidationError({'contract_type':'نوع قرارداد معتبر نیست.'})
    if 'archive' in data and not isinstance(data['archive'],bool):raise ValidationError({'archive':'مقدار معتبر نیست.'})
    return data

def serialize(row):return {**row.data,**({'expert_name':row.data.get('expert_name') or row.created_by.full_name} if row.kind=='follow-ups' else {}),'id':row.pk,'created_at':row.created_at.isoformat(),'updated_at':row.updated_at.isoformat()}

class EstateActivityListView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind):return envelope({'results':[serialize(row) for row in visible(request.user).filter(kind=kind)],'total_results':visible(request.user).filter(kind=kind).count()})
    def post(self,request,kind):
        can_write(request.user)
        data=clean(request.data,kind)
        if kind=='follow-ups' and not data.get('expert_name'):data['expert_name']=request.user.full_name
        row=EstateActivity.objects.create(kind=kind,created_by=request.user,data=data)
        return envelope(serialize(row),message='اطلاعات ثبت شد.',code=201)

class EstateActivityDetailView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind,pk):return envelope(serialize(get_object_or_404(visible(request.user),kind=kind,pk=pk)))
    def patch(self,request,kind,pk):
        can_write(request.user);row=get_object_or_404(visible(request.user),kind=kind,pk=pk)
        if row.created_by_id!=request.user.pk and not is_superadmin(request.user):raise PermissionDenied('ویرایش این پرونده مجاز نیست.')
        row.data=clean(request.data,kind,row.data);row.save(update_fields=['data','updated_at'])
        return envelope(serialize(row),message='تغییرات ذخیره شد.')

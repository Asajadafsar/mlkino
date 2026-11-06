"""Real, scoped operational/directory/financial reports with bounded safe filters."""
import csv
import io
import json
from collections import Counter,defaultdict
from datetime import date,datetime,timedelta
from decimal import Decimal,InvalidOperation
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date,parse_datetime
from rest_framework.exceptions import PermissionDenied,ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import AgencyExpertLink,PropertyRecord,EstateActivity,PropertyReferral,PropertyVisit,CRMContact,FinancialDocument,UserBusinessRole
from .property_api import scope,normalize
from .estate_activity_api import visible
from .finance_api import finance_scope
from .settings_api import envelope,is_superadmin
from .workflow_services import feature,workspaces

MAX_ROWS=10000
COLUMN_LABELS={'id':'شناسه','title':'عنوان','type':'نوع رکورد','status':'وضعیت','name':'نام','manager':'مدیر دفتر','phone':'شماره تماس','address':'نشانی','code':'شناسه دفتر','province':'استان','city':'شهر','district':'منطقه','neighborhood':'محله','agency':'دفتر املاک','agency_id':'شناسه دفتر','expert':'کارشناس','expert_id':'شناسه کارشناس','expert_count':'تعداد کارشناسان','active_experts':'کارشناسان فعال','files':'فایل‌های ملکی','requests':'درخواست‌ها','contracts':'قراردادها','license_status':'وضعیت پروانه','license_number':'شماره پروانه','license_expires_at':'پایان اعتبار پروانه','price':'قیمت (تومان)','area':'متراژ','kind':'نوع سند','amount':'مبلغ (تومان)','direction':'ماهیت سند','party':'طرف حساب','created_at':'تاریخ ثبت'}
COLUMNS={'operations':['id','title','type','status','province','city','district','neighborhood','agency','expert','price','area','created_at'],'agencies':['id','name','manager','phone','address','province','city','district','neighborhood','expert_count','active_experts','files','requests','contracts','license_status','license_number','license_expires_at','created_at'],'experts':['id','name','phone','agency','status','province','city','district','neighborhood','files','requests','contracts','created_at'],'finance':['id','kind','status','agency','expert','party','amount','direction','province','city','created_at']}
NUMBER_FIELDS={'id','price','area','amount','agency_id','expert_id','expert_count','active_experts','files','requests','contracts'}
DATE_FIELDS={'created_at','license_expires_at'}
COMMON_FIELDS={'id','title','type','status','name','province','city','district','neighborhood','agency','agency_id','expert','expert_id','price','area','created_at'}
REPORT_FIELDS={'operations':COMMON_FIELDS,'agencies':COMMON_FIELDS|{'manager','phone','address','code','expert_count','active_experts','files','requests','contracts','license_status','license_number','license_expires_at'},'experts':COMMON_FIELDS|{'phone','files','requests','contracts'},'finance':COMMON_FIELDS|{'kind','amount','direction','party'}}

# Nowruz calculation follows the same MIT-licensed jalaali-js break-year
# algorithm already used by the panel; no approximate 21-March assumption.
def _nowruz(jy):
    breaks=(-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178)
    if not breaks[0]<=jy<breaks[-1]:raise ValidationError('سال خارج از محدوده تقویم است.')
    jp=breaks[0];leap=-14
    for jm in breaks[1:]:
        jump=jm-jp
        if jy<jm:break
        leap+=(jump//33)*8+(jump%33)//4;jp=jm
    n=jy-jp;leap+=(n//33)*8+((n%33)+3)//4
    if jump%33==4 and jump-n==4:leap+=1
    gy=jy+621;greg=gy//4-((gy//100+1)*3)//4-150
    return date(gy,3,20+leap-greg)

def _jalali_month(day):
    year=day.year-621
    if day<_nowruz(year):year-=1
    elapsed=(day-_nowruz(year)).days
    month=elapsed//31+1 if elapsed<186 else (elapsed-186)//30+7
    return year,month

def _month_start(year,month):return _nowruz(year)+timedelta(days=(month-1)*31 if month<=6 else 186+(month-7)*30)

def _date(raw,key):
    try:d=parse_date(str(raw))
    except ValueError:d=None
    if not d:raise ValidationError({key:'تاریخ میلادی معتبر با قالب YYYY-MM-DD ارسال کنید.'})
    return d

def date_range(params,today=None):
    today=today or timezone.localdate();period=params.get('period','month');jy,jm=_jalali_month(today)
    ranges={'today':(today,today),'yesterday':(today-timedelta(days=1),today-timedelta(days=1)),'week':(today-timedelta(days=(today.weekday()-5)%7),today),'month':(_month_start(jy,jm),today),'previous_month':(_month_start(jy-1,12) if jm==1 else _month_start(jy,jm-1),_month_start(jy,jm)-timedelta(days=1)),'year':(_nowruz(jy),today)}
    if period not in ranges:raise ValidationError('دوره گزارش معتبر نیست.')
    start,end=ranges[period]
    if params.get('date_from'):start=_date(params['date_from'],'date_from')
    if params.get('date_to'):end=_date(params['date_to'],'date_to')
    if start>end or (end-start).days>3660:raise ValidationError('بازه گزارش باید مرتب و حداکثر ده سال باشد.')
    return start,end

def decimal_value(value):
    try:n=Decimal(normalize(value).replace(',',''))
    except (InvalidOperation,ValueError,TypeError):return None
    return n if n.is_finite() else None

def _as_date(value):
    if isinstance(value,datetime):return timezone.localtime(value).date() if timezone.is_aware(value) else value.date()
    if isinstance(value,date):return value
    if not value:return None
    try:
        d=parse_date(str(value))
        if d:return d
        dt=parse_datetime(str(value));return _as_date(dt) if dt else None
    except ValueError:return None

def compile_filters(raw,report):
    if not raw:return lambda row:True
    if not isinstance(raw,str) or len(raw)>12000:raise ValidationError('فیلتر ترکیبی بیش از حد بزرگ است.')
    try:tree=json.loads(raw)
    except (ValueError,TypeError):raise ValidationError('فیلتر ترکیبی JSON معتبر نیست.')
    nodes=[0]
    def build(node,depth=0):
        nodes[0]+=1
        if depth>5 or nodes[0]>50 or not isinstance(node,dict):raise ValidationError('ساختار فیلتر پیچیده یا نامعتبر است.')
        op=node.get('op',node.get('operator',''))
        if not isinstance(op,str):raise ValidationError('عملگر فیلتر معتبر نیست.')
        op=op.lower()
        if op in ('and','or'):
            if set(node)-{'op','operator','rules'} or not isinstance(node.get('rules'),list) or not 1<=len(node['rules'])<=20:raise ValidationError('گروه فیلتر معتبر نیست.')
            predicates=[build(x,depth+1) for x in node['rules']]
            return (lambda row:all(fn(row) for fn in predicates)) if op=='and' else (lambda row:any(fn(row) for fn in predicates))
        field=node.get('field')
        if set(node)-{'op','operator','field','value'} or field not in REPORT_FIELDS[report] or op not in ('eq','gt','lt','between','contains','is_empty'):raise ValidationError('فیلد یا عملگر فیلتر مجاز نیست.')
        value=node.get('value',True if op=='is_empty' else None)
        if op=='is_empty':
            if not isinstance(value,bool):raise ValidationError('مقدار خالی‌بودن باید منطقی باشد.')
            return lambda row:((row.get(field) is None or row.get(field)=='' or row.get(field)==[])==value)
        if op=='contains' and (field in NUMBER_FIELDS or field in DATE_FIELDS):raise ValidationError('جستجوی متنی برای این فیلد مجاز نیست.')
        def convert(v,input_value=False):
            if field in NUMBER_FIELDS:
                n=decimal_value(v)
                if input_value and n is None:raise ValidationError('مقدار عددی فیلتر معتبر نیست.')
                return n
            if field in DATE_FIELDS:
                d=_as_date(v)
                if input_value and d is None:raise ValidationError('تاریخ فیلتر معتبر نیست.')
                return d
            if input_value and (not isinstance(v,(str,bool,int)) or len(str(v))>1000):raise ValidationError('مقدار فیلتر معتبر نیست.')
            return normalize(v) if v is not None else None
        if op=='between':
            if not isinstance(value,list) or len(value)!=2:raise ValidationError('بازه فیلتر باید دو مقدار داشته باشد.')
            low,high=[convert(v,True) for v in value]
            if low>high:raise ValidationError('ترتیب بازه فیلتر معتبر نیست.')
            return lambda row:any(v is not None and low<=v<=high for v in _values(row.get(field),convert))
        wanted=convert(value,True)
        def match(row):
            for actual in _values(row.get(field),convert):
                if actual is None:continue
                if op=='eq' and actual==wanted or op=='contains' and wanted in actual or op=='gt' and actual>wanted or op=='lt' and actual<wanted:return True
            return False
        return match
    return build(tree)

def _values(value,convert):return [convert(x) for x in value] if isinstance(value,list) else [convert(value)]
def _bounded(qs):
    if qs.count()>MAX_ROWS:raise ValidationError('گزارش بیش از ده هزار رکورد است؛ بازه زمانی یا محدوده را کوچک‌تر کنید.')
    return list(qs)
def _pk(value,key):
    try:n=int(normalize(value))
    except (ValueError,TypeError):raise ValidationError({key:'شناسه معتبر نیست.'})
    if n<1:raise ValidationError({key:'شناسه معتبر نیست.'})
    return n

def _members(user):
    links=AgencyExpertLink.objects.select_related('agency__agency_profile','expert').order_by('id')
    if not is_superadmin(user):links=links.filter(agency=user) if user.role=='agency' else links.filter(expert=user)
    membership={};agencies={}
    for link in _bounded(links):membership.setdefault(link.expert_id,link.agency_id);agencies[link.agency_id]=link.agency
    if user.role=='agency':agencies[user.pk]=user
    return membership,agencies

def _office_name(user):return getattr(getattr(user,'agency_profile',None),'agency_name','') or user.full_name if user else ''
def _location(user):
    profile=getattr(user,'agency_profile',None) if user else None
    return {'province':user.province or '' if user else '', 'city':user.city or '' if user else '', 'district':getattr(profile,'office_district',''),'neighborhood':getattr(profile,'office_neighborhood','')}

def _property_row(row,membership,agencies):
    office=row.office or (row.created_by if row.created_by.role=='agency' else agencies.get(membership.get(row.created_by_id)))
    expert=row.assigned_expert or (row.created_by if row.created_by.role=='expert' else None)
    data=row.data
    return {'record_url':f'/{"files" if row.kind=="file" else "requests"}/{row.pk}','key':f'{row.kind}:{row.pk}','id':row.pk,'title':data.get('title') or data.get('propertyType') or 'پرونده ملکی','type':'فایل ملکی' if row.kind=='file' else 'درخواست ملک','_metric':'files' if row.kind=='file' else 'requests','status':row.publication_state,'province':data.get('province',''),'city':data.get('city',''),'district':data.get('district',''),'neighborhood':data.get('neighborhood',''),'agency_id':office.pk if office else None,'agency':_office_name(office),'expert_id':expert.pk if expert else None,'expert':expert.full_name if expert else '', 'price':data.get('mortgagePrice',data.get('mortgagePriceFrom')) if data.get('contractType')=='رهن و اجاره' else data.get('totalPrice',data.get('totalPriceFrom')),'area':data.get('area',data.get('areaFrom')),'created_at':row.created_at.isoformat()}

def operational_rows(user,start,end):
    from .workflow_api import referral_scope,visit_scope,contact_scope
    membership,agencies=_members(user);span={'created_at__date__gte':start,'created_at__date__lte':end}
    rows=[_property_row(r,membership,agencies) for r in _bounded(scope(user).filter(**span).select_related('created_by','assigned_expert','office__agency_profile'))]
    for ref in _bounded(referral_scope(user).filter(**span).select_related('property__created_by','property__assigned_expert','property__office__agency_profile','expert')):
        row=_property_row(ref.property,membership,agencies);row.update(record_url=f'/assignments?referral={ref.pk}',key=f'referral:{ref.pk}',id=ref.pk,type='ارجاع',_metric='referrals',status=ref.status,created_at=ref.created_at.isoformat(),expert_id=ref.expert_id,expert=ref.expert.full_name if ref.expert else '');rows.append(row)
    for visit in _bounded(visit_scope(user).filter(**span).select_related('slot__property__created_by','slot__property__assigned_expert','slot__property__office__agency_profile','slot__expert')):
        row=_property_row(visit.slot.property,membership,agencies);row.update(record_url=f'/visits?visit={visit.pk}',key=f'visit:{visit.pk}',id=visit.pk,type='بازدید',_metric='visits',status=visit.status,created_at=visit.created_at.isoformat(),expert_id=visit.slot.expert_id,expert=visit.slot.expert.full_name);rows.append(row)
    for record in _bounded(visible(user).filter(**span)):
        office=record.created_by if record.created_by.role=='agency' else agencies.get(membership.get(record.created_by_id));data=record.data
        rows.append({'record_url':f'/{"contracts" if record.kind=="contracts" else "follow-ups"}/{record.pk}','key':f'activity:{record.pk}','id':record.pk,'title':data.get('file_name',''),'type':'قرارداد' if record.kind=='contracts' else 'پیگیری','_metric':'contracts' if record.kind=='contracts' else 'followups','status':data.get('status',''),'agency_id':office.pk if office else None,'agency':_office_name(office),'expert_id':record.created_by_id if record.created_by.role=='expert' else None,'expert':record.created_by.full_name if record.created_by.role=='expert' else '',**_location(office or record.created_by),'price':data.get('agreed_price'),'created_at':record.created_at.isoformat()})
    for contact in _bounded(contact_scope(user).filter(**span).select_related('workspace__agency_profile','expert')):
        rows.append({'record_url':f'/crm?contact={contact.pk}','key':f'contact:{contact.pk}','id':contact.pk,'title':contact.name,'type':'مخاطب CRM','_metric':'contacts','status':'active','agency_id':contact.workspace_id,'agency':_office_name(contact.workspace),'expert_id':contact.expert_id,'expert':contact.expert.full_name if contact.expert else '',**{k:contact.data.get(k,'') for k in ('province','city','district','neighborhood')},'created_at':contact.created_at.isoformat()})
    if len(rows)>MAX_ROWS:raise ValidationError('تعداد رویدادها زیاد است؛ محدوده گزارش را کوچک‌تر کنید.')
    return rows

def directory_rows(user,report,start,end):
    User=get_user_model();membership,agencies=_members(user)
    qs=User.objects.filter(role='agency' if report=='agencies' else 'expert',date_joined__date__gte=start,date_joined__date__lte=end).select_related('agency_profile')
    if not is_superadmin(user):qs=qs.filter(pk__in=AgencyExpertLink.objects.filter(agency=user).values('expert_id')) if user.role=='agency' else qs.filter(pk=user.pk)
    persons=_bounded(qs);person_ids={p.pk for p in persons};counts=defaultdict(Counter)
    for record in _bounded(scope(user).filter(created_at__date__gte=start,created_at__date__lte=end).select_related('created_by')):
        pk=record.office_id or (record.created_by_id if record.created_by.role=='agency' else membership.get(record.created_by_id)) if report=='agencies' else record.assigned_expert_id or record.created_by_id
        if pk in person_ids:counts[pk]['files' if record.kind=='file' else 'requests']+=1
    for activity in _bounded(visible(user).filter(kind='contracts',created_at__date__gte=start,created_at__date__lte=end)):
        pk=activity.created_by_id if report=='experts' or activity.created_by.role=='agency' else membership.get(activity.created_by_id)
        if pk in person_ids:counts[pk]['contracts']+=1
    links=list(AgencyExpertLink.objects.filter(agency_id__in=person_ids).select_related('expert')) if report=='agencies' else []
    totals=Counter(l.agency_id for l in links);active=Counter(l.agency_id for l in links if l.expert.is_active and l.expert.account_status=='active');rows=[]
    for person in persons:
        profile=getattr(person,'agency_profile',None);office=person if report=='agencies' else agencies.get(membership.get(person.pk));has=bool(profile and profile.has_business_license);expiry=getattr(profile,'license_expires_at',None)
        license_status='without' if not has else 'expired' if expiry and expiry<timezone.localdate() else 'valid' if expiry else 'unknown'
        rows.append({'key':f'{report}:{person.pk}','id':person.pk,'name':_office_name(person) if report=='agencies' else person.full_name,'title':_office_name(person) if report=='agencies' else person.full_name,'manager':person.full_name,'phone':getattr(profile,'landline','') or person.phone,'address':getattr(profile,'office_address','') or person.address or '','code':str(person.pk),'type':'دفتر املاک' if report=='agencies' else 'کارشناس','_metric':report,'status':person.account_status if person.is_active else 'inactive','agency_id':office.pk if office else None,'agency':_office_name(office),'expert_id':person.pk if report=='experts' else None,'expert':person.full_name if report=='experts' else '',**_location(office or person),'expert_count':totals[person.pk] if report=='agencies' else None,'active_experts':active[person.pk] if report=='agencies' else None,'files':counts[person.pk]['files'],'requests':counts[person.pk]['requests'],'contracts':counts[person.pk]['contracts'],'license_status':license_status,'license_number':getattr(profile,'license_number',''),'license_expires_at':expiry.isoformat() if expiry else None,'created_at':person.date_joined.isoformat()})
    return rows

def financial_rows(user,start,end):
    rows=[]
    for doc in _bounded(finance_scope(user).filter(created_at__date__gte=start,created_at__date__lte=end).select_related('workspace__agency_profile','rate_version__expert')):
        data=doc.data;office=doc.workspace;expert=doc.rate_version.expert if doc.rate_version_id and doc.rate_version.expert_id else None
        loc=_location(office);loc.update({k:data[k] for k in ('province','city','district','neighborhood') if data.get(k)})
        rows.append({'key':f'finance:{doc.pk}','id':doc.pk,'title':doc.description,'type':'سند مالی','_metric':'finance','status':doc.status,'kind':doc.kind,'direction':doc.direction,'amount':str(doc.amount),'agency_id':doc.workspace_id,'agency':_office_name(office),'expert_id':expert.pk if expert else None,'expert':expert.full_name if expert else '', 'party':doc.party.name if doc.party_id else '',**loc,'created_at':doc.created_at.isoformat(),'_reverses':doc.reverses_id})
    return rows

def filter_rows(rows,params,predicate):
    for field in ('province','city','district','neighborhood','status'):
        if params.get(field):
            wanted={normalize(x) for x in params[field].split('|')};rows=[r for r in rows if wanted&{normalize(x) for x in (r.get(field) if isinstance(r.get(field),list) else [r.get(field)])}]
    for query,field in [('agency','agency_id'),('expert','expert_id')]:
        if params.get(query):
            target=_pk(params[query],query);rows=[r for r in rows if r.get(field)==target]
    for query,field in [('price','price'),('area','area'),('expertCount','expert_count')]:
        low=decimal_value(params[query+'From']) if params.get(query+'From') not in (None,'') else None;high=decimal_value(params[query+'To']) if params.get(query+'To') not in (None,'') else None
        if params.get(query+'From') not in (None,'') and low is None or params.get(query+'To') not in (None,'') and high is None or low is not None and low<0 or high is not None and high<0 or low is not None and high is not None and low>high:raise ValidationError('بازه عددی گزارش معتبر نیست.')
        if low is not None or high is not None:rows=[r for r in rows if decimal_value(r.get(field)) is not None and (low is None or decimal_value(r[field])>=low) and (high is None or decimal_value(r[field])<=high)]
    if params.get('license'):
        kind=params['license']
        if kind not in ('with','without','expired','valid','unknown'):raise ValidationError('وضعیت پروانه معتبر نیست.')
        rows=[r for r in rows if (r.get('license_status')!='without' if kind=='with' else r.get('license_status')==kind)]
    if params.get('search'):
        search=normalize(params['search'])
        if len(search)>300:raise ValidationError('متن جستجو طولانی است.')
        rows=[r for r in rows if search in normalize(' '.join(str(r.get(k,'')) for k in ('title','name','manager','phone','address','code','license_number','agency','expert')))]
    return [r for r in rows if predicate(r)]

def summary(rows,report):
    counts=Counter(r['_metric'] for r in rows);result={'records':len(rows),**dict(counts),'active':sum(r.get('status')=='active' for r in rows),'pending':sum(r.get('status')=='pending' for r in rows),'accepted':sum(r.get('status')=='accepted' for r in rows),'rejected':sum(r.get('status')=='rejected' for r in rows),'expired':sum(r.get('status')=='expired' for r in rows)}
    if report=='agencies':result.update(experts=sum(r['expert_count'] for r in rows),mean_experts=str((Decimal(sum(r['expert_count'] for r in rows))/len(rows)).quantize(Decimal('.01'))) if rows else '0.00',without_license=sum(r['license_status']=='without' for r in rows),expired_license=sum(r['license_status']=='expired' for r in rows))
    if report=='finance':
        posted=[r for r in rows if r['status'] in ('posted','reversed')];debit=sum((Decimal(r['amount']) for r in posted if r['direction']=='debit'),Decimal(0));credit=sum((Decimal(r['amount']) for r in posted if r['direction']=='credit'),Decimal(0));result.update(debit=str(debit),credit=str(credit),net=str(debit-credit),drafts=sum(r['status']=='draft' for r in rows))
    return result

def _csv_cell(value):
    if isinstance(value,list):value='، '.join(map(str,value))
    text='' if value is None else str(value)
    if text.lstrip().startswith(('=','+','-','@')) or text.startswith(('\t','\r','\n')):text="'"+text
    return text.replace('\x00','')

class WorkflowReportsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('reports');user=request.user;q=request.query_params;report=q.get('report','operations')
        if report not in COLUMNS:raise ValidationError('نوع گزارش معتبر نیست.')
        admin=is_superadmin(user)
        if report=='agencies' and not admin:raise PermissionDenied('گزارش دفاتر و پروانه‌ها فقط برای سوپرادمین است.')
        if not admin and user.role not in ('agency','expert') and not(report=='finance' and UserBusinessRole.objects.filter(user=user,role='finance').exists()):raise PermissionDenied('دسترسی به این گزارش ندارید.')
        if report=='finance':feature('finance')
        if q.get('agency') and not admin and _pk(q['agency'],'agency') not in workspaces(user):raise PermissionDenied('گزارش دفتر دیگری مجاز نیست.')
        if q.get('expert') and not admin:
            target=_pk(q['expert'],'expert')
            if target!=user.pk and not(user.role=='agency' and AgencyExpertLink.objects.filter(agency=user,expert_id=target).exists()):raise PermissionDenied('گزارش کارشناس متعلق به محدوده شما نیست.')
        if q.get('license') and report!='agencies':raise ValidationError('فیلتر پروانه فقط در گزارش دفاتر مجاز است.')
        start,end=date_range(q);length=(end-start).days+1;before_end=start-timedelta(days=1);before_start=before_end-timedelta(days=length-1)
        predicate=compile_filters(q.get('filters'),report)
        source=directory_rows if report in ('agencies','experts') else financial_rows if report=='finance' else operational_rows
        def get_rows(a,b):return source(user,report,a,b) if report in ('agencies','experts') else source(user,a,b)
        current=filter_rows(get_rows(start,end),q,predicate);previous=filter_rows(get_rows(before_start,before_end),q,predicate)
        ordering=q.get('ordering','-created_at');descending=ordering.startswith('-');sort_field=ordering.lstrip('-')
        if sort_field not in REPORT_FIELDS[report]:raise ValidationError('ستون مرتب‌سازی مجاز نیست.')
        def sort_value(r):
            value=r.get(sort_field)
            if sort_field in NUMBER_FIELDS:return decimal_value(value)
            if sort_field in DATE_FIELDS:return _as_date(value)
            return normalize(value) if value not in (None,'') else None
        filled=[r for r in current if sort_value(r) is not None];missing=[r for r in current if sort_value(r) is None]
        filled.sort(key=sort_value,reverse=descending);current=filled+missing
        columns=[{'key':key,'label':COLUMN_LABELS[key]} for key in COLUMNS[report]]
        if q.get('export'):
            if q['export']!='csv':raise ValidationError('نوع خروجی معتبر نیست.')
            if len(current)>5000:raise ValidationError('برای خروجی بیش از پنج هزار ردیف، محدوده گزارش را کوچک‌تر کنید.')
            stream=io.StringIO();stream.write('\ufeff');writer=csv.writer(stream);writer.writerow([c['label'] for c in columns]);writer.writerows([_csv_cell(r.get(c['key'])) for c in columns] for r in current)
            response=HttpResponse(stream.getvalue(),content_type='text/csv; charset=utf-8');response['Content-Disposition']=f'attachment; filename="mlkino-{report}-{end}.csv"';response['Cache-Control']='private, no-store';return response
        try:page=max(1,int(q.get('page',1)));size=min(200,max(1,int(q.get('page_size',50))))
        except ValueError:raise ValidationError('صفحه گزارش معتبر نیست.')
        group=q.get('group_by','agency' if report=='experts' else 'city')
        if group not in ('province','city','district','neighborhood','agency','expert','status','type'):raise ValidationError('گروه مقایسه معتبر نیست.')
        groups=defaultdict(lambda:{'current':0,'previous':0})
        for key,rows in [('current',current),('previous',previous)]:
            for r in rows:
                labels=r.get(group);labels=labels if isinstance(labels,list) else [labels or 'ثبت‌نشده']
                for label in set(labels):groups[str(label)][key]+=1
        timeline={str(start+timedelta(days=i)):{'count':0,'amount':Decimal(0)} for i in range(length)}
        for row in current:
            day=str(_as_date(row.get('created_at')))
            if day in timeline:timeline[day]['count']+=1;timeline[day]['amount']+=decimal_value(row.get('amount')) or Decimal(0)
        cleaned=[{**{k:r.get(k) for k in REPORT_FIELDS[report]},'key':r['key'],'record_url':r.get('record_url','')} for r in current[(page-1)*size:page*size]]
        response=envelope({'results':cleaned,'total_results':len(current),'columns':columns,'summary':summary(current,report),'previous_summary':summary(previous,report),'trend':[{'date':day,'count':v['count'],'amount':str(v['amount'])} for day,v in timeline.items()],'comparison':[{'label':label,**v} for label,v in sorted(groups.items(),key=lambda x:(-x[1]['current'],x[0]))[:500]],'page':page,'page_size':size,'report':report,'group_by':group,'date_from':str(start),'date_to':str(end),'previous_date_from':str(before_start),'previous_date_to':str(before_end),'scope':'system' if admin else 'workspace' if user.role=='agency' else 'self','notes':['دوره‌های ماه و سال بر اساس تقویم شمسی و هفته از شنبه محاسبه می‌شوند.','مبنای تاریخ در گزارش دفاتر و کارشناسان، عضویت و در گزارش عملیات و مالی، ثبت رویداد است.','روند، تعداد ایجاد رکورد است؛ حذف عضویت تاریخی کارشناسان از داده فعلی قابل بازسازی نیست.','مقایسه محله چندانتخابی در هر محله شمرده می‌شود؛ جمع گروه‌ها ممکن است بیشتر از کل رکوردها باشد.','موقعیت قرارداد و پیگیری فاقد نشانی مستقل، از دفتر ثبت‌کننده گرفته می‌شود.']})
        response['Cache-Control']='private, no-store';return response

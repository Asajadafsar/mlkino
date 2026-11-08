"""Anonymous catalog intentionally excludes owner/contact/internal and draft data."""
from decimal import Decimal,InvalidOperation
from django.shortcuts import get_object_or_404
from django.db.models import Q,Exists,OuterRef,F
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from .models import PropertyRecord,AgencyExpertLink
from .settings_api import envelope
from .settings_runtime import system_settings
from .property_api import normalize
from .geography_api import IranLocationsView,MapTileView
from .workflow_services import feature

SAFE_FIELDS=('title','propertyType','contractType','province','city','district','neighborhood','area','totalPrice','mortgagePrice','monthlyRent','roomCount','images','latitude','longitude','description','documentType','amenities','buildYear','totalFloor','floor','external_links','image_variants','areaFrom','areaTo','totalPriceFrom','totalPriceTo','mortgagePriceFrom','mortgagePriceTo','monthlyRentFrom','monthlyRentTo','floorPreferences')
def public_rows():
    membership=AgencyExpertLink.objects.filter(agency_id=OuterRef('office_id'),expert_id=OuterRef('assigned_expert_id'))
    return PropertyRecord.objects.filter(publication_state='published',archived_at=None).annotate(_expert_membership=Exists(membership)).filter(Q(assigned_expert__isnull=True)|Q(assigned_expert__role='expert',assigned_expert__is_active=True,assigned_expert__account_status='active')&(Q(office__isnull=True)|Q(office_id=F('assigned_expert_id'))|Q(_expert_membership=True))).select_related('assigned_expert','office__agency_profile','created_by')

def public_serialize(row):
    result={k:row.data[k] for k in SAFE_FIELDS if k in row.data}
    if row.kind=='file':
        for key in ('areaFrom','areaTo','totalPriceFrom','totalPriceTo','mortgagePriceFrom','mortgagePriceTo','monthlyRentFrom','monthlyRentTo'):result.pop(key,None)
    # Internal notes, precise postal/address and owner details are never projected.
    if not isinstance(result.get('images',[]),list):result['images']=[]
    result['images']=[x for x in result.get('images',[]) if isinstance(x,str) and x.startswith(('https://','http://'))][:15]
    result.update(id=row.pk,kind=row.kind,featured=row.featured,created_at=row.created_at.isoformat(),title=row.data.get('title') or f'{row.data.get("propertyType", "ملک")} {row.data.get("city", "")}')
    expert=row.assigned_expert or (row.created_by if row.created_by.role=='expert' else None)
    result['expert']={'id':expert.pk,'name':expert.full_name,'work_phone':None} if expert else None
    office=row.office
    result['office']={'id':office.pk,'name':getattr(getattr(office,'agency_profile',None),'agency_name',office.full_name)} if office else None
    links=row.data.get('external_links') or row.data.get('virtualTourLink') or {}
    result['external_links']=links if isinstance(links,dict) else {'virtual_tour':links} if isinstance(links,str) and links.startswith(('https://','http://')) else {}
    return result

def numeric(value,key):
    try:n=Decimal(normalize(value).replace(',',''))
    except (InvalidOperation,ValueError):raise ValidationError({key:'عدد معتبر وارد کنید.'})
    if not n.is_finite() or n<0 or n>Decimal('1e16'):raise ValidationError({key:'عدد خارج از محدوده است.'})
    return n

def filter_catalog(rows,params):
    search=normalize(params.get('search',''))
    if search:rows=[r for r in rows if search in normalize(' '.join(str(r.data.get(k,'')) for k in ('title','description','province','city','district','neighborhood','propertyType')))]
    for key in ('propertyType','contractType','province','city','district','neighborhood','documentType','roomCount','totalFloor','floor'):
        wanted={normalize(x) for x in params.get(key,'').split('|') if x}
        if wanted:rows=[r for r in rows if wanted&{normalize(x) for x in (r.data.get(key) if isinstance(r.data.get(key),list) else [r.data.get(key)])}]
    for key in ('office','expert'):
        if params.get(key):
            try:pk=int(params[key])
            except ValueError:raise ValidationError({key:'شناسه معتبر نیست.'})
            rows=[r for r in rows if (r.office_id if key=='office' else r.assigned_expert_id or r.created_by_id)==pk]
    if params.get('amenities'):
        wanted=set(params['amenities'].split('|'));rows=[r for r in rows if wanted<=set(r.data.get('amenities',[]))]
    for prefix in ('price','area','buildYear'):
        lo=numeric(params[prefix+'From'],prefix+'From') if params.get(prefix+'From') not in (None,'') else None
        hi=numeric(params[prefix+'To'],prefix+'To') if params.get(prefix+'To') not in (None,'') else None
        if lo is not None and hi is not None and lo>hi:raise ValidationError('حداقل نباید بیشتر از حداکثر باشد.')
        def match(row):
            key=('mortgagePrice' if row.data.get('contractType')=='رهن و اجاره' else 'totalPrice') if prefix=='price' else prefix
            a=row.data.get(key,row.data.get(key+'From'));b=row.data.get(key,row.data.get(key+'To'))
            try:return (lo is None or b is not None and Decimal(str(b))>=lo) and (hi is None or a is not None and Decimal(str(a))<=hi)
            except InvalidOperation:return False
        if lo is not None or hi is not None:rows=[r for r in rows if match(r)]
    from django.utils.dateparse import parse_date
    for suffix in ('From','To'):
        raw=params.get('created'+suffix)
        if raw:
            d=parse_date(raw)
            if not d:raise ValidationError('تاریخ معتبر نیست.')
            rows=[r for r in rows if (r.created_at.date()>=d if suffix=='From' else r.created_at.date()<=d)]
    if params.get('bbox'):
        try:w,s,e,n=[float(x) for x in params['bbox'].split(',')];assert -180<=w<=e<=180 and -90<=s<=n<=90
        except (ValueError,AssertionError):raise ValidationError('محدوده نقشه معتبر نیست.')
        def inside(r):
            try:return w<=float(r.data['longitude'])<=e and s<=float(r.data['latitude'])<=n
            except (KeyError,ValueError,TypeError):return False
        rows=[r for r in rows if inside(r)]
    return rows

class PublicMapView(APIView):
    permission_classes=[AllowAny];authentication_classes=[]
    def get(self,request):
        from accounts.models import AgencyProfile
        rows=[]
        for row in public_rows().order_by('-created_at')[:1500]:
            if not system_settings().get('features',{}).get('files' if row.kind=='file' else 'requests',True):continue
            data=public_serialize(row)
            if data.get('latitude') is not None and data.get('longitude') is not None:rows.append(data)
        offices=[{'id':p.manager_id,'kind':'agency','title':p.agency_name,'latitude':float(p.latitude),'longitude':float(p.longitude),'city':p.manager.city,'province':p.manager.province,'images':[]} for p in AgencyProfile.objects.select_related('manager').filter(manager__role='agency',manager__is_active=True,manager__account_status='active',latitude__isnull=False,longitude__isnull=False)[:1500]]
        for office in offices:office['map_kind']='agency'
        return envelope({'results':rows+offices,'total_results':len(rows)+len(offices)})

class PublicCatalogView(APIView):
    permission_classes=[AllowAny];authentication_classes=[]
    def get(self,request,pk=None):
        kind=request.query_params.get('kind','file')
        if kind not in ('file','request'):raise ValidationError('نوع فهرست معتبر نیست.')
        if not pk:feature('files' if kind=='file' else 'requests')
        if pk:
            row=get_object_or_404(public_rows(),pk=pk);feature('files' if row.kind=='file' else 'requests');return envelope(public_serialize(row))
        qs=public_rows().filter(kind=kind)
        if request.query_params.get('featured') in ('true','1'):qs=qs.filter(featured=True)
        try:page=max(1,int(request.query_params.get('page',1)));size=min(60,max(1,int(request.query_params.get('page_size',24))))
        except ValueError:raise ValidationError('صفحه معتبر نیست.')
        filters={k:v for k,v in request.query_params.items() if k not in ('kind','featured','page','page_size') and v}
        # The home page must not deserialize the entire catalog to render 24 cards.
        if not filters:
            count=qs.count();rows=qs[(page-1)*size:page*size]
            return envelope({'results':[public_serialize(r) for r in rows],'total_results':count,'page':page,'page_size':size,'has_more':page*size<count})
        rows=filter_catalog(list(qs),request.query_params)
        return envelope({'results':[public_serialize(r) for r in rows[(page-1)*size:page*size]],'total_results':len(rows),'page':page,'page_size':size,'has_more':page*size<len(rows)})

class PublicConfigView(APIView):
    permission_classes=[AllowAny];authentication_classes=[]
    def get(self,request):
        from accounts.models import User
        cfg=system_settings();contact=cfg.get('contact',{})
        return envelope({'support':{k:contact.get(k,'') for k in ('phone','email','instagram','telegram','eitaa','whatsapp')},'hero_image':cfg.get('branding',{}).get('heroImage',''),'theme':{k:cfg.get('theme',{}).get(k,'') for k in ('primary','secondary')},'features':{k:cfg.get('features',{}).get(k,True) for k in ('favorites','visits','chats','files','requests')},'stats':{'files':public_rows().filter(kind='file').count(),'requests':public_rows().filter(kind='request').count(),'offices':User.objects.filter(role='agency',is_active=True).count(),'experts':User.objects.filter(role='expert',is_active=True).count()}})

class PublicLocationsView(IranLocationsView):
    permission_classes=[AllowAny];authentication_classes=[]
class PublicMapTileView(MapTileView):
    permission_classes=[AllowAny];authentication_classes=[]

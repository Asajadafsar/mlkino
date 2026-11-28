"""Persisted, scoped property files and search requests."""
import json
import math
import re
import uuid
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import PropertyRecord, AgencyExpertLink
from .property_technical import clean_technical
from .settings_api import envelope, is_superadmin, http_url

FLOORS = {'طبقه اول', 'طبقه آخر', 'پیلوت', 'فرقی نمی‌کند', 'سایر طبقات'}
NUMBERS = {'area','totalPrice','pricePerMeter','rent','mortgagePrice','monthlyRent','latitude','longitude','buildYear','roomCount','totalFloor','floor','areaFrom','areaTo','totalPriceFrom','totalPriceTo','mortgagePriceFrom','mortgagePriceTo','monthlyRentFrom','monthlyRentTo','monthlyCharge','monthlyChargeFrom','monthlyChargeTo'}
FIELDS = NUMBERS | {'contractType','propertyType','priority','landUse','documentType','province','county','city','district','neighborhood','address','budgetType','status','publicationStatus','requestStatus','assignedTo','vacateDate','occupancyDate','occupancyStatus','bathroom','heating','cooling','flooring','facade','direction','amenities','ownerName','ownerPhone','ownerPhone2','ownerJob','ownerNationalId','ownerNationalCode','customerName','customerPhone','customerPhone2','customerJob','customerNationalId','customerNationalCode','description','internalNote','images','virtualTourLink','floorPreferences','requesterType','title','documentTypeOther','technical','virtualTourUrl','otherLink','external_links'}
PARTY_IDS = {'ownerNationalId', 'ownerNationalCode', 'customerNationalId', 'customerNationalCode'}
FIELDS -= PARTY_IDS
PROPERTY_TYPES = {'آپارتمان', 'باغ ویلا', 'ساختمان کلنگی', 'ساختمان ویلایی', 'تجاری', 'اداری', 'ساختمان یکجا', 'زمین', 'صنعتی', 'پیش فروش'}
LAND_USES = {'مسکونی', 'تجاری', 'اداری', 'کشاورزی', 'باغی', 'اوقاف', 'مسکن ملی'}
LEGACY_TYPES = {'ویلا': 'ساختمان ویلایی', 'ویلایی': 'ساختمان ویلایی', 'سوله': 'صنعتی', 'کشاورزی': 'زمین'}
DIRECTIONS = {'شمال': 'شمالی', 'جنوب': 'جنوبی'}

def normalize(value):
    return str('' if value is None else value).translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩يك−','01234567890123456789یک-')).replace('\u200c',' ').strip().lower()

def property_type(value):
    normalized = normalize(value)
    return LEGACY_TYPES.get(normalized, normalized)

def record_field(data, key):
    if key == 'propertyType':
        return property_type(data.get(key))
    if key == 'landUse' and normalize(data.get('propertyType')) == 'کشاورزی':
        return data.get(key) or 'کشاورزی'
    if key == 'direction':
        value = data.get(key)
        return DIRECTIONS.get(normalize(value), value)
    return data.get(key)

def require_estate_write(user):
    if is_superadmin(user):
        raise PermissionDenied('دسترسی سوپرادمین در این بخش فقط برای مشاهده است.')

def scope(user):
    qs = PropertyRecord.objects.all()
    if is_superadmin(user): return qs
    if user.role not in ('agency','expert'):
        from .models import WorkflowEvent
        submitted=WorkflowEvent.objects.filter(actor=user,event='property.owner.submitted').values('property_id')
        return qs.filter(created_by=user).filter((Q(kind='request')&(Q(data__selfServiceRequest=True)|Q(data__selfServiceRequest__isnull=True)))|Q(data__ownerSubmission=True)|Q(pk__in=submitted))
    if user.role=='agency':
        experts=AgencyExpertLink.objects.filter(agency=user).values('expert_id')
        return qs.filter(Q(office=user)|Q(office__isnull=True,created_by=user)|Q(office__isnull=True,created_by_id__in=experts))
    offices=AgencyExpertLink.objects.filter(expert=user).values_list('agency_id',flat=True)
    return qs.filter(Q(created_by=user)|Q(assigned_expert=user)).filter(Q(office__isnull=True)|Q(office=user)|Q(office_id__in=offices))

def property_contact(row):
    if row.kind != 'file':
        return None
    return row.assigned_expert or (
        row.created_by if row.created_by.role in ('expert', 'agency') else (
            row.office if row.office and row.office.role == 'agency' else None
        )
    )


def require_file_fields(data):
    required = {
        'area': 'متراژ',
        'address': 'آدرس',
        'ownerName': 'نام مالک',
        'ownerPhone': 'شماره موبایل مالک',
    }
    missing = {key: f'{label} الزامی است.' for key, label in required.items()
               if not data.get(key) or not str(data[key]).strip()}
    if data.get('contractType') == 'رهن و اجاره':
        if not (data.get('mortgagePrice') or data.get('monthlyRent')):
            missing['mortgagePrice'] = 'مبلغ رهن یا اجاره الزامی است.'
    elif not data.get('totalPrice'):
        missing['totalPrice'] = 'قیمت ملک الزامی است.'
    if missing:
        raise ValidationError(missing)


def validate_payload(request, kind, previous=None, *, require_complete=False):
    if 'payload' in request.data:
        try: incoming=json.loads(request.data['payload'])
        except (TypeError,ValueError): raise ValidationError('اطلاعات فرم معتبر نیست.')
    else: incoming=request.data
    if not isinstance(incoming,dict): raise ValidationError('اطلاعات فرم معتبر نیست.')
    data={**{key:value for key,value in (previous or {}).items() if key not in PARTY_IDS}, **{key:value for key,value in incoming.items() if key in FIELDS}}
    for key in (('contractType','propertyType') if incoming.get('publicationStatus')=='draft' else ('contractType','propertyType','city')):
        if not isinstance(data.get(key),str) or not data[key].strip(): raise ValidationError({key:'این فیلد الزامی است.'})
    if data['contractType'] not in ('فروش','رهن و اجاره'): raise ValidationError({'contractType':'نوع معامله معتبر نیست.'})
    for key in (FIELDS-NUMBERS-{'district','neighborhood','amenities','images','virtualTourLink','external_links','floorPreferences','technical'}) & data.keys():
        if data[key] is None: data[key]=''
        if not isinstance(data[key],str) or len(data[key])>10000: raise ValidationError({key:'متن معتبر وارد کنید.'})
    land_use = record_field(data, 'landUse')
    data['propertyType'] = property_type(data['propertyType'])
    if data['propertyType'] not in PROPERTY_TYPES and data['propertyType'] != property_type((previous or {}).get('propertyType')):
        raise ValidationError({'propertyType':'نوع ملک معتبر انتخاب کنید.'})
    if data['propertyType'] == 'زمین' and land_use:
        if normalize(land_use) not in LAND_USES:
            raise ValidationError({'landUse':'کاربری زمین معتبر انتخاب کنید.'})
        data['landUse'] = normalize(land_use)
    else:
        data.pop('landUse', None)
    direction = record_field(data, 'direction')
    if direction and direction not in ('شمالی', 'جنوبی') and direction != (previous or {}).get('direction'):
        raise ValidationError({'direction':'جهت شمالی یا جنوبی انتخاب کنید.'})
    if direction:
        data['direction'] = direction
    if normalize(data.get('heating')).replace(' ', '') == 'کولرآبی':
        data.pop('heating', None)
    links=data.get('virtualTourLink',{})
    if links and (not isinstance(links,dict) or any(k not in ('eitaa','telegram','instagram') or not isinstance(v,str) or v and not http_url(v) for k,v in links.items())): raise ValidationError({'virtualTourLink':'لینک تور مجازی باید یک نشانی وب معتبر باشد.'})
    if kind == 'file' and request.user.role in ('expert', 'agency'):
        if 'allowOnlineChat' in incoming:
            if not isinstance(incoming['allowOnlineChat'], bool):
                raise ValidationError({'allowOnlineChat': 'وضعیت گفتگو باید روشن یا خاموش باشد.'})
            data['allowOnlineChat'] = incoming['allowOnlineChat']
    external=dict(data.get('external_links') or {})
    for src,target in [('virtualTourUrl','virtual_tour'),('otherLink','other')]:
        if data.get(src):external[target]=data[src]
    if external:data['external_links']=external
    external=data.get('external_links',{})
    if external and (not isinstance(external,dict) or len(external)>8 or any(k not in ('eitaa','telegram','instagram','virtual_tour','other') or not isinstance(v,str) or len(v)>2000 or not http_url(v) for k,v in external.items())):raise ValidationError({'external_links':'لینک خارجی معتبر نیست.'})
    images=data.get('images',[])
    if not isinstance(images,list) or len(images)>15 or any(not isinstance(v,str) or not http_url(v) for v in images): raise ValidationError({'images':'تصاویر معتبر نیستند.'})
    if data['contractType'] != 'رهن و اجاره':
        for key in ('monthlyCharge','monthlyChargeFrom','monthlyChargeTo'):data.pop(key,None)
    for key in NUMBERS & data.keys():
        value=data[key]
        if value in ('',None): data.pop(key);continue
        try: number=float(normalize(value).replace(',',''))
        except (ValueError,TypeError): raise ValidationError({key:'عدد معتبر وارد کنید.'})
        if not math.isfinite(number) or abs(number)>1e16 or (number<0 and key!='floor'): raise ValidationError({key:'عدد خارج از محدوده است.'})
        if key in ('floor', 'totalFloor') and not number.is_integer():
            raise ValidationError({key:'شماره و تعداد طبقات باید عدد صحیح باشد.'})
        data[key]=int(number) if number.is_integer() else number
    if data.get('documentType') != 'سایر':
        data.pop('documentTypeOther', None)
    elif ('documentType' in incoming or 'documentTypeOther' in incoming) and not data.get('documentTypeOther', '').strip():
        raise ValidationError({'documentTypeOther': 'نوع سند را وارد کنید.'})
    if len(data.get('documentTypeOther', '')) > 120:
        raise ValidationError({'documentTypeOther': 'نوع سند حداکثر ۱۲۰ نویسه است.'})
    if 'technical' in data:
        if isinstance(incoming.get('technical'), dict) and previous and property_type(previous.get('propertyType')) == data['propertyType']:
            data['technical'] = {**(previous.get('technical') or {}), **incoming['technical']}
        data['technical'] = clean_technical(data['propertyType'], data['technical'], data) if kind == 'file' else {}
        prices = data['technical'].get('floorPrices', [])
        by_floor = data['technical'].get('priceMode') == 'floor'
        if data['contractType'] == 'فروش' and (by_floor or not data.get('totalPrice')):
            if prices and len(prices) == data.get('totalFloor') and all(prices):
                data['totalPrice'] = sum(prices)
                data['pricePerMeter'] = round(data['totalPrice'] / data['area']) if data.get('area') else 0
            elif by_floor:
                data.pop('totalPrice', None)
    if kind == 'file' and require_complete and incoming.get('publicationStatus') != 'draft':
        require_file_fields(data)
    if kind == 'file' and data.get('totalFloor') is not None and data.get('floor', 0) > data['totalFloor']:
        if not previous or any(str(data.get(key)) != str(previous.get(key)) for key in ('floor', 'totalFloor')):
            raise ValidationError({'floor':'شماره طبقه نباید بیشتر از تعداد کل طبقات باشد.'})
    for key in ['area','totalPrice','mortgagePrice','monthlyRent','monthlyCharge']:
        lo,hi=data.get(key+'From'),data.get(key+'To')
        if lo is not None and hi is not None and lo>hi: raise ValidationError({key+'To':'حداکثر نباید کمتر از حداقل باشد.'})
    for key in ['amenities','floorPreferences']+(['district','neighborhood'] if kind=='request' else []):
        values=data.get(key,[])
        if isinstance(values,str): values=[values] if values else []
        if not isinstance(values,list) or len(values)>100 or any(not isinstance(v,str) or len(v)>150 for v in values): raise ValidationError({key:'گزینه‌های انتخاب‌شده معتبر نیست.'})
        data[key]=list(dict.fromkeys(values))
    if kind=='request':
        for key in ('address','occupancyStatus','bathroom','totalFloorFrom','totalFloorTo','totalFloor'): data.pop(key,None)
        if not set(data['floorPreferences'])<=FLOORS: raise ValidationError({'floorPreferences':'طبقه انتخاب‌شده معتبر نیست.'})
        if 'فرقی نمی‌کند' in data['floorPreferences']: data['floorPreferences']=['فرقی نمی‌کند']
    if data.get('province') and data.get('city'):
        from .geography_api import catalog, choose, municipal_zones, local_neighborhoods
        province=choose(catalog('provinces'),data['province'])
        if not province: raise ValidationError({'province':'استان معتبر انتخاب کنید.'})
        cities=[c for c in catalog('cities-filtered') if c['province_id']==province['id']]
        city=choose(cities,data['city'])
        if not city: raise ValidationError({'city':'شهر با استان انتخاب‌شده مطابقت ندارد.'})
        if data.get('county'):
            county=choose(catalog('counties'),data['county'])
            if not county or city['county_id']!=county['id']: raise ValidationError({'county':'شهر با شهرستان انتخاب‌شده مطابقت ندارد.'})
        if kind=='request':
            selected={normalize(x) for x in data.get('district',[]) if x!='همه مناطق'}
            valid_zones={normalize(z['name']) for z in municipal_zones(city)}
            if selected and not selected<=valid_zones: raise ValidationError({'district':'منطقه با شهر انتخاب‌شده مطابقت ندارد.'})
            known={}
            for n in local_neighborhoods(city):known.setdefault(normalize(n['name']),[]).append(n)
            for name in data.get('neighborhood',[]):
                row=known.get(normalize(name))
                if row and selected and not any(normalize(x.get('district')) in selected for x in row): raise ValidationError({'neighborhood':'محله با منطقه انتخاب‌شده مطابقت ندارد.'})
    if data.get('requesterType') not in (None,'customer','owner'):raise ValidationError({'requesterType':'نوع درخواست‌کننده معتبر نیست.'})
    if kind == 'request' and data.get('priority') not in (None, '', 'متوسط', 'بالا', 'فوری'):
        raise ValidationError({'priority': 'سطح درخواست معتبر نیست.'})
    for prefix in ('owner','customer'):
        job_field = prefix + 'Job'
        if re.search(r'\d', str(data.get(job_field) or '')) and data.get(job_field) != (previous or {}).get(job_field):
            raise ValidationError({job_field: 'عنوان شغل نباید شامل عدد باشد.'})
        phone=data.get(prefix+'Phone')
        if phone:
            from accounts.validators import validate_iranian_mobile
            try:data[prefix+'Phone']=validate_iranian_mobile(normalize(phone).replace(' ',''))
            except Exception:raise ValidationError({prefix+'Phone':'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.'})
        phone2=data.get(prefix+'Phone2')
        if phone2:
            clean=re.sub(r'[^0-9+]','',normalize(phone2))
            if not re.fullmatch(r'\+?\d{8,15}',clean):raise ValidationError({prefix+'Phone2':'تلفن دوم معتبر وارد کنید.'})
            data[prefix+'Phone2']=clean
    if len(json.dumps(data,ensure_ascii=False))>100000: raise ValidationError('حجم اطلاعات بیش از حد مجاز است.')
    uploads=request.FILES.getlist('images') if hasattr(request,'FILES') else []
    if len(uploads)>15: raise ValidationError({'images':'حداکثر ۱۵ تصویر مجاز است.'})
    for upload in uploads:
        if upload.size>5*1024*1024: raise ValidationError({'images':'حجم تصویر باید کمتر از ۵ مگابایت باشد.'})
        serializers.ImageField().run_validation(upload)
    if uploads:
        from accounts.media_processing import store_property_image
        images=list(data.get('images',[]))
        if len(images)+len(uploads)>15:raise ValidationError({'images':'مجموع تصاویر حداکثر ۱۵ مورد است.'})
        variants=dict((previous or {}).get('image_variants',{}))
        for upload in uploads:
            stored=store_property_image(upload,request)
            images.append(stored['url']);variants[stored['url']]=stored['variants']
        data['images']=images;data['image_variants']=variants
    for key,minimum,maximum in [('latitude',24,40),('longitude',44,64)]:
        if key in data and not minimum<=data[key]<=maximum:raise ValidationError({key:'موقعیت باید داخل محدوده ایران باشد.'})
    return data

def serialize(row,user=None):
    result={**{key:value for key,value in row.data.items() if key not in PARTY_IDS},**({'requesterName':row.created_by.full_name,'requesterPhone':row.created_by.phone} if row.kind=='request' else {}),'id':row.pk,'created_at':row.created_at.isoformat(),'updated_at':row.updated_at.isoformat(),'publication_state':row.publication_state,'assigned_expert_id':row.assigned_expert_id,'office_id':row.office_id,'featured':row.featured,'archived':bool(row.archived_at)}
    if not result.get('county') and result.get('province') and result.get('city'):
        from .geography_api import county_name
        if county := county_name(str(result['province']), str(result['city'])):
            result['county'] = county
    if row.kind == 'file':
        contact = property_contact(row)
        result.pop('work_phone', None)
        result['workPhone'] = contact.phone if contact else None
        result['contact_user_id'] = contact.pk if contact else None
    for key in ('propertyType', 'direction', 'landUse'):
        if (value := record_field(row.data, key)) is not None:
            result[key] = value
    if user is not None:
        from .models import PropertyPin
        result['pinned']=PropertyPin.objects.filter(user=user,property=row).exists()
    return result

class PropertyListView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind):
        from .workflow_services import feature,require_expert_permission
        feature('files' if kind=='file' else 'requests')
        if request.user.role=='expert':require_expert_permission(request.user,'can_manage_files' if kind=='file' else 'can_manage_requests')
        rows=list(scope(request.user).filter(kind=kind).select_related('created_by'))
        stats={'total':len(rows),'active':sum(r.data.get('requestStatus',r.data.get('status','')) in ('فعال','تایید شده','تأیید شده','تایید شده توسط کارشناس') for r in rows),'customer':sum(r.data.get('requesterType','customer')=='customer' for r in rows),'owner':sum(r.data.get('requesterType')=='owner' for r in rows)}
        params=request.query_params
        audience=params.get('requesterType')
        if audience: rows=[r for r in rows if r.data.get('requesterType','customer')==audience]
        search=normalize(params.get('search'))
        if search: rows=[r for r in rows if search in normalize(' '.join(str(v) for k,v in r.data.items() if k not in PARTY_IDS | {'images','virtualTourLink'}))]
        from .geography_api import county_name
        for key in ['propertyType','contractType','province','county','city','district','neighborhood','status','roomCount','buildYear','totalFloor','floor','landUse','documentType']:
            expected=property_type(params.get(key)) if key == 'propertyType' else normalize(params.get(key))
            if expected:
                def matches(row):
                    value = record_field(row.data, key)
                    if key == 'county' and not value:
                        value = county_name(str(row.data.get('province') or ''), str(row.data.get('city') or ''))
                    return any(expected == normalize(item) for item in (value if isinstance(value, list) else [value]))
                rows = [row for row in rows if matches(row)]
        if params.get('office'):
            rows = [row for row in rows if str(row.office_id) == params['office']]
        if params.get('recordId'):
            rows = [row for row in rows if str(row.pk) == normalize(params['recordId'])]
        if params.get('creatorRoles'):
            roles = params['creatorRoles'].split('|')
            rows = [row for row in rows if row.created_by.role in roles]
        if params.get('amenities'):
            desired = set(params['amenities'].split('|'))
            rows = [row for row in rows if desired.issubset(row.data.get('amenities') or [])]
        def within_bound(row,prefix,suffix,amount):
            field='area' if prefix=='area' else ('mortgagePrice' if row.data.get('contractType')=='رهن و اجاره' else 'totalPrice')
            value = row.data.get(field, row.data.get(field + suffix))
            if field not in row.data:
                value = row.data.get(field + ('To' if suffix == 'From' else 'From'))
                if value is None:
                    return row.data.get(field + suffix) is not None
            try:
                number = float(normalize(value).replace(',', ''))
            except ValueError:
                return False
            return number >= amount if suffix == 'From' else number <= amount
        for prefix in ('area','price'):
            for suffix in ('From','To'):
                raw=params.get(prefix+suffix)
                if not raw:continue
                try:amount=float(normalize(raw).replace(',',''))
                except ValueError:raise ValidationError({prefix+suffix:'عدد معتبر وارد کنید.'})
                if not math.isfinite(amount) or amount<0:raise ValidationError({prefix+suffix:'عدد معتبر وارد کنید.'})
                rows=[r for r in rows if within_bound(r,prefix,suffix,amount)]
        price=params.get('totalPrice')
        if price:
            try: amount=float(normalize(price).replace(',',''))
            except ValueError: raise ValidationError({'totalPrice':'قیمت معتبر وارد کنید.'})
            rows=[r for r in rows if (r.data.get('totalPrice',r.data.get('totalPriceFrom',0))<=amount<=r.data.get('totalPrice',r.data.get('totalPriceTo',float('inf'))))]
        try: page=max(1,int(params.get('page',1)));size=min(100,max(1,int(params.get('page_size',24))))
        except ValueError: raise ValidationError('شماره صفحه معتبر نیست.')
        pinned=params.get('pinned')
        if pinned in ('true','1'):rows=[r for r in rows if r.pins.filter(user=request.user).exists()]
        total=len(rows);return envelope({'results':[serialize(r,request.user) for r in rows[(page-1)*size:page*size]],'total_results':total,'has_more':page*size<total,'stats':stats})
    @transaction.atomic
    def post(self,request,kind):
        require_estate_write(request.user)
        if kind=='file' and request.user.role not in ('agency','expert'): raise PermissionDenied('ثبت فایل برای این نقش مجاز نیست.')
        from .workflow_services import dispatch,feature,audit,workspace,require_expert_permission,touch_contact
        feature('files' if kind=='file' else 'requests')
        if request.user.role=='expert':require_expert_permission(request.user,'can_manage_files' if kind=='file' else 'can_manage_requests')
        data=validate_payload(request,kind,require_complete=True)
        professional=request.user.role in ('agency','expert')
        data['source']='panel' if professional else 'landing'
        if kind=='request':data['selfServiceRequest']=not professional;data['requesterType']='customer'
        row=PropertyRecord.objects.create(kind=kind,created_by=request.user,data=data,office_id=workspace(request.user) if request.user.role in ('agency','expert') else None,assigned_expert=request.user if request.user.role=='expert' else None)
        if professional and (kind != 'file' or data.get('ownerPhone')):
            touch_contact(row,request.user)
        audit(request.user,'property.created','property',row.pk,property=row)
        if kind=='request' and data.get('publicationStatus')!='draft':dispatch(row.pk,request.user)
        return envelope(serialize(row,request.user),message='اطلاعات ثبت شد.',code=201)

class PropertyDetailView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind,pk):
        row=get_object_or_404(scope(request.user),kind=kind,pk=pk)
        if request.user.role=='expert':
            from .workflow_services import require_expert_permission
            require_expert_permission(request.user,'can_manage_files' if kind=='file' else 'can_manage_requests',row.office_id)
        return envelope(serialize(row,request.user))
    @transaction.atomic
    def patch(self,request,kind,pk):
        require_estate_write(request.user)
        row=get_object_or_404(scope(request.user).select_for_update(of=('self',)),kind=kind,pk=pk)
        if request.user.role=='expert':
            from .workflow_services import require_expert_permission
            require_expert_permission(request.user,'can_manage_files' if kind=='file' else 'can_manage_requests',row.office_id)
        if request.user.role not in ('agency','expert'):
            if row.assigned_expert_id:raise PermissionDenied('این پرونده به کارشناس سپرده شده است؛ تغییرات را با مسئول پرونده هماهنگ کنید.')
        if row.created_by_id!=request.user.pk and row.assigned_expert_id!=request.user.pk and not (request.user.role=='agency' and row.office_id==request.user.pk): raise PermissionDenied('ویرایش این پرونده مجاز نیست.')
        data = validate_payload(request, kind, row.data)
        old_data = row.data
        if kind == 'file' and (
            old_data.get('publicationStatus') == 'draft' and data.get('publicationStatus') == 'pending'
            or all(old_data.get(key) for key in ('ownerName', 'ownerPhone', 'address', 'area'))
        ):
            require_file_fields(data)
        row.data = data
        row.save(update_fields=['data','updated_at'])
        if kind == 'file' and request.user.role in ('expert', 'agency') and data.get('ownerPhone') and any(
            data.get(key) != old_data.get(key) for key in ('ownerName', 'ownerPhone', 'ownerPhone2', 'ownerJob')
        ):
            from .workflow_services import touch_contact
            contact = touch_contact(row, row.assigned_expert or request.user)
            old_contact = old_data.get('partyContactId')
            if old_contact and old_contact != contact.pk:
                row.crm_contacts.remove(old_contact)
        if row.data.get('publicationStatus')=='pending':
            from .workflow_services import dispatch
            dispatch(row.pk,request.user)
        return envelope(serialize(row,request.user),message='تغییرات ذخیره شد.')

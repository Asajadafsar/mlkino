"""Persisted, scoped property files and search requests."""
import json
import math
import uuid
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import PropertyRecord, AgencyExpertLink
from .settings_api import envelope, is_superadmin, http_url

FLOORS = {'طبقه اول', 'طبقه آخر', 'پیلوت', 'فرقی نمی‌کند', 'سایر طبقات'}
NUMBERS = {'area','totalPrice','pricePerMeter','rent','mortgagePrice','monthlyRent','roomCount','totalFloor','floor','areaFrom','areaTo','totalPriceFrom','totalPriceTo','mortgagePriceFrom','mortgagePriceTo','monthlyRentFrom','monthlyRentTo','monthlyCharge','monthlyChargeFrom','monthlyChargeTo'}
FIELDS = NUMBERS | {'contractType','propertyType','documentType','province','county','city','district','neighborhood','address','budgetType','status','publicationStatus','requestStatus','assignedTo','vacateDate','occupancyDate','occupancyStatus','bathroom','heating','cooling','flooring','facade','direction','amenities','ownerName','ownerPhone','ownerPhone2','ownerJob','description','internalNote','images','virtualTourLink','floorPreferences','requesterType'}

def normalize(value):
    return str('' if value is None else value).translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩يك','01234567890123456789یک')).replace('\u200c',' ').strip().lower()

def scope(user):
    qs = PropertyRecord.objects.all()
    if is_superadmin(user): return qs
    ids = {user.pk}
    if user.role == 'agency': ids.update(AgencyExpertLink.objects.filter(agency=user).values_list('expert_id',flat=True))
    return qs.filter(created_by_id__in=ids)

def validate_payload(request, kind, previous=None):
    if 'payload' in request.data:
        try: incoming=json.loads(request.data['payload'])
        except (TypeError,ValueError): raise ValidationError('اطلاعات فرم معتبر نیست.')
    else: incoming=request.data
    if not isinstance(incoming,dict): raise ValidationError('اطلاعات فرم معتبر نیست.')
    data={**(previous or {}), **{key:value for key,value in incoming.items() if key in FIELDS}}
    for key in ('contractType','propertyType','city'):
        if not isinstance(data.get(key),str) or not data[key].strip(): raise ValidationError({key:'این فیلد الزامی است.'})
    if data['contractType'] not in ('فروش','رهن و اجاره'): raise ValidationError({'contractType':'نوع معامله معتبر نیست.'})
    for key in (FIELDS-NUMBERS-{'district','neighborhood','amenities','images','virtualTourLink','floorPreferences'}) & data.keys():
        if data[key] is None: data[key]=''
        if not isinstance(data[key],str) or len(data[key])>10000: raise ValidationError({key:'متن معتبر وارد کنید.'})
    links=data.get('virtualTourLink',{})
    if links and (not isinstance(links,dict) or any(k not in ('eitaa','telegram','instagram') or not isinstance(v,str) or v and not http_url(v) for k,v in links.items())): raise ValidationError({'virtualTourLink':'لینک تور مجازی باید یک نشانی وب معتبر باشد.'})
    images=data.get('images',[])
    if not isinstance(images,list) or len(images)>15 or any(not isinstance(v,str) or not http_url(v) for v in images): raise ValidationError({'images':'تصاویر معتبر نیستند.'})
    if data['contractType'] != 'رهن و اجاره':
        for key in ('monthlyCharge','monthlyChargeFrom','monthlyChargeTo'):data.pop(key,None)
    for key in NUMBERS & data.keys():
        value=data[key]
        if value in ('',None): data.pop(key);continue
        try: number=float(normalize(value).replace(',',''))
        except (ValueError,TypeError): raise ValidationError({key:'عدد معتبر وارد کنید.'})
        if not math.isfinite(number) or number<0 or number>1e16: raise ValidationError({key:'عدد خارج از محدوده است.'})
        data[key]=int(number) if number.is_integer() else number
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
    if data.get('province'):
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
    if len(json.dumps(data,ensure_ascii=False))>100000: raise ValidationError('حجم اطلاعات بیش از حد مجاز است.')
    uploads=request.FILES.getlist('images') if hasattr(request,'FILES') else []
    if len(uploads)>15: raise ValidationError({'images':'حداکثر ۱۵ تصویر مجاز است.'})
    for upload in uploads:
        if upload.size>5*1024*1024: raise ValidationError({'images':'حجم تصویر باید کمتر از ۵ مگابایت باشد.'})
        serializers.ImageField().run_validation(upload)
    if uploads:
        images=list(data.get('images',[]))
        for upload in uploads:
            saved=default_storage.save(f'properties/{uuid.uuid4().hex}/{upload.name}',upload)
            images.append(request.build_absolute_uri(default_storage.url(saved)))
        data['images']=images
    return data

def serialize(row): return {**row.data,**({'requesterName':row.created_by.full_name,'requesterPhone':row.created_by.phone} if row.kind=='request' else {}),'id':row.pk,'created_at':row.created_at.isoformat(),'updated_at':row.updated_at.isoformat()}

class PropertyListView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind):
        rows=list(scope(request.user).filter(kind=kind).select_related('created_by'))
        stats={'total':len(rows),'active':sum(r.data.get('requestStatus',r.data.get('status','')) in ('فعال','تایید شده','تأیید شده','تایید شده توسط کارشناس') for r in rows),'customer':sum(r.data.get('requesterType','customer')=='customer' for r in rows),'owner':sum(r.data.get('requesterType')=='owner' for r in rows)}
        params=request.query_params
        audience=params.get('requesterType')
        if audience: rows=[r for r in rows if r.data.get('requesterType','customer')==audience]
        search=normalize(params.get('search'))
        if search: rows=[r for r in rows if search in normalize(' '.join(str(v) for k,v in r.data.items() if k not in ('images','virtualTourLink')))]
        for key in ['propertyType','contractType','province','county','city','district','neighborhood','status']:
            expected=normalize(params.get(key))
            if expected:
                rows=[r for r in rows if any(expected==normalize(v) for v in (r.data.get(key) if isinstance(r.data.get(key),list) else [r.data.get(key)]))]
        def within_bound(row,prefix,suffix,amount):
            field='area' if prefix=='area' else ('mortgagePrice' if row.data.get('contractType')=='رهن و اجاره' else 'totalPrice')
            low=row.data.get(field,row.data.get(field+'From'))
            high=row.data.get(field,row.data.get(field+'To'))
            if low is None and high is None:return False
            return (high is None or high>=amount) if suffix=='From' else (low is None or low<=amount)
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
        total=len(rows);return envelope({'results':[serialize(r) for r in rows[(page-1)*size:page*size]],'total_results':total,'has_more':page*size<total,'stats':stats})
    def post(self,request,kind):
        if kind=='file' and request.user.role not in ('superadmin','agency','expert') and not is_superadmin(request.user): raise PermissionDenied('ثبت فایل برای این نقش مجاز نیست.')
        data=validate_payload(request,kind)
        row=PropertyRecord.objects.create(kind=kind,created_by=request.user,data=data)
        return envelope(serialize(row),message='اطلاعات ثبت شد.',code=201)

class PropertyDetailView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,kind,pk): return envelope(serialize(get_object_or_404(scope(request.user),kind=kind,pk=pk)))
    def patch(self,request,kind,pk):
        row=get_object_or_404(scope(request.user),kind=kind,pk=pk)
        if row.created_by_id!=request.user.pk and not is_superadmin(request.user): raise PermissionDenied('ویرایش این پرونده مجاز نیست.')
        row.data=validate_payload(request,kind,row.data);row.save(update_fields=['data','updated_at']);return envelope(serialize(row),message='تغییرات ذخیره شد.')

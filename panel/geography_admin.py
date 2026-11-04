"""Administrator-maintained municipal areas, stored with locked panel settings."""
import hashlib
import json
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .settings_models import PanelSettings
from .settings_api import envelope,is_superadmin
from .property_api import normalize


def override(city_id):
    obj=PanelSettings.objects.filter(pk=1).first()
    return (obj.data.get('geography',{}) if obj and isinstance(obj.data,dict) else {}).get(str(city_id))


def revision(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()


class GeographyAdminView(APIView):
    permission_classes=[IsAuthenticated]

    def city(self,query):
        from .geography_api import catalog,choose
        city=choose(catalog('cities-filtered'),query.get('city',''))
        if city and (str(query.get('province',''))==str(city['province_id'])) and (str(query.get('county',''))==str(city['county_id'])):return city
        return None

    def get(self,request):
        if not is_superadmin(request.user):return envelope(message='این بخش فقط برای سوپرادمین است.',code=403)
        city=self.city(request.query_params)
        if not city:return envelope(message='استان، شهرستان و شهر معتبر انتخاب کنید.',code=400)
        from .geography_api import municipal_zones,local_neighborhoods
        saved=override(city['id'])
        value=saved or {'districts':[x['name'] for x in municipal_zones(city)],'neighborhoods':local_neighborhoods(city)}
        return envelope({**value,'revision':revision(saved)})

    @transaction.atomic
    def put(self,request):
        if not is_superadmin(request.user):return envelope(message='این بخش فقط برای سوپرادمین است.',code=403)
        city=self.city(request.data)
        if not city:return envelope(message='استان، شهرستان و شهر معتبر انتخاب کنید.',code=400)
        districts=request.data.get('districts');rows=request.data.get('neighborhoods')
        if not isinstance(districts,list) or len(districts)>300 or any(not isinstance(x,str) or not x.strip() or len(x)>150 for x in districts):return envelope(message='نام منطقه‌ها معتبر نیست.',code=400)
        districts=list(dict.fromkeys(x.strip() for x in districts))
        if not isinstance(rows,list) or len(rows)>3000:return envelope(message='فهرست محله‌ها معتبر نیست.',code=400)
        cleaned=[];seen=set()
        for row in rows:
            if not isinstance(row,dict):return envelope(message='محله معتبر وارد کنید.',code=400)
            name=row.get('name');district=row.get('district','');streets=row.get('streets',[])
            if not isinstance(name,str) or not name.strip() or len(name)>150 or district not in districts+[''] or not isinstance(streets,list) or len(streets)>200 or any(not isinstance(s,str) or len(s)>500 for s in streets):return envelope(message='هر محله باید نام و منطقه معتبر داشته باشد؛ هر معبر حداکثر ۵۰۰ حرف.',code=400)
            key=(normalize(name),normalize(district))
            if key in seen:return envelope(message='محله تکراری در یک منطقه ثبت شده است.',code=400)
            seen.add(key);cleaned.append({'id':'admin-'+str(len(cleaned)+1),'name':name.strip(),'district':district,'streets':streets,'city_id':city['id'],'source':'مدیریت سامانه'})
        obj,_=PanelSettings.objects.select_for_update().get_or_create(pk=1,defaults={'data':{}})
        data=dict(obj.data or {});geo=dict(data.get('geography',{}));old=geo.get(str(city['id']))
        if request.data.get('revision')!=revision(old):return envelope(message='فهرست توسط مدیر دیگری تغییر کرده؛ دوباره دریافت کنید.',code=409)
        value={'districts':districts,'neighborhoods':cleaned};geo[str(city['id'])]=value;data['geography']=geo
        obj.data=data;obj.updated_by=request.user;obj.save()
        return envelope({**value,'revision':revision(value)},'مناطق و محله‌های شهر ذخیره شدند.')

"""Iran-wide administrative catalog and first-party map services."""
import functools
import hashlib
import json
import math
from pathlib import Path
import requests
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from .settings_api import envelope
from .property_api import normalize

DATA=Path(__file__).parent/'data/iran'
@functools.lru_cache(maxsize=12)
def catalog(name):
    path=DATA/(name+'.json')
    return json.loads(path.read_text()) if path.exists() else []

def choose(rows,value):
    return next((r for r in rows if normalize(r.get('name'))==normalize(value) or str(r.get('id'))==str(value)),None)

def zone_label(row):
    suffix=row['name'].rsplit(' ',1)[-1]
    return 'منطقه '+suffix.translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹')) if suffix.isdigit() else row['name']

def city_neighborhoods(city):
    rows=[r for r in catalog('neighborhoods') if r.get('city_id')==city['id']]
    # The public national catalog supplements local, verified municipal mappings.
    mapping=catalog('city-neighborhood-lookup').get(str(city['id']))
    if not mapping:return rows, False
    import time
    folder=Path(getattr(settings,'MLKINO_TILE_CACHE_DIR',Path(settings.BASE_DIR)/'.map-cache'))/'places'
    path=folder/(str(city['id'])+'.json');public=[];available=True
    try:
        if path.is_file() and time.time()-path.stat().st_mtime<7*86400:public=json.loads(path.read_text())
        else:
            response=requests.get(f"https://api.divar.ir/v8/places/cities/{int(mapping['id'])}/districts",headers={'User-Agent':'Melkino/1.0 (+https://panel.mlkino.com)'},timeout=8)
            response.raise_for_status();public=response.json().get('districts',[])[:3000]
            folder.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(public,ensure_ascii=False))
    except (requests.RequestException,OSError,ValueError):
        available=False
        if path.is_file():
            try:public=json.loads(path.read_text())
            except ValueError:pass
    seen={normalize(r['name']).replace(' ','') for r in rows}
    for item in public:
        name=item.get('name');key=normalize(name).replace(' ','')
        if not isinstance(name,str) or len(name)>150 or key in seen:continue
        seen.add(key);location=item.get('default_location') or {}
        rows.append({'id':'public-'+str(item.get('id')),'name':name,'city_id':city['id'],'district':'','latitude':location.get('latitude'),'longitude':location.get('longitude'),'source':'Divar public places API'})
    return rows,available

class GeoThrottle(UserRateThrottle):
    scope='geocoding'
    rate='30/min'
class TileThrottle(UserRateThrottle):
    scope='map-tiles'
    rate='600/min'

class IranLocationsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        q=request.query_params;level=q.get('level','province')
        provinces=catalog('provinces');province=choose(provinces,q.get('province',''))
        counties=[r for r in catalog('counties') if province and r['province_id']==province['id']]
        county=choose(counties,q.get('county',''))
        cities=[r for r in catalog('cities-filtered') if ((province and r['province_id']==province['id']) or q.get('all')=='true') and (not county or r['county_id']==county['id'])]
        city=choose(cities,q.get('city',''))
        districts=[{**r,'name':zone_label(r)} for r in catalog('urban-zones') if city and r['city_id']==city['id']]
        if level=='province': rows=provinces
        elif level=='county': rows=counties
        elif level=='city': rows=[{**c,**{k:v for k,v in catalog('city-neighborhood-lookup').get(str(c['id']),{}).items() if k in ('latitude','longitude')}} for c in cities]
        elif level=='district': rows=districts
        elif level=='section': rows=[r for r in catalog('districts') if county and r['county_id']==county['id']]
        elif level=='rural': rows=[r for r in catalog('rurals') if county and r['county_id']==county['id']]
        elif level=='neighborhood':
            selected=q.getlist('district') or q.get('districts','').split('|')
            selected={normalize(x) for x in selected if x}
            selected.discard(normalize('همه مناطق'))
            all_rows,available=city_neighborhoods(city) if city else ([],True)
            rows=[r for r in all_rows if not selected or normalize(r.get('district')) in selected]
            return envelope({'results':sorted(rows,key=lambda r:normalize(r['name'])),'count':len(rows),'unassigned_count':sum(not r.get('district') for r in all_rows),'source_available':available,'source':'تقسیمات کشوری / کاتالوگ عمومی محله‌ها','complete_neighborhoods':False})
        else:return envelope(message='سطح جغرافیایی نامعتبر است.',code=400)
        return envelope({'results':sorted(rows,key=lambda r:normalize(r['name'])),'count':len(rows),'source':'تقسیمات کشوری ۱۴۰۴ / OpenStreetMap','complete_neighborhoods':False})

class GeocodeView(APIView):
    permission_classes=[IsAuthenticated]
    throttle_classes=[GeoThrottle]
    def post(self,request):
        parts=[str(request.data.get(k) or '').strip() for k in ('province','city','address')]
        if not parts[-1] or any(len(p)>1000 for p in parts):return envelope(message='نشانی دفتر را تکمیل کنید.',code=400)
        query='، '.join(dict.fromkeys(p for p in parts if p));key='mlkino:geocode:'+hashlib.sha256(query.encode()).hexdigest()
        result=cache.get(key)
        if result:return envelope(result)
        try:
            response=requests.get(getattr(settings,'MLKINO_GEOCODER_URL','https://photon.komoot.io/api/'),params={'q':query,'limit':3,'bbox':'44,25,63.5,40'},headers={'User-Agent':'Melkino/1.0 (+https://panel.mlkino.com)'},timeout=12)
            response.raise_for_status();features=response.json().get('features',[])
            valid=[f for f in features if 44<=f['geometry']['coordinates'][0]<=63.5 and 25<=f['geometry']['coordinates'][1]<=40]
            if not valid:return envelope(message='نشانی دقیق روی نقشه پیدا نشد؛ محل دفتر را با لمس نقشه مشخص کنید.',code=404)
            feature=valid[0];lon,lat=feature['geometry']['coordinates'];properties=feature.get('properties',{})
            exact=bool(properties.get('housenumber'))
            result={'latitude':lat,'longitude':lon,'accuracy':'building' if exact else 'approximate','label':properties.get('name',query),'source':'OpenStreetMap / Photon','needs_confirmation':not exact}
            cache.set(key,result,86400*7);return envelope(result)
        except (requests.RequestException,ValueError,KeyError,TypeError):return envelope(message='مکان‌یابی خودکار در دسترس نیست؛ با لمس نقشه محل دفتر را انتخاب کنید.',code=503)

class MapTileView(APIView):
    permission_classes=[IsAuthenticated]
    throttle_classes=[TileThrottle]
    def get(self,request,z,x,y):
        if not 4<=z<=19 or not 0<=x<2**z or not 0<=y<2**z:return HttpResponse(status=404)
        lon=(x+.5)/2**z*360-180;lat=math.degrees(math.atan(math.sinh(math.pi*(1-2*(y+.5)/2**z))))
        if not 40<=lon<=68 or not 22<=lat<=43:return HttpResponse(status=404)
        folder=Path(getattr(settings,'MLKINO_TILE_CACHE_DIR',Path(settings.BASE_DIR)/'.map-cache'))
        path=folder/str(z)/str(x)/(str(y)+'.png')
        import time
        if path.is_file() and time.time()-path.stat().st_mtime<86400*7: content=path.read_bytes()
        else:
            url=getattr(settings,'MLKINO_MAP_TILE_URL','https://tile.openstreetmap.org/{z}/{x}/{y}.png').format(z=z,x=x,y=y)
            try:
                r=requests.get(url,headers={'User-Agent':'Melkino/1.0 (+https://panel.mlkino.com)','Referer':request.headers.get('Referer','https://panel.mlkino.com/')},timeout=10);r.raise_for_status()
                if not r.content.startswith(b'\x89PNG') or len(r.content)>1024*1024:return HttpResponse(status=502)
                content=r.content;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(content)
            except (requests.RequestException,OSError):return HttpResponse(status=503)
        response=HttpResponse(content,content_type='image/png');response['Cache-Control']='private, max-age=604800';return response

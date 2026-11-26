"""Scoped, real dashboard counters, charts, recent records and city map layers."""
from collections import Counter
from datetime import timedelta
import math
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .property_api import scope,normalize,serialize,property_type,record_field
from .estate_activity_api import visible
from .models import AgencyExpertLink
from .settings_api import envelope,is_superadmin
from .geography_api import catalog,choose,local_neighborhoods

def number(value):
    try:n=float(value)
    except (TypeError,ValueError):return None
    return n if math.isfinite(n) and n>=0 else None

LOCATION_FIELDS = ('province', 'city', 'district', 'neighborhood')


def matches(data, q, *, estate=True):
    if q.get('county'):
        from .analytics_api import county_name
        if normalize(q['county']) != normalize(data.get('county') or county_name(data.get('province', ''), data.get('city', ''))):
            return False
    fields = LOCATION_FIELDS + (('propertyType', 'contractType', 'status', 'roomCount', 'buildYear', 'totalFloor', 'floor', 'landUse', 'documentType', 'occupancyStatus', 'bathroom', 'heating', 'cooling', 'flooring', 'facade', 'direction') if estate else ())
    for key in fields:
        wanted = property_type(q.get(key)) if key == 'propertyType' else normalize(q.get(key))
        actual = record_field(data, key)
        if wanted and wanted not in [normalize(x) for x in (actual if isinstance(actual, list) else [actual])]:
            return False
    if not estate:
        return True
    amenities = data.get('amenities') or []
    if q.get('amenities') and not set(q['amenities'].split('|')).issubset(amenities):
        return False
    if q.get('recordId') and str(data.get('id')) != q['recordId']:
        return False
    if q.get('creatorRoles') and data.get('creatorRole') not in q['creatorRoles'].split('|'):
        return False
    price = 'mortgagePrice' if data.get('contractType') == 'رهن و اجاره' else 'totalPrice'
    for prefix, field in [('price', price), ('area', 'area')]:
        for suffix, opposite in [('From', 'To'), ('To', 'From')]:
            bound = q.get(prefix + suffix)
            if bound is None:
                continue
            value = number(data.get(field, data.get(field + opposite)))
            if value is None or (suffix == 'From' and value < bound) or (suffix == 'To' and value > bound):
                return False
    return True


def office_place(user):
    profile = getattr(user, 'agency_profile', None)
    return {'province': getattr(profile, 'office_province', '') or user.province or '',
            'city': getattr(profile, 'office_city', '') or user.city or '',
            'district': getattr(profile, 'office_district', ''), 'neighborhood': getattr(profile, 'office_neighborhood', ''),
            'latitude': getattr(profile, 'latitude', None), 'longitude': getattr(profile, 'longitude', None)}


def coordinates(place, exact_allowed):
    lat, lon = number(place.get('latitude')), number(place.get('longitude'))
    if exact_allowed and lat is not None and lon is not None and 23 <= lat <= 42 and 42 <= lon <= 65:
        return {'latitude': lat, 'longitude': lon, 'precision': 'record'}
    province = choose(catalog('provinces'), place.get('province'))
    candidates = [city for city in catalog('cities-filtered') if
                  (not province or city['province_id'] == province['id']) and normalize(city['name']) == normalize(place.get('city'))]
    if len(candidates) != 1:
        return {}
    city = candidates[0]
    if place.get('neighborhood') or place.get('district'):
        neighborhood = normalize(place.get('neighborhood'))
        district = normalize(place.get('district'))
        centers = []
        for row in local_neighborhoods(city):
            if neighborhood and normalize(row['name']) != neighborhood:
                continue
            if district and normalize(row.get('district')) != district:
                continue
            lat, lon = number(row.get('latitude')), number(row.get('longitude'))
            if lat is not None and lon is not None and 23 <= lat <= 42 and 42 <= lon <= 65:
                centers.append((lat, lon))
        if centers:
            return {'latitude': sum(lat for lat, _ in centers) / len(centers),
                    'longitude': sum(lon for _, lon in centers) / len(centers),
                    'precision': 'neighborhood' if neighborhood else 'district'}
    location = catalog('city-neighborhood-lookup').get(str(city['id'])) or next(
        (center for center in catalog('county-centers') if center['county_id'] == city['county_id']
         and normalize(center['center_name']) == normalize(city['name'])), None)
    if not location or not location.get('latitude') or not location.get('longitude'):
        return {}
    return {'latitude': location['latitude'], 'longitude': location['longitude'], 'precision': 'city'}


class DashboardEstateView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        user=request.user;today=timezone.localdate();start=today-timedelta(days=29);previous=start-timedelta(days=30)
        records=list(scope(user).select_related('created_by','office__agency_profile'));activities=list(visible(user).select_related('created_by','property','property__office'));people=get_user_model().objects.filter(role__in=['agency','expert','user']).select_related('agency_profile')
        if not is_superadmin(user):
            ids={user.pk}
            if user.role=='agency':ids.update(AgencyExpertLink.objects.filter(agency=user).values_list('expert_id',flat=True))
            people=people.filter(pk__in=ids)
        if request.query_params.get('report') == '1':
            from .dashboard_reporting import report
            return envelope(report(request, records, activities, people))
        counts={k:{'total':0,'recent':0,'previous':0} for k in ('files','requests','agencies','active_agencies','customers','experts','followups','contracts')}
        trend={str(start+timedelta(days=i)):0 for i in range(30)};distribution=Counter();regions=Counter()
        def add(key,date):
            day=timezone.localdate(date);counts[key]['total']+=1
            if start<=day<=today:counts[key]['recent']+=1
            elif previous<=day<start:counts[key]['previous']+=1
        for row in records:
            add('files' if row.kind=='file' else 'requests',row.created_at)
            if row.kind=='file':
                day=str(timezone.localdate(row.created_at))
                if day in trend:trend[day]+=1
                distribution[row.data.get('propertyType') or 'سایر']+=1
                names=row.data.get('neighborhood') or row.data.get('district') or row.data.get('city') or 'ثبت‌نشده'
                for name in dict.fromkeys(names if isinstance(names,list) else [names]):regions[str(name)]+=1
        for row in activities:add('contracts' if row.kind=='contracts' else 'followups',row.created_at)
        for row in people:
            add({'agency':'agencies','expert':'experts','user':'customers'}[row.role],row.date_joined)
            if row.role=='agency' and row.is_active and row.account_status=='active':add('active_agencies',row.date_joined)
        q=request.query_params.dict()
        for key in ('priceFrom','priceTo','areaFrom','areaTo'):
            raw=q.get(key)
            if raw in (None,''):
                q.pop(key,None)
                continue
            amount=number(normalize(raw).replace(',',''))
            if amount is None or amount>10**16:return envelope(message='بازه قیمت معتبر وارد کنید.',code=400)
            q[key]=amount
        if q.get('priceFrom') is not None and q.get('priceTo') is not None and q['priceFrom']>q['priceTo']:return envelope(message='حداکثر قیمت نباید کمتر از حداقل باشد.',code=400)
        if q.get('areaFrom', 0) > q.get('areaTo', float('inf')):
            return envelope(message='بازه متراژ معتبر وارد کنید.', code=400)
        office_id = q.get('office')
        expert_id = q.get('expert')
        if any(value and not value.isdigit() for value in (office_id, expert_id)):
            return envelope(message='شناسه دفتر یا کارشناس معتبر نیست.', code=400)
        files, rows = [], []
        layers = set(q.get('map_layers', 'files').split('|')) & {'files', 'requests', 'contracts', 'agencies', 'experts', 'users'}
        if not is_superadmin(user):
            layers -= {'users'} if user.role == 'agency' else {'agencies', 'experts', 'users'}
        presence = q.get('presence', 'all')
        if presence not in ('all', 'online', 'offline'):
            return envelope(message='وضعیت حضور معتبر نیست.', code=400)
        from accounts.models import DeviceSession
        online_ids = set(DeviceSession.objects.filter(revoked_at=None, expires_at__gt=timezone.now(),
                         last_seen__gte=timezone.now()-timedelta(minutes=6)).values_list('user_id', flat=True))
        presence_counts = {'online': 0, 'offline': 0}
        offices = get_user_model().objects.filter(role='agency', is_active=True, account_status='active',
                                                 agency_profile__isnull=False).select_related('agency_profile')
        office_options = [{'id': str(office.pk), 'name': office.agency_profile.agency_name}
                          for office in offices if matches(office_place(office), q, estate=False)]

        def append(kind, pk, title, place, exact=False, **extra):
            if kind not in layers:
                return
            rows.append({'id': pk, 'kind': kind, 'title': title, 'count': 1,
                         **{field: place.get(field) or '' for field in LOCATION_FIELDS},
                         **coordinates(place, exact), kind: 1, **extra})
            if 'online' in extra:
                rows[-1]['online_count'] = int(extra['online'])
                rows[-1]['online'] = int(extra['online'])

        for row in records:
            if row.archived_at or office_id and str(row.office_id) != office_id or expert_id and (row.created_by.role != 'expert' or str(row.created_by_id) != expert_id):
                continue
            place = {**row.data, 'id': row.pk, 'creatorRole': row.created_by.role}
            if not matches(place, q):
                continue
            if row.kind == 'file':
                files.append(row)
            append('files' if row.kind == 'file' else 'requests', row.pk,
                   row.data.get('title') or row.data.get('propertyType') or 'ملک', place,
                   exact=row.kind == 'file' and (row.publication_state == 'published' or row.created_by_id == user.pk or user.role == 'agency'),
                   propertyType=row.data.get('propertyType'), area=row.data.get('area'), contractType=row.data.get('contractType'), totalPrice=row.data.get('totalPrice'), mortgagePrice=row.data.get('mortgagePrice'),
                   office=(getattr(getattr(row.office, 'agency_profile', None), 'agency_name', '') if row.office else ''))
        for row in activities:
            if expert_id and (row.created_by.role != 'expert' or str(row.created_by_id) != expert_id):
                continue
            if row.kind != 'contracts' or office_id and (not row.property or str(row.property.office_id) != office_id):
                continue
            place = row.property.data if row.property else {field: getattr(row.created_by, field, '') for field in LOCATION_FIELDS}
            if matches({**place, 'creatorRole': row.created_by.role}, q, estate=bool(row.property)):
                append('contracts', row.pk, row.data.get('title') or row.data.get('contractType') or 'قرارداد', place, exact=bool(row.property and (row.property.publication_state == 'published' or row.property.created_by_id == user.pk or user.role == 'agency')),
                       propertyType=place.get('propertyType'), area=place.get('area'), contractType=place.get('contractType'), totalPrice=place.get('totalPrice'))
        expert_offices = dict(AgencyExpertLink.objects.order_by('-id').values_list('expert_id','agency_id'))
        office_places = {office.pk: office_place(office) for office in offices}
        for person in people:
            kind = {'agency':'agencies','expert':'experts','user':'users'}[person.role]
            if expert_id and (person.role != 'expert' or str(person.pk) != expert_id):
                continue
            if q.get('creatorRoles') and person.role not in q['creatorRoles'].split('|'):
                continue
            if kind not in layers or not person.is_active or person.account_status != 'active':
                continue
            office_key = person.pk if kind == 'agencies' else expert_offices.get(person.pk)
            if office_id and str(office_key) != office_id:
                continue
            place = office_places.get(office_key) or {field: getattr(person, field, '') for field in LOCATION_FIELDS}
            if not matches(place, q, estate=False):
                continue
            online = person.pk in online_ids
            presence_counts['online' if online else 'offline'] += 1
            if presence != 'all' and online != (presence == 'online'):
                continue
            title = getattr(person.agency_profile, 'agency_name', '') if kind == 'agencies' and hasattr(person, 'agency_profile') else person.full_name
            append(kind, person.pk, title or 'بدون نام', place, exact=kind == 'agencies', online=online)
        if q.get('paginate') == '1' and (not q.get('page', '1').isdigit() or int(q.get('page', '1')) < 1):
            return envelope(message='شماره صفحه معتبر نیست.', code=400)
        matching = len(rows)
        points = [row for row in rows if 'latitude' in row][:500]
        if q.get('detail') != '1':
            aggregates = {}
            for point in points:
                key = (point['province'], point['city'])
                if key not in aggregates:
                    aggregates[key] = {key: point[key] for key in ('province','city','latitude','longitude','precision')}
                    aggregates[key]['count'] = 0
                group = aggregates[key]
                group['count'] += 1
                kind = point['kind']
                group[kind] = group.get(kind, 0) + 1
                if 'online' in point:
                    status = 'online' if point['online'] else 'offline'
                    group[status] = group.get(status, 0) + 1
            points = list(aggregates.values())
        map_data = {'rows': rows[max(0, int(q.get('page', 1))-1)*100:max(0, int(q.get('page', 1))-1)*100+100] if q.get('paginate') == '1' else rows[:500], 'points': points, 'matching_items': matching, 'mapped_items': sum(point['count'] for point in points),
                    'matching_files': len(files), 'mapped_files': sum(row.get('files', 0) for row in points),
                    'offices': office_options, 'page_size': 100, 'page': int(q.get('page', 1)) if q.get('paginate') == '1' else 1, 'has_more': int(q.get('page', 1))*100 < matching if q.get('paginate') == '1' else matching > 500}
        if q.get('demo') == '1':
            from .dashboard_demo import dashboard_demo
            map_data = dashboard_demo(q, layers, matches, presence)
        recent_requests=[serialize(r) for r in records if r.kind=='request'][:3]
        recent_contracts=[{**r.data,'id':r.pk,'created_at':r.created_at.isoformat()} for r in activities if r.kind=='contracts'][:3]
        market_city=q.get('city') or 'تهران'
        market=[r for r in records if r.kind=='file' and normalize(r.data.get('city'))==normalize(market_city) and r.data.get('contractType')=='فروش' and number(r.data.get('area')) and number(r.data.get('totalPrice'))]
        def mean(rows):return round(sum(number(r.data['totalPrice']) for r in rows)/sum(number(r.data['area']) for r in rows)) if rows else None
        nowrows=[r for r in market if timezone.localdate(r.created_at)>=start];oldrows=[r for r in market if previous<=timezone.localdate(r.created_at)<start];current=mean(nowrows);old=mean(oldrows)
        index={'city':market_city,'sample_size':len(market),'price_per_meter':mean(market),'mean_listing_age_days':round(sum(max(0,(today-timezone.localdate(r.created_at)).days) for r in market)/len(market)) if market else None,'change_percent':round((current-old)/old*100,1) if current is not None and old else None}
        counts['presence']={'total':sum(presence_counts.values()),'recent':presence_counts['online'],'previous':presence_counts['offline']}
        return envelope({'counts':counts,**map_data,'map_precision': 'record' if any(p.get('precision') == 'record' for p in map_data['points']) else 'city','period_days':30,'trend':[{'date':date,'count':count} for date,count in trend.items()],'distribution':[{'label':label,'count':count} for label,count in distribution.most_common()],'comparison':[{'label':label,'count':count} for label,count in regions.most_common(4)],'recent_requests':recent_requests,'recent_contracts':recent_contracts,'market_index':index})

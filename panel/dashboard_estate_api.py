"""Scoped, real dashboard counters, charts, recent records and city map layers."""
from collections import Counter,defaultdict
from datetime import timedelta
import math
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .property_api import scope,normalize,serialize
from .estate_activity_api import visible
from .models import AgencyExpertLink
from .settings_api import envelope,is_superadmin
from .geography_api import catalog,choose

def number(value):
    try:n=float(value)
    except (TypeError,ValueError):return None
    return n if math.isfinite(n) and n>=0 else None

def matches(data,q):
    for key in ('propertyType','province','city','district','contractType'):
        wanted=normalize(q.get(key))
        if wanted and wanted not in [normalize(x) for x in (data.get(key) if isinstance(data.get(key),list) else [data.get(key)])]:return False
    field='mortgagePrice' if data.get('contractType')=='رهن و اجاره' else 'totalPrice'
    for key in ('priceFrom','priceTo'):
        if key not in q or q[key] in ('',None):continue
        value=number(data.get(field,data.get(field+('To' if key=='priceFrom' else 'From'))))
        if value is None or key=='priceFrom' and value<q[key] or key=='priceTo' and value>q[key]:return False
    return True

class DashboardEstateView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        user=request.user;today=timezone.localdate();start=today-timedelta(days=29);previous=start-timedelta(days=30)
        records=list(scope(user).select_related('created_by'));activities=list(visible(user));people=get_user_model().objects.filter(role__in=['agency','expert','user'])
        if not is_superadmin(user):
            ids={user.pk}
            if user.role=='agency':ids.update(AgencyExpertLink.objects.filter(agency=user).values_list('expert_id',flat=True))
            people=people.filter(pk__in=ids)
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
        for key in ('priceFrom','priceTo'):
            raw=q.get(key)
            if raw in (None,''):
                q.pop(key,None)
                continue
            amount=number(normalize(raw).replace(',',''))
            if amount is None or amount>10**16:return envelope(message='بازه قیمت معتبر وارد کنید.',code=400)
            q[key]=amount
        if q.get('priceFrom') is not None and q.get('priceTo') is not None and q['priceFrom']>q['priceTo']:return envelope(message='حداکثر قیمت نباید کمتر از حداقل باشد.',code=400)
        files=[r for r in records if r.kind=='file' and matches(r.data,q)]
        requests=[r for r in records if r.kind=='request' and matches(r.data,q)]
        contracts=[r for r in activities if r.kind=='contracts' and (not q.get('city') or normalize(r.created_by.city)==normalize(q['city']))]
        layers=set(str(q.get('map_layers','files')).split('|'))&{'files','requests','contracts'}
        grouped=defaultdict(Counter)
        for kind,rows in [('files',files),('requests',requests),('contracts',contracts)]:
            if kind not in layers:continue
            for row in rows:
                place=row.data if kind!='contracts' else {'province':row.created_by.province or '', 'city':row.created_by.city or ''}
                grouped[(place.get('province',''),place.get('city',''))][kind]+=1
        points=[]
        for (province,name),kinds in grouped.items():
            p=choose(catalog('provinces'),province)
            candidates=[c for c in catalog('cities-filtered') if (not p or c['province_id']==p['id']) and normalize(c['name'])==normalize(name)]
            city=candidates[0] if len(candidates)==1 else None
            if not city:continue
            loc=catalog('city-neighborhood-lookup').get(str(city['id'])) or next((c for c in catalog('county-centers') if c['county_id']==city['county_id'] and normalize(c['center_name'])==normalize(city['name'])),None)
            if not loc or not loc.get('latitude') or not loc.get('longitude'):continue
            points.append({'city':city['name'],'province':province,'count':sum(kinds.values()),**{kind:kinds[kind] for kind in ('files','requests','contracts')},'latitude':loc['latitude'],'longitude':loc['longitude']})
        recent_requests=[serialize(r) for r in records if r.kind=='request'][:3]
        recent_contracts=[{**r.data,'id':r.pk,'created_at':r.created_at.isoformat()} for r in activities if r.kind=='contracts'][:3]
        market_city=q.get('city') or 'تهران'
        market=[r for r in records if r.kind=='file' and normalize(r.data.get('city'))==normalize(market_city) and r.data.get('contractType')=='فروش' and number(r.data.get('area')) and number(r.data.get('totalPrice'))]
        def mean(rows):return round(sum(number(r.data['totalPrice']) for r in rows)/sum(number(r.data['area']) for r in rows)) if rows else None
        nowrows=[r for r in market if timezone.localdate(r.created_at)>=start];oldrows=[r for r in market if previous<=timezone.localdate(r.created_at)<start];current=mean(nowrows);old=mean(oldrows)
        index={'city':market_city,'sample_size':len(market),'price_per_meter':mean(market),'mean_listing_age_days':round(sum(max(0,(today-timezone.localdate(r.created_at)).days) for r in market)/len(market)) if market else None,'change_percent':round((current-old)/old*100,1) if current is not None and old else None}
        matching=sum(len(rows) for kind,rows in [('files',files),('requests',requests),('contracts',contracts)] if kind in layers)
        return envelope({'counts':counts,'points':points,'matching_files':len(files),'mapped_files':sum(p['files'] for p in points),'matching_items':matching,'mapped_items':sum(p['count'] for p in points),'map_precision':'city','period_days':30,'trend':[{'date':date,'count':count} for date,count in trend.items()],'distribution':[{'label':label,'count':count} for label,count in distribution.most_common()],'comparison':[{'label':label,'count':count} for label,count in regions.most_common(4)],'recent_requests':recent_requests,'recent_contracts':recent_contracts,'market_index':index})

"""Dashboard counters and city-level map aggregates, respecting record visibility."""
from collections import defaultdict
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .property_api import scope,normalize
from .estate_activity_api import visible
from .models import AgencyExpertLink
from .settings_api import envelope,is_superadmin
from .geography_api import catalog,choose

class DashboardEstateView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        user=request.user;today=timezone.localdate();start=today-timedelta(days=29);previous=start-timedelta(days=30)
        records=list(scope(user));activities=list(visible(user));people=get_user_model().objects.filter(role__in=['agency','expert'])
        if not is_superadmin(user):
            ids={user.pk}
            if user.role=='agency':ids.update(AgencyExpertLink.objects.filter(agency=user).values_list('expert_id',flat=True))
            people=people.filter(pk__in=ids)
        counts={k:{'total':0,'recent':0,'previous':0} for k in ('files','requests','agencies','experts','followups','contracts')}
        def add(key,date):
            day=timezone.localdate(date);counts[key]['total']+=1
            if start<=day<=today:counts[key]['recent']+=1
            elif previous<=day<start:counts[key]['previous']+=1
        for row in records:add('files' if row.kind=='file' else 'requests',row.created_at)
        for row in activities:add('contracts' if row.kind=='contracts' else 'followups',row.created_at)
        for row in people:add('agencies' if row.role=='agency' else 'experts',row.date_joined)
        q=request.query_params;files=[r for r in records if r.kind=='file']
        for key in ('propertyType','province','city','district','contractType'):
            expected=normalize(q.get(key))
            if expected:files=[r for r in files if expected in [normalize(x) for x in (r.data.get(key) if isinstance(r.data.get(key),list) else [r.data.get(key)])]]
        for key in ('priceFrom','priceTo'):
            raw=q.get(key)
            if raw in (None,''):continue
            try:amount=int(normalize(raw).replace(',',''))
            except (ValueError,TypeError):return envelope(message='بازه قیمت معتبر وارد کنید.',code=400)
            if amount<0 or amount>10**16:return envelope(message='بازه قیمت معتبر وارد کنید.',code=400)
            files=[r for r in files if isinstance(r.data.get('mortgagePrice' if r.data.get('contractType')=='رهن و اجاره' else 'totalPrice'),(int,float)) and (r.data.get('mortgagePrice' if r.data.get('contractType')=='رهن و اجاره' else 'totalPrice')>=amount if key=='priceFrom' else r.data.get('mortgagePrice' if r.data.get('contractType')=='رهن و اجاره' else 'totalPrice')<=amount)]
        if q.get('priceFrom') and q.get('priceTo') and int(normalize(q['priceFrom']).replace(',',''))>int(normalize(q['priceTo']).replace(',','')):return envelope(message='حداکثر قیمت نباید کمتر از حداقل باشد.',code=400)
        grouped=defaultdict(list)
        for row in files:grouped[(row.data.get('province',''),row.data.get('city',''))].append(row)
        points=[]
        for (province,name),rows in grouped.items():
            p=choose(catalog('provinces'),province)
            candidates=[c for c in catalog('cities-filtered') if (not p or c['province_id']==p['id']) and normalize(c['name'])==normalize(name)]
            city=candidates[0] if len(candidates)==1 else None
            if not city:continue
            loc=catalog('city-neighborhood-lookup').get(str(city['id']))
            if not loc:loc=next((c for c in catalog('county-centers') if c['county_id']==city['county_id'] and normalize(c['center_name'])==normalize(city['name'])),None)
            if not loc or not loc.get('latitude') or not loc.get('longitude'):continue
            points.append({'city':city['name'],'province':province,'count':len(rows),'latitude':loc['latitude'],'longitude':loc['longitude']})
        return envelope({'counts':counts,'points':points,'matching_files':len(files),'mapped_files':sum(p['count'] for p in points),'map_precision':'city','period_days':30})

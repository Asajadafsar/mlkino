"""Scoped estate counts, geographic comparisons and creation-period trends."""
from functools import lru_cache
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import PropertyRecord,EstateActivity,AgencyExpertLink
from .settings_api import envelope,is_superadmin
from .property_api import normalize
from .geography_api import catalog,choose

METRICS=('agencies','experts','files','requests','followups','contracts')
def empty():return dict.fromkeys(METRICS,0)
def values(x):return x if isinstance(x,list) else [x] if x else []

@lru_cache(maxsize=3000)
def county_name(province,city):
    p=choose(catalog('provinces'),province)
    c=choose([r for r in catalog('cities-filtered') if p and r['province_id']==p['id']],city)
    county=choose(catalog('counties'),c['county_id']) if c else None
    return county['name'] if county else ''

def location(user,users,links):
    office=user if user.role=='agency' else users.get(links.get(user.pk))
    profile=getattr(office,'agency_profile',None) if office else None
    province=(office.province if office else user.province) or ''
    city=(office.city if office else user.city) or ''
    p=choose(catalog('provinces'),province)
    c=choose([r for r in catalog('cities-filtered') if p and r['province_id']==p['id']],city)
    county=choose(catalog('counties'),c['county_id']) if c else None
    return {'province':province,'county':county['name'] if county else '', 'city':city,'district':getattr(profile,'office_district',''),'neighborhood':getattr(profile,'office_neighborhood','')}

class EstateAnalyticsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        admin=is_superadmin(request.user)
        if not admin and request.user.role!='agency':return envelope(message='گزارش عملکرد برای مدیر سامانه و دفتر املاک است.',code=403)
        q=request.query_params
        try:days=int(q.get('days',30))
        except (ValueError,TypeError):return envelope(message='دوره گزارش معتبر نیست.',code=400)
        if days not in (30,90,180,365):return envelope(message='دوره گزارش معتبر نیست.',code=400)
        group=q.get('group_by','city' if admin else 'expert')
        if group not in ('province','county','city','district','neighborhood','expert'):return envelope(message='نوع مقایسه معتبر نیست.',code=400)
        agency_id=q.get('agency')
        if agency_id and (not agency_id.isdigit() or not admin and str(request.user.pk)!=agency_id):return envelope(message='دسترسی به این دفتر مجاز نیست.',code=403)
        allusers={u.pk:u for u in get_user_model().objects.filter(role__in=['agency','expert']).select_related('agency_profile')}
        links=list(AgencyExpertLink.objects.order_by('created_at','id').values_list('expert_id','agency_id'))
        memberships=dict(links)
        if not admin:agency_id=str(request.user.pk)
        if agency_id:
            agency=allusers.get(int(agency_id))
            if not agency or agency.role!='agency':return envelope(message='دفتر پیدا نشد.',code=404)
            allowed={agency.pk}|{e for e,a in links if a==agency.pk}
        else:allowed=None
        today=timezone.localdate();start=today-timedelta(days=days-1);previous=start-timedelta(days=days)
        totals=empty();recent=empty();before=empty();groups={};timeline={str(start+timedelta(days=i)):empty() for i in range(days)}
        userlocations={pk:location(u,allusers,memberships) for pk,u in allusers.items()}
        filters={k:normalize(q.get(k)) for k in ('province','county','city','district','neighborhood') if q.get(k)}
        def add(metric,created,loc,creator_id):
            loc={**loc,'county':loc.get('county') or county_name(loc.get('province',''),loc.get('city',''))}
            if any(v not in [normalize(x) for x in values(loc.get(k))] for k,v in filters.items()):return
            totals[metric]+=1
            day=timezone.localdate(created) if timezone.is_aware(created) else created.date()
            current=start<=day<=today;old=previous<=day<start
            if current:recent[metric]+=1;timeline[str(day)][metric]+=1
            if old:before[metric]+=1
            labels=values(loc.get(group)) if group!='expert' else [str(creator_id)] if allusers.get(creator_id) and allusers[creator_id].role=='expert' else []
            if not labels and group!='expert':labels=['ثبت‌نشده']
            for label in dict.fromkeys(labels):
                name=(allusers[creator_id].full_name or allusers[creator_id].phone) if group=='expert' else str(label)
                path=[str(loc.get(k) or 'ثبت‌نشده') for k in ('province','county','city')[:{'province':0,'county':1,'city':2}.get(group,3)]] if group!='expert' else []
                key=normalize(' / '.join(path+[str(label)]))
                row=groups.setdefault(key,{'key':key,'label':name,'context':' / '.join(path),'totals':empty(),'recent':empty(),'previous':empty()})
                row['totals'][metric]+=1
                if current:row['recent'][metric]+=1
                if old:row['previous'][metric]+=1
        for pk,u in allusers.items():
            if allowed is None or pk in allowed:add('agencies' if u.role=='agency' else 'experts',u.date_joined,userlocations[pk],pk)
        properties=PropertyRecord.objects.all()
        activities=EstateActivity.objects.all()
        if allowed is not None:properties=properties.filter(created_by_id__in=allowed);activities=activities.filter(created_by_id__in=allowed)
        for record in properties.iterator():
            add('files' if record.kind=='file' else 'requests',record.created_at,record.data,record.created_by_id)
        for record in activities.iterator():
            add('contracts' if record.kind=='contracts' else 'followups',record.created_at,userlocations.get(record.created_by_id,{}),record.created_by_id)
        ordered=sorted(groups.values(),key=lambda r:(-sum(r['totals'].values()),r['label']))
        return envelope({'scope':'system' if admin and not agency_id else 'agency','group_by':group,'days':days,'start':str(start),'end':str(today),'totals':totals,'recent':recent,'previous':before,'groups':ordered,'timeline':[{'date':date,**counts} for date,counts in timeline.items()],'agencies':[{'id':u.pk,'name':getattr(getattr(u,'agency_profile',None),'agency_name','') or u.full_name} for u in allusers.values() if u.role=='agency' and (admin or u.pk==request.user.pk)],'notes':['آمار کل، موجودی ثبت‌شده است؛ ثبت جدید با دوره هم‌طول قبلی مقایسه می‌شود.','درخواست چندمنطقه‌ای در هر منطقه انتخاب‌شده شمرده می‌شود؛ جمع ردیف‌ها الزاماً برابر کل نیست.','موقعیت املاکی و کارشناس از نشانی ساختاریافته دفتر مرتبط است؛ موقعیت فایل و درخواست از خود رکورد است.','مبنای عملکرد کارشناس، رکوردهایی است که خودش ثبت کرده است.','ثبت‌نشده یعنی اطلاعات موقعیت در رکورد قدیمی وارد نشده است.']})

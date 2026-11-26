"""Role-scoped report aggregates with one shared filter predicate per report."""
from collections import Counter
from datetime import timedelta
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .property_api import normalize, serialize
from .analytics_api import county_name

METRICS = ('files', 'requests', 'contracts', 'followups', 'agencies', 'experts', 'customers')
GEOGRAPHY = ('province', 'county', 'city', 'district', 'neighborhood')
GROUPS = GEOGRAPHY + ('propertyType', 'office', 'expert', 'creatorRole')

def report(request, records, activities, people):
    from .dashboard_estate_api import matches, number, office_place
    from .models import AgencyExpertLink
    q = request.query_params.dict()
    try:
        days = int(q.get('days', 30))
    except (ValueError, TypeError):
        raise ValidationError('دوره گزارش معتبر نیست.')
    if days not in (7, 14, 30, 90, 180, 365):
        raise ValidationError('دوره گزارش معتبر نیست.')
    group_by = q.get('group_by', 'city')
    if group_by not in GROUPS:
        raise ValidationError('مبنای مقایسه معتبر نیست.')
    for key in ('office', 'expert'):
        if q.get(key) and not q[key].isdigit():
            raise ValidationError('شناسه دفتر یا کارشناس معتبر نیست.')
    for prefix in ('price', 'area'):
        for suffix in ('From', 'To'):
            key = prefix + suffix
            if q.get(key):
                value = number(normalize(q[key]).replace(',', ''))
                if value is None or value > 10**16:
                    raise ValidationError('بازه قیمت یا متراژ معتبر نیست.')
                q[key] = value
            else:
                q.pop(key, None)
        if q.get(prefix+'From', 0) > q.get(prefix+'To', float('inf')):
            raise ValidationError('حداکثر قیمت یا متراژ نباید کمتر از حداقل باشد.')
    today = timezone.localdate()
    start = today - timedelta(days=days-1)
    previous = start - timedelta(days=days)
    people = list(people)
    users = {user.pk: user for user in people}
    memberships = dict(AgencyExpertLink.objects.filter(expert_id__in=users).order_by('created_at', 'id').values_list('expert_id', 'agency_id'))
    office_names = {u.pk: getattr(getattr(u, 'agency_profile', None), 'agency_name', '') or u.full_name for u in people if u.role == 'agency'}
    expert_names = {u.pk: u.full_name or 'کارشناس' for u in people if u.role == 'expert'}
    def place(data):
        result = dict(data)
        if not result.get('county'):
            result['county'] = county_name(result.get('province', ''), result.get('city', ''))
        return result
    def accepts(data, creator, office_id, estate=True):
        if q.get('office') and str(office_id) != q['office']:
            return False
        if q.get('expert') and (creator.role != 'expert' or str(creator.pk) != q['expert']):
            return False
        if q.get('creatorRoles') and creator.role not in q['creatorRoles'].split('|'):
            return False
        if q.get('county') and normalize(q['county']) != normalize(data.get('county')):
            return False
        # Every property-specific filter also applies to a contract's linked property.
        if estate and not matches({**data, 'creatorRole': creator.role}, q):
            return False
        if not estate:
            if any(q.get(key) for key in ('propertyType','contractType','priceFrom','priceTo','areaFrom','areaTo')):
                return False
            return matches(data, q, estate=False)
        return True
    counts = {metric: {'total': 0, 'recent': 0, 'previous': 0} for metric in METRICS}
    timeline = {str(start+timedelta(days=i)): dict.fromkeys(METRICS, 0) for i in range(days)}
    groups, distribution, statuses = {}, Counter(), Counter()
    selected_files, selected_requests, selected_contracts = [], [], []
    def add(metric, created_at, data, creator, office_id):
        day = timezone.localdate(created_at)
        counts[metric]['total'] += 1
        if start <= day <= today:
            counts[metric]['recent'] += 1
            timeline[str(day)][metric] += 1
        elif previous <= day < start:
            counts[metric]['previous'] += 1
        if group_by == 'office': labels = [office_names.get(office_id, 'بدون دفتر')]
        elif group_by == 'expert': labels = [expert_names.get(creator.pk, 'ثبت‌کننده غیرکارشناس')]
        elif group_by == 'creatorRole': labels = [{'agency':'املاکی','expert':'کارشناس','user':'کاربر عادی','superadmin':'سوپرادمین'}.get(creator.role, creator.role)]
        else:
            raw = data.get(group_by)
            labels = raw if isinstance(raw, list) else [raw or 'ثبت‌نشده']
        # Prefix geographic keys to keep equally named neighborhoods in different cities separate.
        parents = GEOGRAPHY[:GEOGRAPHY.index(group_by)] if group_by in GEOGRAPHY else ()
        for label in dict.fromkeys(labels):
            context = ' / '.join(str(data.get(k) or '') for k in parents if data.get(k))
            key = context + ' / ' + str(office_id if group_by == 'office' else creator.pk if group_by == 'expert' else label)
            bucket = groups.setdefault(key, {'key': key, 'label': str(label), 'context': context, 'totals': dict.fromkeys(METRICS,0), 'recent': dict.fromkeys(METRICS,0), 'previous': dict.fromkeys(METRICS,0), 'timeline': {}})
            bucket['totals'][metric] += 1
            if start <= day <= today:
                bucket['recent'][metric] += 1
                bucket['timeline'].setdefault(str(day), dict.fromkeys(METRICS,0))[metric] += 1
            elif previous <= day < start:
                bucket['previous'][metric] += 1
    period_only = q.get('period_only') == '1'
    for row in records:
        if period_only and not start <= timezone.localdate(row.created_at) <= today:
            continue
        if row.archived_at:
            continue
        office_id = row.office_id or (row.created_by_id if row.created_by.role == 'agency' else memberships.get(row.created_by_id))
        data = place(row.data)
        if not accepts(data, row.created_by, office_id):
            continue
        metric = 'files' if row.kind == 'file' else 'requests'
        add(metric, row.created_at, data, row.created_by, office_id)
        if metric == 'files':
            selected_files.append(row)
            distribution[data.get('propertyType') or 'سایر'] += 1
        else:
            selected_requests.append(row)
            statuses[data.get('requestStatus') or 'جدید'] += 1
    for row in activities:
        if period_only and not start <= timezone.localdate(row.created_at) <= today:
            continue
        linked = row.property
        office_id = row.office_id or (linked.office_id if linked else None) or memberships.get(row.created_by_id)
        origin = linked.data if linked else office_place(users.get(office_id) or row.created_by)
        data = place(origin)
        if not accepts(data, row.created_by, office_id, estate=bool(linked)):
            continue
        metric = 'contracts' if row.kind == 'contracts' else 'followups'
        add(metric, row.created_at, data, row.created_by, office_id)
        if metric == 'contracts':
            selected_contracts.append(row)
    for user in people:
        if period_only and not start <= timezone.localdate(user.date_joined) <= today:
            continue
        office_id = user.pk if user.role == 'agency' else memberships.get(user.pk)
        data = place(office_place(users.get(office_id) or user))
        if accepts(data, user, office_id, estate=False):
            add({'agency':'agencies','expert':'experts','user':'customers'}[user.role], user.date_joined, data, user, office_id)
    market = [r for r in selected_files if r.data.get('contractType') == 'فروش' and number(r.data.get('area')) and number(r.data.get('totalPrice'))]
    def mean(rows):
        return round(sum(number(r.data['totalPrice']) for r in rows)/sum(number(r.data['area']) for r in rows)) if rows else None
    current = mean([r for r in market if start <= timezone.localdate(r.created_at) <= today])
    old = mean([r for r in market if previous <= timezone.localdate(r.created_at) < start])
    ordered = sorted(groups.values(), key=lambda r: (-sum(r['totals'].values()), r['key']))
    admin = request.user.role == 'superadmin' or request.user.is_superuser
    return {'counts': counts, 'groups': ordered, 'group_by': group_by, 'days': days, 'start': str(start), 'end': str(today),
        'timeline': [{'date': d, **v} for d,v in timeline.items()],
        'distribution': [{'label': label, 'count': count} for label,count in distribution.most_common()],
        'request_statuses': [{'label': label, 'count': count} for label,count in statuses.most_common()],
        'offices': [{'id': str(pk), 'name': name} for pk,name in office_names.items()],
        'experts': [{'id': str(pk), 'name': name} for pk,name in expert_names.items()],
        'recent_requests': [] if admin else [serialize(r, request.user) for r in sorted(selected_requests,key=lambda r:r.created_at,reverse=True)[:5]],
        'recent_contracts': [] if admin else [{**r.data,'id':r.pk,'created_at':r.created_at.isoformat()} for r in sorted(selected_contracts,key=lambda r:r.created_at,reverse=True)[:5]],
        'market_index': {'scope': ' / '.join(q[k] for k in GEOGRAPHY if q.get(k)) or 'همه محدوده‌های مجاز', 'sample_size': len(market), 'price_per_meter': mean(market),
            'mean_listing_age_days': round(sum(max(0,(today-timezone.localdate(r.created_at)).days) for r in market)/len(market)) if market else None,
            'change_percent': round((current-old)/old*100,1) if current is not None and old else None},
        'notes': ['فیلترها بر تمام اعداد این گزارش اعمال شده‌اند.', 'قرارداد و پیگیری فاقد ملک مرتبط، در فیلترهای نوع ملک، قیمت و متراژ شمرده نمی‌شوند.', 'موقعیت ملک ثبت‌شده مبنای قرارداد مرتبط است؛ موقعیت افراد از دفتر مرتبط است.', 'درخواست چندمنطقه‌ای در هر منطقه شمرده می‌شود؛ جمع گروه‌ها ممکن است با کل تفاوت داشته باشد.']}

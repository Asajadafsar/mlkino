"""Synthetic Qom data used only when the dashboard demo switch is enabled."""

DEMO_PLACE = {'province': 'قم', 'city': 'قم', 'district': 'منطقه ۳', 'neighborhood': 'امام خمینی'}
DEMO_OFFICE = {'id': 'demo-office', 'name': 'دفتر املاک نمونه قم'}


def dashboard_demo(filters, layers, matches, presence):
    records = [
        {'kind': 'agencies', 'title': DEMO_OFFICE['name'], 'online': True},
        {'kind': 'experts', 'title': 'مشاور نمونه', 'online': True},
        {'kind': 'users', 'title': 'کاربر نمونه', 'online': False},
        {'kind': 'files', 'title': 'آپارتمان نمونه دو خوابه', 'propertyType': 'آپارتمان',
         'contractType': 'فروش', 'totalPrice': 3600000000, 'area': 105, 'roomCount': 2},
        {'kind': 'requests', 'title': 'درخواست نمونه خرید آپارتمان', 'propertyType': 'آپارتمان',
         'contractType': 'فروش', 'areaFrom': 90, 'areaTo': 130},
        {'kind': 'contracts', 'title': 'قرارداد نمونه فروش'},
    ]
    results = []
    file_count = 0
    for i, record in enumerate(records):
        place = {**DEMO_PLACE, **record}
        if not matches(place, filters, estate=record['kind'] in ('files', 'requests')):
            continue
        if record['kind'] == 'files':
            file_count += 1
        if filters.get('office') and filters['office'] != DEMO_OFFICE['id']:
            continue
        if record['kind'] not in layers:
            continue
        if 'online' in record and presence != 'all' and record['online'] != (presence == 'online'):
            continue
        results.append({**place, 'id': str(i), 'latitude': 34.64 + i * .002, 'longitude': 50.88 + i * .002,
                        'precision': 'demo', 'count': 1, 'office': DEMO_OFFICE['name']})
    return {'rows': results, 'points': results, 'matching_items': len(results), 'mapped_items': len(results),
            'matching_files': file_count, 'mapped_files': sum(row['kind'] == 'files' for row in results),
            'offices': [DEMO_OFFICE] if matches(DEMO_PLACE, filters, estate=False) else []}

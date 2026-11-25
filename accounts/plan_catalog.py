"""Persistent plan catalog shared by administration and office onboarding."""
import re
from collections.abc import Mapping
from copy import deepcopy

from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.middleware import active_impersonation
from panel.settings_api import is_superadmin
from panel.settings_models import PanelSettings

LEGACY_CODES = ['free', 'pro', 'pro-plus', 'pro-max', 'diamond']
NAMES = ['رایگان', 'حرفه‌ای', 'حرفه‌ای پلاس', 'حرفه‌ای مکس', 'الماس']
PRICES = [0, 299000, 499000, 699000, 999000]
PROMOTIONS = [0, 3, 10, 25, 50]


def initial_catalog():
    capabilities = [
        dict(id=1, code='featured_limit', name='تعداد فایل ویژه هم‌زمان', category='تبلیغات',
             access_type='limit', description='', is_active=True, order=1),
        dict(id=2, code='ai_copy', name='پیشنهاد متن آگهی با هوش مصنوعی', category='هوش مصنوعی',
             access_type='toggle', description='', is_active=True, order=2),
    ]
    plans = []
    for i, (name, price, limit) in enumerate(zip(NAMES, PRICES, PROMOTIONS)):
        plans.append(dict(id=i+1, name=name, subtitle='اشتراک دفتر املاک', description='مدیریت دفتر و همکاری کارشناسان',
                          icon='diamond' if i == 4 else 'crown', color='#743bff' if i == 4 else '#246bfd',
                          monthly_price=price, annual_price=None, is_active=True, recommended=i == 1, order=i,
                          accesses=[dict(capability=1, enabled=limit > 0, limit=limit),
                                    dict(capability=2, enabled=i == 4, limit=None)]))
    return dict(plans=plans, capabilities=capabilities, next_plan=6, next_capability=3)


def catalog():
    data = PanelSettings.objects.filter(pk=1).values_list('data', flat=True).first() or {}
    return deepcopy(data.get('plan_catalog') or initial_catalog())


def code_for(plan_id):
    return LEGACY_CODES[plan_id-1] if plan_id <= len(LEGACY_CODES) else 'p-' + str(plan_id)


def plan_by_code(code, data=None):
    return next((plan for plan in (data or catalog())['plans'] if code_for(plan['id']) == code), None)


def entitlement(plan, capability_code, default=0, data=None):
    if not plan:
        return default
    data = data or catalog()
    capability = next((item for item in data['capabilities'] if item['code'] == capability_code and item['is_active']), None)
    if not capability:
        return default
    access = next((item for item in plan['accesses'] if item['capability'] == capability['id'] and item['enabled']), None)
    if not access:
        return default
    return access['limit'] if capability['access_type'] == 'limit' and access['limit'] is not None else (1000000 if capability['access_type'] == 'limit' else True)


class CatalogPrices(Mapping):
    def __iter__(self):
        return iter(code_for(plan['id']) for plan in catalog()['plans'] if plan['is_active'])

    def __len__(self):
        return sum(1 for _ in self)

    def __getitem__(self, code):
        data = catalog()
        plan = plan_by_code(code, data)
        if not plan:
            raise KeyError(code)
        return plan['monthly_price'], entitlement(plan, 'featured_limit', data=data)


class AccessSerializer(serializers.Serializer):
    capability = serializers.IntegerField(min_value=1)
    enabled = serializers.BooleanField()
    limit = serializers.IntegerField(min_value=0, allow_null=True)


class PlanSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    subtitle = serializers.CharField(max_length=200, allow_blank=True)
    description = serializers.CharField(max_length=4000, allow_blank=True)
    icon = serializers.CharField(max_length=40)
    color = serializers.RegexField(r'^#[a-fA-F0-9]{6}$')
    monthly_price = serializers.IntegerField(min_value=0, max_value=10**12, allow_null=True)
    annual_price = serializers.IntegerField(min_value=0, max_value=10**12, allow_null=True)
    is_active = serializers.BooleanField()
    recommended = serializers.BooleanField()
    order = serializers.IntegerField(min_value=0)
    accesses = AccessSerializer(many=True)


class CapabilitySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    code = serializers.RegexField(r'^[a-zA-Z0-9_-]{1,80}$')
    category = serializers.CharField(max_length=100)
    access_type = serializers.ChoiceField(choices=['toggle', 'limit'])
    description = serializers.CharField(max_length=2000, allow_blank=True)
    is_active = serializers.BooleanField()
    order = serializers.IntegerField(min_value=0)


class PlanCatalogView(APIView):
    permission_classes = [IsAuthenticated]

    def check_admin(self, request):
        if not is_superadmin(request.user) or active_impersonation(request):
            raise PermissionDenied()

    def get(self, request, collection, pk=None):
        self.check_admin(request)
        data = catalog()
        rows = data[collection]
        if pk:
            row = next((item for item in rows if item['id'] == pk), None)
            if row is None:
                raise NotFound()
            return Response(row)
        query = request.query_params
        search = query.get('search', '').casefold()
        rows = [row for row in rows if search in (row['name'] + ' ' + row.get('code', '')).casefold()]
        if query.get('is_active') in ('true', 'false'):
            rows = [row for row in rows if row['is_active'] == (query['is_active'] == 'true')]
        if query.get('category'):
            rows = [row for row in rows if row.get('category') == query['category']]
        try:
            page = max(1, int(query.get('page', 1)))
            size = min(100, max(1, int(query.get('page_size', 12))))
        except ValueError:
            raise ValidationError('صفحه معتبر وارد کنید.')
        rows.sort(key=lambda row: row['order'])
        return Response(dict(results=rows[(page-1)*size:page*size], total_results=len(rows),
                             categories=sorted({row['category'] for row in data['capabilities']}),
                             stats=dict(total=len(data['plans']), active=sum(row['is_active'] for row in data['plans']),
                                        capabilities=len(data['capabilities']), recommended=sum(row['recommended'] for row in data['plans']))))

    @transaction.atomic
    def mutate(self, request, collection, pk=None, delete=False):
        self.check_admin(request)
        obj, _ = PanelSettings.objects.select_for_update().get_or_create(pk=1)
        data = deepcopy(obj.data.get('plan_catalog') or initial_catalog())
        rows = data[collection]
        current = next((row for row in rows if row['id'] == pk), None)
        if pk and current is None:
            raise NotFound()
        if delete:
            if collection == 'plans':
                raise ValidationError('برای حفظ سابقه اشتراک، پلن را غیرفعال کنید.')
            if current['code'] in ('featured_limit', 'ai_copy') or any(
                access['capability'] == pk for plan in data['plans'] for access in plan['accesses']
            ):
                raise ValidationError('این قابلیت در پلن‌ها استفاده می‌شود.')
            rows.remove(current)
        else:
            serializer = (PlanSerializer if collection == 'plans' else CapabilitySerializer)(data=request.data)
            serializer.is_valid(raise_exception=True)
            row = serializer.validated_data
            if any(item['id'] != pk and (item['name'] == row['name'] or
                   collection == 'capabilities' and item['code'] == row['code']) for item in rows):
                raise ValidationError('نام یا شناسه تکراری است.')
            if collection == 'plans':
                ids = [access['capability'] for access in row['accesses']]
                if len(ids) != len(set(ids)) or set(ids) - {cap['id'] for cap in data['capabilities']}:
                    raise ValidationError('قابلیت‌های پلن معتبر نیستند.')
                if pk == 1 and (row['monthly_price'] != 0 or not row['is_active']):
                    raise ValidationError('پلن پایه باید رایگان و فعال باقی بماند.')
            elif current and (current['code'] != row['code'] or current['access_type'] != row['access_type']):
                raise ValidationError('شناسه و نوع قابلیت موجود قابل تغییر نیستند.')
            counter = 'next_plan' if collection == 'plans' else 'next_capability'
            if current:
                current.update(row)
                row = current
            else:
                row['id'] = data[counter]
                data[counter] += 1
                rows.append(row)
        obj.data = {**obj.data, 'plan_catalog': data}
        obj.save(update_fields=['data'])
        return Response(status=204) if delete else Response(row, status=200 if pk else 201)

    def post(self, request, collection):
        return self.mutate(request, collection)

    def patch(self, request, collection, pk):
        return self.mutate(request, collection, pk)

    def delete(self, request, collection, pk):
        return self.mutate(request, collection, pk, delete=True)

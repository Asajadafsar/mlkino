"""Optional, type-specific file details stored on the property record."""
from decimal import Decimal
from math import isfinite
from rest_framework import serializers

UTILITIES = ('آب', 'برق', 'گاز', 'تلفن', 'فاضلاب')
COMMON_BUILDING = {
    'landArea', 'buildingAge', 'renovated', 'hasPermit', 'density', 'parking', 'storage',
    'terrace', 'utilities', 'frontage',
}
COMMERCIAL = {'frontage', 'balcony', 'commercialUse', 'utilities', 'passageWidth'}
TYPE_FIELDS = {
    'باغ ویلا': {'utilities', 'landArea', 'buildingArea', 'waterHours', 'waterMinutes',
               'hasPermit', 'pool', 'structureType'},
    'ساختمان کلنگی': COMMON_BUILDING,
    'ساختمان ویلایی': COMMON_BUILDING | {'completionCertificate', 'passageWidth'},
    'تجاری': COMMERCIAL,
    'اداری': COMMERCIAL,
    'ساختمان یکجا': {'utilities', 'unitCount', 'unitsPerFloor', 'utilityType',
                    'unitAreas', 'completionCertificate', 'violationsPaid', 'floorPrices', 'priceMode'},
    'صنعتی': {'utilities', 'structureType', 'ceilingHeight', 'electricityType'},
    'زمین': {'utilities', 'passageWidth', 'frontage', 'hasPermit', 'density', 'permitType'},
    'پیش فروش': {'utilities', 'builderType', 'deliveryDate'},
}
BOOLEANS = {'renovated', 'hasPermit', 'parking', 'storage', 'terrace', 'pool',
            'completionCertificate', 'balcony', 'commercialUse', 'violationsPaid'}
DECIMALS = {'landArea', 'buildingArea', 'density', 'frontage', 'passageWidth', 'ceilingHeight'}
CHOICES = {
    'structureType': ('فلزی', 'تیر آهن', 'بتن', 'سوله', 'بنایی', 'چوبی', 'سایر'),
    'utilityType': ('اشتراکی', 'اختصاصی'),
    'electricityType': ('تک فاز', 'سه فاز'),
    'permitType': ('کشاورزی', 'تولیدی', 'دامداری', 'صنعتی'),
    'builderType': ('شخصی', 'شرکتی'),
    'priceMode': ('total', 'floor'),
}


class UnitArea(serializers.Serializer):
    area = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'), coerce_to_string=False)
    count = serializers.IntegerField(min_value=1, max_value=1000)


def clean_technical(kind, value, record):
    if not isinstance(value, dict):
        raise serializers.ValidationError({'technical': 'اطلاعات فنی معتبر نیست.'})
    fields = TYPE_FIELDS.get(kind, set())
    schema = {
        **{name: serializers.BooleanField() for name in BOOLEANS},
        **{name: serializers.FloatField(min_value=0, max_value=1e9) for name in DECIMALS},
        **{name: serializers.ChoiceField(choices=choices) for name, choices in CHOICES.items()},
        'utilities': serializers.ListField(
            child=serializers.ChoiceField(choices=UTILITIES[:3] if kind == 'باغ ویلا' else UTILITIES),
            max_length=5,
        ),
        'buildingAge': serializers.IntegerField(min_value=0, max_value=1000),
        'waterHours': serializers.IntegerField(min_value=0, max_value=9999),
        'waterMinutes': serializers.IntegerField(min_value=0, max_value=59),
        'unitCount': serializers.IntegerField(min_value=1, max_value=1000),
        'unitsPerFloor': serializers.IntegerField(min_value=1, max_value=1000),
        'unitAreas': UnitArea(many=True, max_length=100),
        'floorPrices': serializers.ListField(
            child=serializers.IntegerField(min_value=1, max_value=10**16, allow_null=True),
            max_length=100,
        ),
        'deliveryDate': serializers.CharField(max_length=32),
    }
    cleaned = {}
    for key in fields & value.keys():
        field = schema[key]
        raw = value[key]
        if raw in ('', None) or raw == []:
            continue
        if key == 'unitAreas' and isinstance(raw, list):
            raw = [row for row in raw if not isinstance(row, dict) or row.get('area') or row.get('count') not in (None, 0, 1)]
            if not raw:
                continue
        try:
            cleaned[key] = field.run_validation(raw)
            if type(cleaned[key]) is float and not isfinite(cleaned[key]):
                raise serializers.ValidationError('عدد معتبر وارد کنید.')
        except serializers.ValidationError as error:
            raise serializers.ValidationError({'technical': {key: error.detail}})
    if 'unitAreas' in cleaned:
        cleaned['unitAreas'] = [
            {'area': float(row['area']), 'count': row['count']} for row in cleaned['unitAreas']
        ]
        total_units = cleaned.get('unitCount')
        if total_units and sum(row['count'] for row in cleaned['unitAreas']) > total_units:
            raise serializers.ValidationError({'technical': 'تعداد واحدهای متراژبندی‌شده بیشتر از تعداد واحدهاست.'})
    if 'utilities' in cleaned:
        cleaned['utilities'] = list(dict.fromkeys(cleaned['utilities']))
    if 'floorPrices' in cleaned:
        floors = min(record.get('totalFloor') or 0, 100)
        cleaned['floorPrices'] = cleaned['floorPrices'][:floors]
    return cleaned

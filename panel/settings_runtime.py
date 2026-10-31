from django.core.cache import cache
from .settings_models import PanelSettings

def system_settings():
    value=cache.get('mlkino:system-settings')
    if value is None:
        obj=PanelSettings.objects.filter(pk=1).first()
        value=obj.data if obj and isinstance(obj.data,dict) else {}
        cache.set('mlkino:system-settings',value,5)
    return value

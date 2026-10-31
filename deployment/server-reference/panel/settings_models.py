from django.conf import settings
from django.db import models

class PanelSettings(models.Model):
    singleton_id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    class Meta:
        verbose_name = "تنظیمات پنل"
        verbose_name_plural = "تنظیمات پنل"
    def save(self, *args, **kwargs):
        self.singleton_id = 1
        super().save(*args, **kwargs)

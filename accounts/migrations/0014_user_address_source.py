from django.db import migrations,models
class Migration(migrations.Migration):
    dependencies=[('accounts','0013_agency_office_area')]
    operations=[migrations.AddField(model_name='user',name='address_source',field=models.CharField(max_length=16,blank=True,default=''))]

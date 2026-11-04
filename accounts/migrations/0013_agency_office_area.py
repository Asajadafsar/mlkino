from django.db import migrations,models
class Migration(migrations.Migration):
    dependencies=[('accounts','0012_user_national_code_image')]
    operations=[migrations.AddField(model_name='agencyprofile',name=name,field=models.CharField(max_length=150,blank=True)) for name in ('office_district','office_neighborhood')]

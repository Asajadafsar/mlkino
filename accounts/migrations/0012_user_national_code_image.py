from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0011_user_profile_updated_at_accountnotification_and_more")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="national_code_image",
            field=models.ImageField(blank=True, null=True, upload_to="identity/national-cards/", verbose_name="تصویر کارت ملی"),
        ),
    ]

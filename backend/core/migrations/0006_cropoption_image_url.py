# Generated migration for CropOption image_url field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_alert_alert_severity_idx_alert_alert_crop_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='cropoption',
            name='image_url',
            field=models.URLField(blank=True, help_text='AI-generated image URL for the crop', null=True),
        ),
    ]

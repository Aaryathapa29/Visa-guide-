from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0016_alter_booking_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='logo_url',
            field=models.TextField(blank=True, null=True),
        ),
    ]
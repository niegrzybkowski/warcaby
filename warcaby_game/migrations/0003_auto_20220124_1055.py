# Generated by Django 3.2.9 on 2022-01-24 10:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('warcaby_game', '0002_auto_20220124_0909'),
    ]

    operations = [
        migrations.AddField(
            model_name='gameroom',
            name='guest_ready',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='gameroom',
            name='host_ready',
            field=models.BooleanField(default=False),
        ),
    ]

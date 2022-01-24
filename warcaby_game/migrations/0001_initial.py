# Generated by Django 3.2.9 on 2022-01-24 09:03

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='GameRoom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('room_name', models.CharField(max_length=20)),
                ('host_player', models.CharField(max_length=32)),
                ('guest_player', models.CharField(max_length=32, null=True)),
                ('game_state', models.CharField(choices=[('G', 'Waiting for guest'), ('R', 'Waiting for readiness'), ('P', 'Playing')], max_length=1)),
                ('board_state_store', models.JSONField()),
            ],
        ),
    ]

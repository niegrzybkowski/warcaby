from django.db import models

# Create your models here.

class GameRoom(models.Model):
    GAME_STATES = [
        ('L', 'In lobby'),
        ('P', 'In game'),
        ('O', 'Game over')
    ]
    room_name = models.CharField(max_length=20, primary_key=True)
    host_player = models.CharField(max_length=32)
    guest_player = models.CharField(max_length=32, null=True, blank=True)

    game_state = models.CharField(max_length=1, choices=GAME_STATES)
    board_state_store = models.JSONField()
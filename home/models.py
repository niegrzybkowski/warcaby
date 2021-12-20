from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser
)

# Create your models here.

class Player(AbstractBaseUser):
    player_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=40)
    surname = models.CharField(max_length=50)
    login = models.CharField(max_length=30, unique=True)
    email = models.EmailField(max_length=200, unique=True)


class Room(models.Model):
    room_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    player_id = models.ForeignKey(Player, on_delete=models.CASCADE)
    second_player_id = models.OneToOneField(Player, on_delete=models.CASCADE)
    date_of_creation = models.DateTimeField(auto_now_add=True, blank=True)





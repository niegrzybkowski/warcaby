from django.http.request import HttpRequest
from django.shortcuts import render
from django.http import HttpResponse


# Create your views here.
from . import config


def home(req: HttpRequest):
    if req.method == 'GET' and "name" in req.GET.keys():
        return HttpResponse(f"Hello, {req.GET['name']}")
    else:
        return HttpResponse(f"<h1>Hello, stranger!")

def createRoom(player):
    room = Room.objects.create(player_id = player.player_id)

def createSpace():
    with open(f'space{config.it}.html') as f:
        f.write('<h1>I am room no 1</h1>')
    config.it += 1





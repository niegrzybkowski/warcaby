from django.http.request import HttpRequest
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.http import Http404


# Create your views here.


def home(request):
    if request.method == "POST":
        if request.POST.get("gra"):
            tryb = request.POST.get("tryb")
            if(tryb == "lokalnie"):
                return render(request, "game/game_local.html")
            if (tryb == "online"):
                return render(request, "index2.html")
        elif request.POST.get("konfiguracja"):
            return render(request, "configuration.html")
        elif request.POST.get("create_room"):
            room_code = request.POST.get("room_code")
            return redirect(
                '/play/%s?'
                % (room_code)
            )
    return render(request, "index.html", {})

def game(request, room_code):
    context = {
        "room_code": room_code
    }
    return render(request, "game.html", context)

def createRoom(player):
    room = Room.objects.create(player_id = player.player_id)

def createSpace():
    with open(f'space{config.it}.html') as f:
        f.write('<h1>I am room no 1</h1>')
    config.it += 1




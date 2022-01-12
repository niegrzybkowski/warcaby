from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render

# Create your views here.

DEFAULT_BOARD_CONFIG = {
    "size":8,
    "starting_rows":3,
    "starting_player":"white"
}

IMMUTABLE_BOARD_CONFIG = {
    "controllable_sides": ["white", "black"]
}

def local(req: HttpRequest):
    config = DEFAULT_BOARD_CONFIG.copy()
    for key in config.keys():
        if key in req.GET: # TODO: GET is temporary, change to POST once config site is ready
            config[key] = req.GET[key]
    
    config |= IMMUTABLE_BOARD_CONFIG
    return HttpResponse(render(
        req, 
        "game/game_local.html", 
        context={"config": config}))

def new(req: HttpRequest):
    # demo do session_key, jak robimy bez rejestracji, to session_key po prostu zastępuje usera
    if req.session.test_cookie_worked():
        print(req.session.session_key)
    else:
        req.session.set_test_cookie()
    return HttpResponse("Hi!")


def local(request):
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


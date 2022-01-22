from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render, redirect

# Create your views here.

DEFAULT_BOARD_CONFIG = {
    "size":8,
    "starting_rows":3,
    "starting_player":"white"
}

IMMUTABLE_BOARD_CONFIG = {
    "controllable_sides": ["white", "black"]
}

def home(req):
    return render(req, "warcaby/home.html")


def local_main(req):
    return render(req, "warcaby/local/main.html")


def local_new(req):
    return render(req, "warcaby/local/config.html")


def local_game(req: HttpRequest):
    config = DEFAULT_BOARD_CONFIG.copy()
    for key in config.keys():
        if key in req.GET: # TODO: GET is temporary, change to POST once config site is ready
            config[key] = req.GET[key]
    
    #config |= IMMUTABLE_BOARD_CONFIG

    config = config.copy()
    config.update(IMMUTABLE_BOARD_CONFIG)

    return HttpResponse(render(
        req, 
        "warcaby/local/game.html", 
        context={"config": config}))


def online_main(req):
    return render(req, "warcaby/online/main.html")

# TODO: do zamienienia na model
TEST_GAME_LIST = {
     "game_list": [ 
        {
            "room_name": "aaa",
            "is_protected": True,
            "board_configuration": {
                "size":8,
                "starting_rows": 2,
                "starting_player": "black"
            },
            "multiplayer_configuration": {
                "white_player": "SESSION ID GRACZA",
                "black_player": "SESSION ID GRACZA"
            }
        },
        {
            "room_name": "dwa",
            "is_protected": False,
            "board_configuration" : DEFAULT_BOARD_CONFIG,
            "multiplayer_configuration": {
                "white_player": "SESSION ID GRACZA",
                "black_player": "SESSION ID GRACZA"
            }
        },
        {
            "room_name": "trzy",
            "is_protected": False,
            "board_configuration": DEFAULT_BOARD_CONFIG,
            "multiplayer_configuration": {
                "white_player": "SESSION ID GRACZA",
                "black_player": "SESSION ID GRACZA"
            }
        }
    ]
}

def online_list(req):
    game_list = TEST_GAME_LIST
    return render(req, "warcaby/online/list.html", game_list)


def online_new(req):
    pass


def online_lobby(req: HttpRequest, room_id):
    game_list = TEST_GAME_LIST["game_list"]
    for room in game_list:
        if room["room_name"] == room_id:
            control = {}
            if "id_gracza" in req.session:
                if room["multiplayer_configuration"]["white_player"] == req.session["id_gracza"]:
                    control = {"controlling": "white"}
                elif room["multiplayer_configuration"]["black_player"] == req.session["id_gracza"]:
                    control = {"controlling": "black"}
                else:
                    # redirect, wynocha
                    pass
            
            return render(
                req, "warcaby/online/lobby.html",
                #room | control
            room.update(control)
            )
    return redirect("/online/list", error="game_not_found")
    


def online_game(req, room_id):
    game_list = TEST_GAME_LIST["game_list"]
    for room in game_list:
        if room["room_name"] == room_id:
            return render(req, "warcaby/online/game.html", room | {"config" : DEFAULT_BOARD_CONFIG | IMMUTABLE_BOARD_CONFIG})
    return redirect("/online/list", error="game_not_found")


# def new(req: HttpRequest):
#     # demo do session_key, jak robimy bez rejestracji, to session_key po prostu zastępuje usera
#     if req.session.test_cookie_worked():
#         print(req.session.session_key)
#     else:
#         req.session.set_test_cookie()
#     return HttpResponse("Hi!")


# def local(request):
#     if request.method == "POST":
#         if request.POST.get("gra"):
#             tryb = request.POST.get("tryb")
#             if(tryb == "lokalnie"):
#                 return render(request, "game/game_local.html")
#             if (tryb == "online"):
#                 return render(request, "index2.html")
#         elif request.POST.get("konfiguracja"):
#             return render(request, "configuration.html")
#         elif request.POST.get("create_room"):
#             room_code = request.POST.get("room_code")
#             return redirect(
#                 '/play/%s?'
#                 % (room_code)
#             )
#     return render(request, "index.html", {})

# def game(request, room_code):
#     context = {
#         "room_code": room_code
#     }
#     return render(request, "game.html", context)

# def createRoom(player):
#     room = Room.objects.create(player_id = player.player_id)

# def createSpace():
#     with open(f'space{config.it}.html') as f:
#         f.write('<h1>I am room no 1</h1>')
#     config.it += 1


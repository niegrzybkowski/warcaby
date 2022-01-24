from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render, redirect
import string
import random
from .models import GameRoom

# Create your views here.

DEFAULT_BOARD_CONFIG = {
    "size":8,
    "starting_rows":3,
    "starting_player":"white",
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
        if key in req.GET: 
            config[key] = req.GET[key]

    return HttpResponse(render(
        req, 
        "warcaby/local/game.html", 
        context={
            "board_config": config,
            "online_config": IMMUTABLE_BOARD_CONFIG}))
       

def online_main(req: HttpRequest):
    if "player_name" not in req.session:
        req.session["player_name"] = ''.join(random.choices(string.ascii_uppercase + string.digits, k=32))
    print(req.session["player_name"])
    return render(req, "warcaby/online/main.html")

def online_list(req):
    if "player_name" not in req.session:
        redirect("/online", error="no_cookie")
    game_list = {"game_list": GameRoom.objects.exclude(game_state='O').order_by("room_name")[:]}
    return render(req, "warcaby/online/list.html", game_list)


def online_new(req):
    if "player_name" not in req.session:
        redirect("online_main")
    return render(req, "warcaby/online/config.html")

def online_create(req: HttpRequest):
    if "player_name" not in req.session:
        redirect("online_main", error="no_cookie")
    try:
        player = req.session["player_name"]
        data = req.POST
        room_name = data["name"]
        if not room_name.isalnum():
            raise Exception("room name not alnum")
        
        room_size = int(data["size"]) 
        if room_size < 4:
            raise Exception("too small")
        
        room_start_rows = int(data["starting_rows"]) 
        if room_start_rows * 2 + 2 > room_size:
            raise Exception("too many starting rows")

        room_starting_player = data["starting_player"]
        if room_starting_player not in ["white", "black"]:
            raise Exception("invalid starting player")

        if GameRoom.objects.filter(pk = room_name).exclude(game_state = 'O').exists():
            raise Exception("exists")
        
        if GameRoom.objects.filter(pk = room_name).exists():
            GameRoom.objects.get(pk = room_name).delete()

        fields = {}
        white_pawn = {
            "color": "white",
            "queen": False
        }
        black_pawn = {
            "color": "black",
            "queen": False
        }

        for row_idx in range(1, room_size+1):
            for column_idx in range(1, room_size+1):
                position = f"{row_idx}_{column_idx}"
                pawn = None

                if row_idx <= room_start_rows and ((row_idx + column_idx) % 2 == 1):
                    pawn = black_pawn
                elif room_size - row_idx < room_start_rows and ((row_idx + column_idx) % 2 == 1):
                    pawn = white_pawn
                
                fields[position] = {
                    "color": "white" if ((row_idx + column_idx) % 2 == 0) else "black",
                    "pawn": pawn.copy() if pawn is not None else None
                }

        starting_board = {
            "configuration": {
                "size": room_size,
                "starting_rows": room_start_rows,
                "starting_player": "white"
            },
            "fields": fields,
            "current_move": "white",
            "turn_number": 0
        }

        GameRoom.objects.create(
            room_name = room_name,
            host_player = player,
            guest_player = None,
            game_state = 'L',
            board_state_store = starting_board
        )
        return redirect("online_lobby", room_name=room_name)
    except Exception as e:
        print(e)
        return redirect("online_new")


def online_lobby(req: HttpRequest, room_name):
    if "player_name" not in req.session:
        redirect("/online", error="no_cookie")
    room = GameRoom.objects.get(pk=room_name)
    if room.game_state == 'P':
        return redirect("online_game", room_name=room_name)

    player = req.session["player_name"]
    control = ""
    if player == room.host_player:
        control = "white"
    elif player == room.guest_player:
        control = "black"
    elif room.guest_player is None:
        print("setting")
        room.guest_player = player
        room.save()
        control = "black"
    else:
        return redirect("/online/list", error="not_allowed")                   
    
    return render(
        req, "warcaby/online/lobby.html",
        {
            "room": room,
            "control": control
        }
    )    


def online_game(req, room_name):
    if "player_name" not in req.session:
        redirect("/online", error="no_cookie")
    room = GameRoom.objects.get(room_name=room_name)
    if room.game_state == 'L':
        return redirect("online_lobby", room_name=room_name)
    player = req.session["player_name"]
    control = ""
    if player == room.host_player:
        control = "white"
    elif player == room.guest_player:
        control = "black"
    else:
        return redirect("/online/list", error="not_allowed") 

    return render(req, "warcaby/online/game.html", {
        "room": room,
        "board_config":DEFAULT_BOARD_CONFIG,
        "online_config":{"controllable_sides":[control]}})
    

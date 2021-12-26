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
    print(req.session.session_key)
    return HttpResponse("Hi!")


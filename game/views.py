from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render

# Create your views here.

def local(req: HttpRequest):
    return HttpResponse(render(req, "game/game_local.html"))

def test(req: HttpRequest):
    return HttpResponse("Hi!")


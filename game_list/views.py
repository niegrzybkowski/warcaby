from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def jeden(req):
    return HttpResponse("Numer 1")


def dwa(req):
    return HttpResponse("Numer 2")

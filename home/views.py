from django.http.request import HttpRequest
from django.shortcuts import render
from django.http import HttpResponse


# Create your views here.
def home(req: HttpRequest):
    if req.method == 'GET' and "name" in req.GET.keys():
        return HttpResponse(f"Hello, {req.GET['name']}")
    else:
        return HttpResponse(f"Hello, stranger!")
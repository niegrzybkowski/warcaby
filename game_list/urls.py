from django.urls import path
from . import views


urlpatterns = [
    path("1/", views.jeden),
    path("2/", views.dwa)
]

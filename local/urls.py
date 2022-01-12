from django.urls import path
from local import views
from local.views import game
from local.views import local

urlpatterns = [
    path('new/', views.new),
    path('play/', views.local),
    path('play/<room_code>', game),
    path('', local),
]

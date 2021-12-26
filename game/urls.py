from django.urls import path
from game import views

urlpatterns = [
    path('room/1/', views.test),
    path('local/', views.local)
]

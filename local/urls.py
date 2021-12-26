from django.urls import path
from local import views

urlpatterns = [
    path('new/', views.new),
    path('play/', views.local)
]

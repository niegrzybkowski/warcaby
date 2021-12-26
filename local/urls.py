from django.urls import path
from local import views

urlpatterns = [
    path('new/', views.test),
    path('play/', views.local)
]

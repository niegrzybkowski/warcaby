"""warcaby URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from local import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name="home"),
    path('local/', views.local_main, name="local_main"),
    path('local/new/', views.local_new, name="local_new"),
    path('local/play/', views.local_game, name="local_game"),
    path('online/', views.online_main, name="online_main"),
    path('online/list/', views.online_list, name="online_list"),
    path('online/new', views.online_new, name="online_new"),
    path('online/room/<str:room_id>/lobby', views.online_lobby, name="online_lobby"),
    path('online/room/<str:room_id>/play', views.online_game, name="online_game"),
    path('admin/', admin.site.urls),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

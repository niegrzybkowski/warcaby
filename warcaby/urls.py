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
from django.urls import path, include
from local import views
from django.conf import settings
from django.conf.urls.static import static
from local.views import local
from local.views import game

urlpatterns = [
    path('', views.local, name="local"),
    # path('online/', include('online.urls')), # <- TODO: Target
    path('admin/', admin.site.urls),
    path('', local),
    path('play/<room_code>', game),
    path('new/', views.new),
    path('play/', views.local)
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

"""
ASGI config for warcaby project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os
import django
from channels.http import AsgiHandler
from channels.routing import ProtocolTypeRouter

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'warcaby.settings')
django.setup()

application = ProtocolTypeRouter({
  "http": AsgiHandler(),
})

application = get_asgi_application()

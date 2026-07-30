"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

import django
from django.core.asgi import get_asgi_application

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django before importing other modules
django.setup()

# ruff: noqa: E402 -- these must follow django.setup() above.
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

from social.middleware import JWTAuthMiddlewareStack
from social.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # Origin validation compares against ALLOWED_HOSTS, so a page on another
    # origin cannot open a socket with a stolen token.
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})

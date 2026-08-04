"""
ASGI config for visa_backend project.
"""

import os
from urllib.parse import parse_qs

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'visa_backend.settings')

django_asgi_app = get_asgi_application()

import chat.routing

@database_sync_to_async
def get_user_from_token(token):
    try:
        from rest_framework_simplejwt.authentication import JWTAuthentication

        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        return jwt_auth.get_user(validated_token)
    except Exception:
        return AnonymousUser()

class QueryAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return QueryAuthMiddlewareInstance(scope, self)

class QueryAuthMiddlewareInstance:
    def __init__(self, scope, middleware):
        self.scope = dict(scope)
        self.inner = middleware.inner

    async def __call__(self, receive, send):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            self.scope['user'] = await get_user_from_token(token)
        else:
            self.scope['user'] = AnonymousUser()

        return await self.inner(self.scope)(receive, send)

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        QueryAuthMiddleware(URLRouter(chat.routing.websocket_urlpatterns))
    ),
})

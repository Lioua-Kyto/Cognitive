import logging
from urllib.parse import parse_qs

import jwt
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken

logger = logging.getLogger(__name__)

User = get_user_model()


@database_sync_to_async
def get_user(token_key):
    try:
        UntypedToken(token_key)
        decoded_data = jwt.decode(token_key, settings.SECRET_KEY, algorithms=['HS256'])
        return User.objects.get(id=decoded_data['user_id'])
    except (InvalidToken, TokenError, jwt.DecodeError) as exc:
        logger.warning('WebSocket auth rejected: %s', exc)
    except User.DoesNotExist:
        logger.warning('WebSocket auth: token references a deleted user')
    except KeyError:
        logger.warning('WebSocket auth: token has no user_id claim')
    return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Close old database connections to prevent usage of timed out connections
        close_old_connections()

        # Get the token from query string
        query_params = parse_qs(scope['query_string'].decode())
        token = query_params.get('token')

        if token:
            scope['user'] = await get_user(token[0])
        else:
            logger.warning('WebSocket connection attempt with no token')
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)

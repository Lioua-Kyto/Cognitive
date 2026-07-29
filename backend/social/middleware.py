from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from urllib.parse import parse_qs
import jwt

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        print(f"Attempting to authenticate with token: {token_key[:20]}...")
        
        # Decode the token
        UntypedToken(token_key)
        decoded_data = jwt.decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
        print(f"Token decoded successfully: user_id={decoded_data.get('user_id')}")
        
        user = User.objects.get(id=decoded_data["user_id"])
        print(f"User found: {user}")
        return user
    except (InvalidToken, TokenError) as e:
        print(f"JWT token error: {e}")
        return AnonymousUser()
    except User.DoesNotExist as e:
        print(f"User not found: {e}")
        return AnonymousUser()
    except KeyError as e:
        print(f"Missing key in token: {e}")
        return AnonymousUser()
    except jwt.DecodeError as e:
        print(f"JWT decode error: {e}")
        return AnonymousUser()
    except Exception as e:
        print(f"Unexpected error during authentication: {e}")
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
        query_params = parse_qs(scope["query_string"].decode())
        token = query_params.get("token")
        
        print(f"WebSocket connection attempt. Query params: {query_params}")
        
        if token:
            token_key = token[0]
            print(f"Token found in query params: {token_key[:20]}...")
            scope["user"] = await get_user(token_key)
            print(f"User authenticated: {scope['user']}")
        else:
            print("No token found in query params")
            scope["user"] = AnonymousUser()
            
        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)

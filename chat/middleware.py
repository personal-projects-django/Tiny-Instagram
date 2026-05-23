# chat/middleware.py
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token_key):
    from account.models import User
    try:
        token = AccessToken(token_key)
        return User.objects.get(id=token['user_id'])
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # توکن از query string: ws://...?token=xxx
        from urllib.parse import parse_qs
        query = parse_qs(scope['query_string'].decode())
        token = query.get('token', [None])[0]

        scope['user'] = (
            await get_user_from_token(token)
            if token else AnonymousUser()
        )
        return await super().__call__(scope, receive, send)
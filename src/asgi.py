import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')

# مهم: get_asgi_application اول صدا زده بشه قبل از هر import دیگه
django_asgi_app = get_asgi_application()

# حالا که Django آماده‌ست، می‌تونیم بقیه رو import کنیم
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.middleware import JWTAuthMiddleware
import chat.routing

application = ProtocolTypeRouter({
    'http'     : django_asgi_app,
    'websocket': JWTAuthMiddleware(
        URLRouter(chat.routing.websocket_urlpatterns)
    ),
})
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mlkino.settings')
from django.core.asgi import get_asgi_application
http_application = get_asgi_application()
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator
from django.conf import settings
from panel.ws_auth import CookieJWTASGIMiddleware
from panel.ws_routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': http_application,
    'websocket': OriginValidator(CookieJWTASGIMiddleware(URLRouter(websocket_urlpatterns)), settings.MLKINO_WS_ALLOWED_ORIGINS),
})

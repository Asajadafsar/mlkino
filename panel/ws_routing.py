from django.urls import re_path
from .ws_consumers import ChatConsumer
websocket_urlpatterns = [re_path(r'^ws/chats/(?P<chat_id>[0-9]+)/$', ChatConsumer.as_asgi())]

from django.urls import path, re_path

from privatemessages.consumers import MessagesHandler
from wall.wall import WallHandler

websocket_urlpatterns = [
    re_path(r'^(?P<room_code>\w+)/$', MessagesHandler.as_asgi()),
    path(r'', WallHandler.as_asgi()),
]

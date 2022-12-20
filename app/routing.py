from django.conf.urls import url

from privatemessages.consumers import MessagesHandler
from wall.wall import WallHandler

websocket_urlpatterns = [
    url(r'^(?P<room_code>\w+)/$', MessagesHandler.as_asgi()),
    url(r'', WallHandler.as_asgi()),
]

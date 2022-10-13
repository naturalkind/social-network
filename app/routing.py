from django.conf.urls import url

from privatemessages.consumers import MessagesHandler
from wall.wall import WallHandler
from comment.comment import CommentHandler

websocket_urlpatterns = [
    url(r'^(?P<room_code>\w+)/$', MessagesHandler.as_asgi()),
    url(r'^comment/(?P<post_id>\w+)/$', CommentHandler.as_asgi()),
    url(r'', WallHandler.as_asgi()),
]

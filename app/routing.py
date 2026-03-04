from django.urls import path, re_path
from . import consumers

websocket_urlpatterns = [
    # Стена (общая комната)
    path(r'', consumers.SocialConsumer.as_asgi()),
    # Приватные сообщения (комнаты с кодом)
    re_path(r'^(?P<room_code>\w+)/$', consumers.SocialConsumer.as_asgi()),
]


from django.urls import path
from django.urls import re_path
from . import views as mapp
urlpatterns = [
        path(r'send_message/', mapp.send_message_view),
        re_path(r'chat/(?P<thread_id>\d+)/$', mapp.chat_view),
        path(r'', mapp.messages_view),
    ]

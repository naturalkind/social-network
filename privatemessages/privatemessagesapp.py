import datetime
import json
import time
import urllib

import brukva
import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.httpclient

from django.conf import settings
from importlib import import_module

session_engine = import_module(settings.SESSION_ENGINE)

from myapp.models import User

from privatemessages.models import Thread


class MessagesHandler(tornado.websocket.WebSocketHandler):
    def __init__(self, *args, **kwargs):
        super(MessagesHandler, self).__init__(*args, **kwargs)
        self.client = brukva.Client()
        self.client.connect()

    def open(self, thread_id):
        self.thread_id = thread_id
        session_key = self.get_cookie(settings.SESSION_COOKIE_NAME)
        session = session_engine.SessionStore(session_key)
        try:
            self.user_id = session["_auth_user_id"]
            self.sender_name = User.objects.get(id=self.user_id).username
        except (KeyError, User.DoesNotExist):
            self.close()
            return
        if not Thread.objects.filter(id=thread_id, participants__id=self.user_id).exists():
            self.close()
            return
              
        self.channel = "".join([thread_id])     
        self.client.subscribe(self.channel)
        self.client.listen(self.show_new_message)

    def handle_request(self, response):
        pass

    def on_message(self, message):
        if not message:
            return
        if len(message) > 10000:
            return
        http_client = tornado.httpclient.AsyncHTTPClient()
        request = tornado.httpclient.HTTPRequest(
            "".join([
                        settings.SEND_MESSAGE_API_URL,
                        "/",
                        self.thread_id,
                        "/"
                    ]),
            method="POST",
            body=urllib.urlencode({
                "message": message.encode("utf-8"),
                "api_key": settings.API_KEY,
                "sender_id": self.user_id,
            })
        )
        print ("on_message", message, settings.SEND_MESSAGE_API_URL)
        http_client.fetch(request, self.handle_request)

    def show_new_message(self, result):
        self.write_message(str(result.body))

    def check_origin(self, origin):
        return True

    def on_close(self):
        try:
            self.client.unsubscribe(self.channel)
        except AttributeError:
            pass
        def check():
            if self.client.connection.in_progress:
                tornado.ioloop.IOLoop.instance().add_timeout(
                    datetime.timedelta(0.00001),
                    check
                )
            else:
                self.client.disconnect()
        tornado.ioloop.IOLoop.instance().add_timeout(
            datetime.timedelta(0.00001),
            check
        )

application = tornado.web.Application([
    (r'/(?P<thread_id>\d+)/', MessagesHandler),
])

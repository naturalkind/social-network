#-*- coding: utf-8 -*-
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

#from django.contrib.auth.models import User

from myapp.models import *

c = brukva.Client()
c.connect()

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header('Content-Type', 'text/plain')
        self.write('WORK')

class MessagesHandler(tornado.websocket.WebSocketHandler):
    def __init__(self, *args, **kwargs):
        super(MessagesHandler, self).__init__(*args, **kwargs)
        self.client = brukva.Client()
        self.client.connect()

    def open(self, post_id):
        session_key = self.get_cookie(settings.SESSION_COOKIE_NAME)
        session = session_engine.SessionStore(session_key)
        try:
            self.user_id = session["_auth_user_id"]
            self.sender_name = User.objects.get(id=self.user_id).username
        except (KeyError, User.DoesNotExist):
            self.close()
            return
        if not Post.objects.filter(id=post_id).exists():
            self.close()
            return
        self.channel = "".join(['post_', post_id,'_comments'])
        self.client.subscribe(self.channel)
        self.post_id = post_id
        self.client.listen(self.show_new_message)

    def handle_request(self, response):
        pass


    def on_message(self, message):
        if not message:
            return
        d = json.loads(message)
        dt = d['comment_text']
        try:
            di = d['comment_image']
        except KeyError:
            di = 'none'

        http_client = tornado.httpclient.AsyncHTTPClient()
        request = tornado.httpclient.HTTPRequest(
            "".join([   "http://192.168.1.50:8888/commentapi/",
                        self.post_id,
                        "/"
                    ]),
            method="POST",
            body=json.dumps({
                "comment_text": dt,
                # "api_key": settings.API_KEY,
                "comment_image": di,
                "comment_user": self.user_id,
            })

        )
        c.publish(self.channel, json.dumps({
            "user_post": self.sender_name,
            "title": dt,
            "img": di
        }))
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
    def on_connection_close(self):

        tornado.web.RequestHandler.on_connection_close(self)


application = tornado.web.Application([
    (r"/", MainHandler),
    (r'/(?P<post_id>\d+)/', MessagesHandler),
])

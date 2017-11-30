#-*- coding: utf-8 -*-
import datetime
import json
import time
import urllib

import tornadoredis
import brukva
import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.httpclient


from django.conf import settings
from importlib import import_module

session_engine = import_module(settings.SESSION_ENGINE)

from django.contrib.auth.models import User
from django.utils import dateformat
from myapp.models import Post
import base64
import re
import os, uuid

c = brukva.Client()
c.connect()

class MessagesHandler(tornado.websocket.WebSocketHandler):  # старница сообщения
    def __init__(self, *args, **kwargs):
        super(MessagesHandler, self).__init__(*args, **kwargs)
        self.client = brukva.Client()
        self.client.connect()

    def open(self): #открываю по ид переписка thread_id
        session_key = self.get_cookie(settings.SESSION_COOKIE_NAME) #получение апи
        session = session_engine.SessionStore(session_key)
        try:
            self.user_id = session["_auth_user_id"]    #получения пользователя
            self.sender_name = User.objects.get(id=self.user_id).username
        except (KeyError, User.DoesNotExist):
            self.close()
            return

        self.channel = "".join(["/"])
        self.client.subscribe(self.channel)
        self.client.listen(self.show_new_message)

    def handle_request(self, response):
        pass

    def on_message(self, message):


        d = json.loads(message)
        dt = d['title']
        db = d['body']
        di = d['image']
        try:
            dv = d['video']
        except KeyError:
            dv = 'ok'

        print dt, settings.SEND_POST_API_URL
        http_client = tornado.httpclient.AsyncHTTPClient()
        request = tornado.httpclient.HTTPRequest("".join([ settings.SEND_POST_API_URL, "/" ]),
            method="POST",
            body=json.dumps({
                "title": dt,
                "body": db,
                "image": di,
                # "nameFile": nameFile,
                # "video": cname,
                "video": dv,
                # "audio": da,
                "user_post": self.sender_name,
                # "user_post":du

            })
        )
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
      (r"/", MessagesHandler),
])

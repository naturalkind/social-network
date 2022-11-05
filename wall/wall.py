import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User, Post
from importlib import import_module

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async

import asyncio
import aioredis
import async_timeout
import re
import redis
import time
import uuid
import base64, io
session_engine = import_module(settings.SESSION_ENGINE)
        

class WallHandler(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = "wall"
        self.sender_id = self.scope['user'].id
        self.room_group_name = self.room_name
        self.sender_name = self.scope['user']
        if str(self.scope['user']) != 'AnonymousUser':
            self.image_user = self.scope['user'].image_user
            self.path_data = self.scope['user'].path_data
            self.namefile = str()
        print ("CHANNEL_LAYERS", self.channel_name, self.room_group_name)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()


    async def disconnect(self, close_code):
        print("Disconnected", close_code)
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """
        Receive message from WebSocket.
        Get the event and send the appropriate event
        """
        response = json.loads(text_data)
        event = response.get("event", None)
        if event == "wallpost":
            user_postv = await database_sync_to_async(User.objects.get)(id=self.sender_id)
            post = Post()
            post.title = response["title"]
            post.body = response["body"]
            post.image = self.namefile
            post.path_data = self.path_data
            post.user_post = user_postv
            post_async = sync_to_async(post.save)
            await post_async()

            _data = {"type": "wallpost",
                     "timestamp": dateformat.format(post.date_post, 'U'),
                     "image": self.namefile,
                     "text":response["body"],
                     "user_post": str(self.sender_name),
                     "user_id": self.sender_id,
                     "title": response["title"],
                     "id": post.id,
                     "image_user" : self.image_user, 
                     "path_data" : self.path_data,
                     "status" : "wallpost"
                    }
            await self.channel_layer.group_send(self.room_group_name, _data)
            
        if event == "Start":
            self.namefile = f'{str(uuid.uuid4())[:12]}_{response["Name"]}'
            self.myfile = open(f'media/data_image/{self.path_data}/{self.namefile}', "wb")
            
            _data = {"type": "wallpost", "status":"MoreData"}
            await self.channel_layer.group_send(self.room_group_name, _data)

        if event == "Upload":
            da = response["Data"]
            da = da.split(",")[1]
            file_bytes = io.BytesIO(base64.b64decode(da)).read()
            self.myfile.write(file_bytes)
            _data = {"type": "wallpost", "status":"MoreData"}
            await self.channel_layer.group_send(self.room_group_name, _data)
            
        if event == "Done":
            _data = {"type": "wallpost", "status":"Done"}
            await self.channel_layer.group_send(self.room_group_name, _data)

        
        if event == "deletepost":
            post = await database_sync_to_async(Post.objects.get)(id=response["id"])
            await sync_to_async(post.delete)()
            _data = {"type": "wallpost", "status":"deletepost"}
            await self.channel_layer.group_send(self.room_group_name, _data)

    async def wallpost(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        await self.send(text_data=json.dumps(res))



import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import Comment, Post
from importlib import import_module

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async

import datetime
import asyncio
import aioredis
import async_timeout
import re
import redis
import time
import uuid
import base64
session_engine = import_module(settings.SESSION_ENGINE)
        

class CommentHandler(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if str(self.scope['user']) == "AnonymousUser":
            print (self.scope['user'])
            await self.accept()
            await self.close()
        else:
            self.post_name = self.scope['url_route']['kwargs']['post_id']
            self.sender_id = self.scope['user'].id
            self.post_group_name = f"comment_{str(self.post_name)}_messages"
            self.sender_name = self.scope['user']
            self.image_user = self.scope['user'].image_user
            self.path_data = self.scope['user'].path_data
            print ("CommentHandler", self.post_group_name, self.post_name)
            await self.channel_layer.group_add(
                self.post_group_name,
                self.channel_name
            )
            await self.accept()    
            
    async def disconnect(self, close_code):
        print("Disconnected", close_code)
        # Leave room group
        if str(self.scope['user']) != "AnonymousUser":
            await self.channel_layer.group_discard(
                self.post_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """
        Receive message from WebSocket.
        Get the event and send the appropriate event
        """
        response = json.loads(text_data)        
        message_res = response.get("comment_text", None)
        if response['comment_image'] != "":
            nameFile = str(uuid.uuid4())[:12]
            imgstr = re.search(r'base64,(.*)', response['comment_image']).group(1)
            img_file = open(f"media/data_image/{self.path_data}/{nameFile}.png", 'wb')
            img_file.write(base64.b64decode(imgstr))
            img_file.close()
            comment_image = f"{self.path_data}/{nameFile}.png"
        else:
            comment_image = ""
            nameFile = ""
        print ("COMMET<<<<<<<<", response)
        ps = await database_sync_to_async(Post.objects.get)(id=self.post_name)
        comment = Comment()
        comment.comment_text = message_res#response['comment_text']
        comment.comment_image = nameFile
        comment.post_id = ps
        comment.comment_user = self.sender_name
        #comment.save()   
        comment_async = sync_to_async(comment.save)
        await comment_async()    
        now = datetime.datetime.now().strftime('%H:%M:%S')
        _data={
                "type": "send_comment",
                "comment_text": message_res,
                "comment_image": comment_image,
                "comment_user": self.scope['user'].username,
                "path_data": self.path_data,
                "image_user": self.image_user,
                "comment_id": self.post_name,
                "user_id": self.sender_id,
                "timecomment":now,
            }
        await self.channel_layer.group_send(self.post_group_name, _data)
        
    async def send_comment(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        print ("Receive message from room group", res)
        await self.send(text_data=json.dumps(res))         

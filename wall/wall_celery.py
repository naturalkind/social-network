import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User, Post, Comment
from importlib import import_module

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async, async_to_sync
from channels.db import database_sync_to_async
 

import datetime
import asyncio
import aioredis
import async_timeout
import re
import redis
import time
import uuid
import base64, io, os
session_engine = import_module(settings.SESSION_ENGINE)

from . import tasks

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
            
        #start()
        print ("CHANNEL_LAYERS", self.channel_name, self.room_group_name, self.scope['user'])
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
        if self.scope['user'].is_authenticated:  
            if event == "comment_post":
                print ("COMMENT_POST", response)
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
                ps = await database_sync_to_async(Post.objects.get)(id=response["post_id"])
                comment = Comment()
                comment.comment_text = response["comment_text"]
                comment.comment_image = nameFile
                comment.post_id = ps
                comment.comment_user = self.sender_name
                comment_async = sync_to_async(comment.save)
                await comment_async()    
                now = datetime.datetime.now().strftime('%H:%M:%S')
                _data={
                        "type": "wallpost",
                        "comment_text": response["comment_text"],
                        "comment_image": comment_image,
                        "comment_user": self.scope['user'].username,
                        "path_data": self.path_data,
                        "image_user": self.image_user,
                        "post_id": response["post_id"],
                        "user_id": self.sender_id,
                        "timecomment":now,
                        "status" : "send_comment"
                    }
                await self.channel_layer.group_send(self.room_group_name, _data)
                
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
                             "id": post.id,
                             "image_user" : self.image_user, 
                             "path_data" : self.path_data,
                             "status" : "wallpost"
                            }
                    #-----------------------------------------> 
                    # CELERY
                    if self.namefile == "":
                        _temp_dict = {}
                        _temp_dict["title"] = response["title"]
                        _temp_dict["path_data"] = self.path_data
                        _temp_dict["status"] = "Kandinsky-2.0"
#                        getattr(tasks, "add").delay(self.room_group_name, _temp_dict)  
                        K = tasks.add.delay(self.room_group_name, _temp_dict) 
                        print ("..............", K, _temp_dict)
                    #----------------------------------------->   
                         
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
        else:
            await self.channel_layer.group_send(self.room_group_name, {"type": "wallpost"})           

    async def wallpost(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        print ("WALLPOST", res)
        await self.send(text_data=json.dumps(res))



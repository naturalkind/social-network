import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User, Post, Comment
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
import base64, io, os
session_engine = import_module(settings.SESSION_ENGINE)

############################# Kandinsky-2.0

import threading

import zmq.green as zmq # required since we are in gevents
import zlib
import pickle

def compress(obj):
    p = pickle.dumps(obj)
    return zlib.compress(p)


def decompress(pickled):
    p = zlib.decompress(pickled)
    return pickle.loads(p)

work_publisher = None
result_subscriber = None
TOPIC = 'snaptravel'

RECEIVE_PORT = 5555
SEND_PORT = 5556 

def start():
    global work_publisher, result_subscriber
    context = zmq.Context()
    work_publisher = context.socket(zmq.PUB)
    work_publisher.connect(f'tcp://127.0.0.1:{SEND_PORT}') 

def _parse_recv_for_json(result, topic=TOPIC):
    compressed_json = result[len(topic) + 1:]
    return decompress(compressed_json)

def send(args, model=None, topic=TOPIC):
#    print (args, model, topic)
    id = str(uuid.uuid4())
    message = {'body': args["title"], 'model': model, 'id': id}
    compressed_message = compress(message)
    work_publisher.send(f'{topic} '.encode('utf8') + compressed_message)
    return id

def get(id, topic=TOPIC):
    context = zmq.Context()
    result_subscriber = context.socket(zmq.SUB)
    result_subscriber.setsockopt(zmq.SUBSCRIBE, topic.encode('utf8'))
    result_subscriber.connect(f'tcp://127.0.0.1:{RECEIVE_PORT}')
    #  print ("GET", id, topic.encode('utf8'), result_subscriber.recv())
    result = _parse_recv_for_json(result_subscriber.recv())

    while result['id'] != id:
        result = _parse_recv_for_json(result_subscriber.recv())

    result_subscriber.close()

    if result.get('error'):
        raise Exception(result['error_msg'])

    #  return result['prediction']
    return result


from asgiref.sync import async_to_sync      
#import sys
#sys.path.insert(0, '/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/PLAYGROUND/Kandinsky_2.0/Kandinsky-2.0')
#from start_celery import func_celery   

############################
class WallHandler(AsyncJsonWebsocketConsumer):
    #async def send_and_get(self, *args, model=None):
    def send_and_get(self, args, model=None):
        id = send(args, model=model)
        print ("SEND.....", id, args, args['path_data'], model)
        res = get(id)
        namefile = f'{id}.jpg'
        res['prediction'][0].save(f'media/data_image/{args["path_data"]}/{namefile}', format="JPEG") 
        print ("SAVE FILE NAME", f'media/data_image/{args["path_data"]}/{namefile}')
        args["post"].image = namefile
        args["post"].save()        
        
        _data = {"type": "wallpost", "status":"Kandinsky-2.0", "path_data": args["path_data"],
                 "data": f'{namefile}', "post":args["post"].id}
        async_to_sync(self.channel_layer.group_send)(self.room_group_name, _data)
        
        #self.channel_layer.group_send(self.room_group_name, _data)

    async def connect(self):
        self.room_name = "wall"
        self.sender_id = self.scope['user'].id
        self.room_group_name = self.room_name
        self.sender_name = self.scope['user']
        if str(self.scope['user']) != 'AnonymousUser':
            self.image_user = self.scope['user'].image_user
            self.path_data = self.scope['user'].path_data
            self.namefile = str()
            
        start()
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
#                    images = await send_and_get(self.temp_dict, model='queue')
#                    results = await sync_to_async(send_and_get, thread_sensitive=True)(self.temp_dict, model='queue')
#                    images = send_and_get(self.temp_dict, model='queue')
#                    print (images)

                    # WORK
#                    await self.send_and_get(self.temp_dict, model='queue')
                    #-----------------------------------------> 
                    ## WORK текст в картинку                    
                    if self.namefile == "":
                        _temp_dict = {}
                        _temp_dict["title"] = response["title"]
                        _temp_dict["path_data"] = self.path_data
                        _temp_dict["post"] = post
                        t = threading.Thread(target=self.send_and_get, 
                                             args=[_temp_dict], 
                                             kwargs={"model":"Kandinsky-2.0"})
                        t.start()
                    #-----------------------------------------> 
#                    t.join() 
                    # CELERY
                    #Adata = func_celery.delay({"start":"ok", "room":self.room_group_name})                             
                    print (".................", response["title"])
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



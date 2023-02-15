import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User, Post, Comment
from importlib import import_module

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async, async_to_sync
from channels.db import database_sync_to_async
from channels.consumer import SyncConsumer, AsyncConsumer

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
from channels.layers import get_channel_layer

import threading

#import zmq.green as zmq # required since we are in gevents
import zmq
import zmq.asyncio
from zmq.asyncio import Context

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

channel_layer = get_channel_layer()

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

def send_and_get(args, model=None):
    id = send(args, model=model)
    res = get(id)
    namefile = f'{id}.jpg'
    res['prediction'][0].save(f'media/data_image/{args["path_data"]}/{namefile}', format="JPEG")
    post = Post.objects.get(id=args["post"]) 
    post.image = namefile
    post.save()
    _data = {"type": "wallpost", "status":"Kandinsky-2.0", "path_data": args["path_data"],
             "data": f'{namefile}', "post":args["post"]}
    async_to_sync(channel_layer.group_send)(args["room_group_name"], _data)
#    channel_layer.group_send(self.room_group_name, _data)

############################
class NNHandler(SyncConsumer):
    start()
    def triggerWorker(self, message):
        print ("................................", message)
        send_and_get(message, model='Kandinsky-2.0')
#        async_to_sync(self.channel_layer.group_add)("testGroup",self.channel_name)
#        async_to_sync(self.channel_layer.group_send)(
#            "testGroup",
#            {
#                'type':"echo_msg",
#                'msg':"sent from worker",
#            })

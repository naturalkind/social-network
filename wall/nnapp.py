from myapp.models import User, Post, Comment

from asgiref.sync import sync_to_async, async_to_sync
from channels.consumer import SyncConsumer, AsyncConsumer
from channels.layers import get_channel_layer

import uuid
import os
import json
import zlib
import pickle

import zmq
import zmq.asyncio
from zmq.asyncio import Context
############################# Kandinsky-2.0

work_publisher = None
result_subscriber = None
TOPIC = 'snaptravel'

RECEIVE_PORT = 5555
SEND_PORT = 5556 

channel_layer = get_channel_layer()

def compress(obj):
    p = pickle.dumps(obj)
    return zlib.compress(p)


def decompress(pickled):
    p = zlib.decompress(pickled)
    return pickle.loads(p)
    
def start():
    global work_publisher, result_subscriber
    context = zmq.Context()
    work_publisher = context.socket(zmq.PUB)
    work_publisher.connect(f'tcp://127.0.0.1:{SEND_PORT}') 

def _parse_recv_for_json(result, topic=TOPIC):
    compressed_json = result[len(topic) + 1:]
    return decompress(compressed_json)

def send(args, model=None, topic=TOPIC):
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
    result = _parse_recv_for_json(result_subscriber.recv())
    while result['id'] != id:
        result = _parse_recv_for_json(result_subscriber.recv())
    result_subscriber.close()
    if result.get('error'):
        raise Exception(result['error_msg'])
    return result

def send_and_get(args, model=None):
    id = send(args, model=model)
    res = get(id)
    namefile = f'{id}.jpg'
    try:
        post = Post.objects.get(id=args["post"]) 
        post.image = namefile
        post.save()
        res['prediction'][0].save(f'media/data_image/{args["path_data"]}/{namefile}', format="JPEG")
        _data = {"type": "wallpost", "status":"Kandinsky-2.0", "path_data": args["path_data"],
                 "data": f'{namefile}', "post":args["post"]}
        async_to_sync(channel_layer.group_send)(args["room_group_name"], _data)
    except Post.DoesNotExist:
        pass
<<<<<<< HEAD
=======

>>>>>>> v1.2_keypress

class NNHandler(SyncConsumer):
    start()
    def triggerWorker(self, message):
        print ("................................", message)
        send_and_get(message, model='Kandinsky-2.0')

import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User
from privatemessages.models import Thread, Message
from importlib import import_module
from privatemessages.utils import send_message

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async
from django.shortcuts import render, get_object_or_404
from django.core import serializers
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage

import asyncio
import aioredis
import async_timeout

import redis
import time

session_engine = import_module(settings.SESSION_ENGINE)


@sync_to_async
def get_pages(room_name, sender_id, message_res):
    thread = get_object_or_404(Thread, id=room_name, participants__id=sender_id)
    messages = thread.message_set.order_by("-datetime")#[:100]
    paginator = Paginator(messages, 40)
    data = {}
    data['type'] = "send_message"
    data['request_user_id'] = sender_id
    data['event'] = "loadmore"
    data['all_pages'] = paginator.num_pages
    user_id = str(sender_id)
    partner = thread.participants.exclude(id=sender_id)[0]
    try:
        posts = paginator.page(message_res)
        data['op1'] = paginator.page(message_res).next_page_number()
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)  
        data['op1'] = paginator.num_pages
    data['data'] = serializers.serialize('json', posts, use_natural_foreign_keys=True, use_natural_primary_keys=True)
    return data

class MessagesHandler(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_code']
        self.sender_id = self.scope['user'].id
        self.room_group_name = f"thread_{str(self.room_name)}_messages"
        self.sender_name = self.scope['user']
        self.image_user = self.scope['user'].image_user
        self.path_data = self.scope['user'].path_data
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        # redis
        self.connection = await aioredis.create_redis_pool('redis://localhost')
        self.pubsub = await self.connection.psubscribe("".join(["private_", str(self.room_name), "_messages"]))


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
        message_res = response.get("message", None)
        
        if event == "privatemessages":
            message = Message()
            message.text = message_res
            message.thread_id = self.room_name
            message.sender_id = self.sender_id
            message_async = sync_to_async(message.save)
            await message_async()
            
            _data = {
                       "type": "send_message",
                       "timestamp": dateformat.format(message.datetime, 'U'),
                       "sender": str(self.sender_name),
                       "image_user" : self.image_user, 
                       "path_data" : self.path_data,
                       "text": str(message_res),
                       "event": "privatemessages"
                    }
            for key in ("total_messages", "".join(["from_", str(self.sender_id )])):
                await self.connection.hincrby(
                            #"".join([thread_id]),
                            "".join(["private_", str(self.room_name), "_messages"]),
                            key,
                            1
                        ) 
            
            await self.channel_layer.group_send(self.room_group_name, _data)
                    
        if event == "loadmore":
#            print ("LOAD MORE PAGES")
            _data = await get_pages(self.room_name, self.sender_id, message_res)
            print ("LOAD MORE PAGES",  response)   
            await self.channel_layer.group_send(self.room_group_name, _data)
            
#            await self.channel_layer.group_send(self.room_group_name, {
#                'type': 'send_message',
#                'message': message,
#                "event": "privatemessages"
#            })
        
#        if event == 'MOVE':
#            # Send message to room group
#            await self.channel_layer.group_send(self.room_group_name, {
#                'type': 'send_message',
#                'message': message,
#                "event": "MOVE"
#            })
#            
#        if event == 'START':
#            # Send message to room group
#            await self.channel_layer.group_send(self.room_group_name, {
#                'type': 'send_message',
#                'message': message,
#                'event': "START"
#            })
#            
#        if event == 'END':
#            # Send message to room group
#            await self.channel_layer.group_send(self.room_group_name, {
#                'type': 'send_message',
#                'message': message,
#                'event': "END"
#            })

    async def send_message(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        #print ("Receive message from room group", res)
        await self.send(text_data=json.dumps(res))
        
        

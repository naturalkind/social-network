import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User
from django.core.cache import cache
from privatemessages.models import Thread, Message
from importlib import import_module
from privatemessages.utils import send_message

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.shortcuts import get_object_or_404
from django.core import serializers
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage

import asyncio
from redis.asyncio import Redis  # ← замена aioredis
import uuid
import base64
import re
import os

# Импорт движка сессий
session_engine = import_module(settings.SESSION_ENGINE)


@sync_to_async
def get_pages(room_name, sender_id, message_res):
    thread = get_object_or_404(Thread, id=room_name, participants__id=sender_id)
    messages = thread.message_set.order_by("-datetime")
    paginator = Paginator(messages, 40)
    data = {
        "type": "send_message",
        "request_user_id": sender_id,
        "event": "loadmore",
        "all_pages": paginator.num_pages,
        "thread_id": room_name,
    }
    user_id = str(sender_id)
    partner = thread.participants.exclude(id=sender_id)[0]
    try:
        posts = paginator.page(message_res)
        data["op1"] = str(paginator.page(message_res).next_page_number())
    except PageNotAnInteger:
        posts = paginator.page(1)
        data["op1"] = "2" if paginator.num_pages > 1 else "STOP"
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
        data["op1"] = "STOP"

    data["data"] = serializers.serialize(
        "json",
        posts,
        use_natural_foreign_keys=True,
        use_natural_primary_keys=True
    )
    return data


@sync_to_async
def get_partner(room_name, sender_id):
    thread = get_object_or_404(Thread, id=room_name, participants__id=sender_id)
    return thread.participants.exclude(id=sender_id)[0]


# Функции для работы с уведомлениями (используют обычный Redis, не async)
def add_notification(user_id, notification_id, data):
    from redis import StrictRedis
    r = StrictRedis(host='localhost', port=6379, decode_responses=True)
    r.hset(f'{user_id}_notifications', notification_id, json.dumps(data))


def get_notifications(user_id):
    from redis import StrictRedis
    r = StrictRedis(host='localhost', port=6379, decode_responses=True)
    return r.hgetall(f'{user_id}_notifications')


class MessagesHandler(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_code']
        self.sender_id = str(self.scope['user'].id)
        self.room_group_name = f"thread_{self.room_name}_messages"
        self.sender_name = self.scope['user']
        self.image_user = self.scope['user'].image_user
        self.path_data = self.scope['user'].path_data

        # Присоединяемся к группе канала
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Подключаемся к Redis только для hincrby (не для pub/sub!)
        self.redis = Redis.from_url("redis://localhost")

        # Сохраняем канал в кеше для push-уведомлений
        cache.set(f'channel_{self.sender_id}', self.channel_name, timeout=3600)

    async def disconnect(self, close_code):
        print("Disconnected", close_code)
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # Закрываем соединение с Redis
        await self.redis.close()

    async def receive(self, text_data):
        response = json.loads(text_data)
        event = response.get("event")
        message_res = response.get("message")

        if event == "privatemessages":
            message = Message()
            message.text = message_res
            message.thread_id = self.room_name
            message.sender_id = self.sender_id

            pm_image = ""
            if "pm_image" in response and response["pm_image"]:
                nameFile = str(uuid.uuid4())[:12]
                imgstr = re.search(r'base64,(.*)', response['pm_image']).group(1)
                img_path = f"media/data_image/{self.path_data}/{nameFile}.png"
                os.makedirs(os.path.dirname(img_path), exist_ok=True)
                with open(img_path, 'wb') as f:
                    f.write(base64.b64decode(imgstr))
                pm_image = f"{self.path_data}/{nameFile}.png"
                message.pm_image = nameFile
            else:
                message.pm_image = ""

            await sync_to_async(message.save)()

            _data = {
                "type": "send_message",
                "timestamp": dateformat.format(message.datetime, 'U'),
                "sender": str(self.sender_name),
                "sender_id": self.sender_id,
                "image_user": self.image_user,
                "path_data": self.path_data,
                "text": str(message_res),
                "pm_image": pm_image,
                "thread_id": self.room_name,
                "event": "privatemessages"
            }

            # Обновляем счётчики в Redis
            await self.redis.hincrby(f"private_{self.room_name}_messages", "total_messages", 1)
            await self.redis.hincrby(f"private_{self.room_name}_messages", f"from_{self.sender_id}", 1)

            # Отправляем сообщение в группу
            await self.channel_layer.group_send(self.room_group_name, _data)

            # Получаем партнёра и отправляем уведомление
            try:
                partner = await get_partner(self.room_name, self.sender_id)
                add_notification(partner.id, self.room_name, {"read": False})

                partner_channel = cache.get(f'channel_{partner.id}')
                if partner_channel:
                    await self.channel_layer.send(partner_channel, {
                        "type": "wallpost",
                        "status": "notification",
                        "sender_id": self.sender_id,
                        "thread_id": self.room_name
                    })
            except Exception as e:
                print("Ошибка при отправке уведомления:", e)

        elif event == "loadmore":
            _data = await get_pages(self.room_name, self.sender_id, message_res)
            print("LOAD MORE PAGES PRIVATEMESSAGES", response)
            await self.channel_layer.group_send(self.room_group_name, _data)

    async def send_message(self, res):
        """Отправка сообщения клиенту"""
        await self.send(text_data=json.dumps(res))

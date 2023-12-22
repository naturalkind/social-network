from django.http import HttpResponse
from django.utils import dateformat

import redis
import json

from myapp.models import UserChannels
from privatemessages.models import Message
from django.core.cache import cache

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
channel_layer = get_channel_layer()

def add_notification(user_id, notification_id, data):
    r = redis.StrictRedis(host='localhost', port=6379)
    r.hset('%s_notifications' % user_id, notification_id, json.dumps(data))

def json_response(obj):
    return HttpResponse(json.dumps(obj), content_type="application/json")

def send_message(thread_id,
                 sender,
                 message_text,
                 partner,
                 sender_name=None,
                 resend="False"):
                 
    message = Message()
    message.text = message_text
    message.resend = resend
    message.thread_id = thread_id
    message.sender_id = sender.id
    message.save()

    thread_id = str(thread_id)
    sender_id = str(sender.id)

    r = redis.StrictRedis()

    print (f"send_message from {sender_name} CHANNEL_LAYER.SEND--------->", cache.get('channel_%s' % partner))
#    cache.set('message_%s' % (partner), cache.get('channel_%s' % partner))
    try:
        # работает уведомление
        P = UserChannels.get(str(partner))
        P.notification += 1
        P.save()
    except Exception as e: 
        print ("Ошибка UserChannels", e)
        
    add_notification(partner, thread_id, {"read":False})
    try:
        async_to_sync(channel_layer.send)(cache.get('channel_%s' % partner),{"type" : "wallpost",
                                                                             "status" : "notification",
                                                                             "path_data" : sender.path_data,
                                                                             "image_user" : sender.image_user,
                                                                             "sender": str(sender.username),
                                                                             "sender_id" : sender_id,
                                                                             "thread_id" : thread_id })
    except Exception as e: 
        print (e)
    for key in ("total_messages", "".join(["from_", sender_id])):
        r.hincrby(
            "".join(["private_", thread_id, "_messages"]),
            key,
            1
        )

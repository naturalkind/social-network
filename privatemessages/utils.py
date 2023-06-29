from django.http import HttpResponse
from django.utils import dateformat

import redis
import json

from privatemessages.models import Message
from myapp.models import UserChannels

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
channel_layer = get_channel_layer()


def json_response(obj):
    return HttpResponse(json.dumps(obj), content_type="application/json")

def send_message(thread_id,
                 sender_id,
                 message_text,
                 partner,
                 sender_name=None,
                 resend="False"):
                 
    message = Message()
    message.text = message_text
    message.resend = resend
    message.thread_id = thread_id
    message.sender_id = sender_id
    message.save()

    thread_id = str(thread_id)
    sender_id = str(sender_id)

    r = redis.StrictRedis()

    print ("send_message", sender_name)
#    channel_layer.send(UserChannels.get(partner).dict()["channels"],
#                                                {
#                                                    "type" : "wallpost",
#                                                    "status" : "notification",
#                                                    "sender_id" : sender_id,
#                                                    "thread_id" : thread_id
#                                                }
#                                             )  
    async_to_sync(channel_layer.send)(UserChannels.get(partner).dict()["channels"],{ "type" : "wallpost",
                                                                                     "status" : "notification",
                                                                                     "sender_id" : sender_id,
                                                                                     "thread_id" : thread_id
                                                                                    })
                                             
                                                     
    for key in ("total_messages", "".join(["from_", sender_id])):
        r.hincrby(
            "".join(["private_", thread_id, "_messages"]),
            key,
            1
        )

from django.http import HttpResponse
from django.utils import dateformat

import redis
import json

from privatemessages.models import Message

def json_response(obj):
    return HttpResponse(json.dumps(obj), content_type="application/json")

def send_message(thread_id,
                 sender_id,
                 message_text,
                 sender_name=None):
                 
    message = Message()
    message.text = message_text
    message.thread_id = thread_id
    message.sender_id = sender_id
    message.save()

    thread_id = str(thread_id)
    sender_id = str(sender_id)

    r = redis.StrictRedis()

    print ("send_message", sender_name)

    for key in ("total_messages", "".join(["from_", sender_id])):
        r.hincrby(
            "".join(["private_", thread_id, "_messages"]),
            key,
            1
        )

import time
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
import asyncio

channel_layer = get_channel_layer()

@shared_task
def add(channel_name, message):
    print ("CELERY------>", message)
    async_to_sync(channel_layer.group_send)(channel_name, {"type": "wallpost", "status": "Kandinsky-2.0"})
#    async_to_sync(channel_layer.send)(channel_name, {"type": "wall.wallpost", "status": "Kandinsky-2.0"})

# Работает
#@shared_task
#def add(channel_name, message):
#    print ("TESTRT..................", message)
#    loop = asyncio.get_event_loop()
#    coroutine = channel_layer.group_send(channel_name, {"type": "wallpost", "status": "Kandinsky-2.0"})
#    loop.run_until_complete(coroutine)

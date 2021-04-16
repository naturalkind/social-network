#-*- coding: utf-8 -*-
import json
from django.http import HttpResponse
import redis

from django.contrib.auth.models import User
from django.utils import dateformat

from datetime import datetime

from myapp.models import Post

import base64
import re
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from myapp.views import crop
import uuid

def json_response(obj):
    return HttpResponse(json.dumps(obj), content_type="application/json")


def send_message(title, body, image, video, user_post):
    
    nameFile = str(uuid.uuid4())[:12]
    user_postv = User.objects.get(username=user_post)
    imgstr = re.search(r'base64,(.*)', image).group(1)
    # path = default_storage.save('%s.png' % nameFile, ContentFile(imgstr))
    img_file = open("media/data_image/%s.png" % nameFile, 'wb')
    img_file.write(base64.b64decode(imgstr))
    img_file.close()

    # user_postv = User.objects.get(username=user_post)
    post = Post()
    post.title = title
    post.body = body
    # post.image = default_storage.save('%s.png' % nameFile, ContentFile(imgstr))
    post.image = nameFile
    post.video = video
    # post.audio = audio
    post.user_post = user_postv
    post.save()


    user_post = str(user_post)

    r = redis.StrictRedis()

    if user_post:
        r.publish("".join(["/"]), json.dumps({
            "timestamp": dateformat.format(post.date_post, 'U'),
            "image": nameFile,
            "user_post": user_post,
            "title": title,
            "id": post.id
        }))


#-*- coding: utf-8 -*-
import json
from django.http import HttpResponse
import redis

#from django.contrib.auth.models import User
from django.utils import dateformat

from datetime import datetime

from myapp.models import Comment, Post, User
import base64
import re

def json_response(obj):
    return HttpResponse(json.dumps(obj), content_type="application/json")


def send_comment(post_id, comment_user, comment_text, comment_image ):
    usr = User.objects.get(id=comment_user)
    ps = Post.objects.get(id=post_id)



    import uuid
    nameFile = str(uuid.uuid4())[:12]
    imgstr = re.search(r'base64,(.*)', comment_image).group(1)
    # path = default_storage.save('%s.png' % nameFile, ContentFile(imgstr))
    img_file = open("media/%s.png" % nameFile, 'wb')
    img_file.write(base64.b64decode(imgstr))
    img_file.close()


    post = Comment()
    post.comment_text = comment_text
    post.comment_image = nameFile
    post.post_id = ps
    post.comment_user = usr
    post.save()



    user_post = str(usr.username)

    r = redis.StrictRedis()

    if user_post:
        r.publish("".join(['post_', post_id,'_comments']), json.dumps({
            "user_post": user_post,
            "title": comment_text,

        }))





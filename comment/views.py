#-*- coding: utf-8 -*-
# Create your views here.

import json

import redis

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

#from django.contrib.auth.models import User

from myapp.models import Post, Comment, User

from comment.utls import json_response, send_comment

@csrf_exempt
def send_comment_api_view(request, post_id):
    if not request.method == "POST":
        return json_response({"error": "Please use POST."})

    api_key = "999"
    if api_key != "999":
        return json_response({"error": api_key})

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return json_response({"error": "No such thread."})

    data = json.loads(request.body)
    comment_text = data['comment_text']
    comment_image = data['comment_image']
    comment_user = data['comment_user']

    send_comment(
                    post.id,
                    # comment_user.id,
                    comment_user,
                    comment_text,
                    comment_image
                )

    return json_response({"status": "ok"})



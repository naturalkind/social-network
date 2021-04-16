# -*- coding: utf-8 -*-
import json

import redis

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from login.views import login
from myapp.views import index
from django.contrib import auth
from django.contrib.auth.models import User
from myapp.models import Post
from wall.utils import json_response, send_message
try:
    from django.utils import simplejson as json
except ImportError:
    import json
from django.core import serializers
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from myapp.serializers import PostSerializer
from myapp.models import RELATIONSHIP_FOLLOWING
import base64
import re

@csrf_exempt
def send_message_api_view(request):
    if not request.method == "POST":
        return json_response({"error": "Please use POST."})

    # api_key = request.POST.get("api_key")
    api_key = "999"
    # if api_key != settings.API_KEY:
    if api_key != "999":
        return json_response({"error": api_key})
    data = json.loads(request.body)
    title = data['title']
    body = data['body']
    image = data['image']
    video = data['video']
    user_post = data['user_post']


    send_message(
        title,
        body,
        image,
        # nameFile,
        video,
        # audio,
        user_post
    )

    return json_response({"status": "ok"})





@api_view(['GET', 'POST'])
def chat_view(request):
    if not request.user.is_authenticated():
        return index(request)
    thread = Post.objects.all().order_by("-date_post")
    paginator = Paginator(thread, 6)
    page = request.GET.get('page')

    # user_id = str(request.user.id)
    r = redis.StrictRedis()
    data = {}
    data['us'] = auth.get_user(request).username
    # data.update(csrf(request))
    try:
        posts = paginator.page(page)
        data['op1'] = paginator.page(page).next_page_number()
        data['op2'] = paginator.page(page).previous_page_number()
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
    if page:
        data['data'] = serializers.serialize('json', posts)
        return HttpResponse(json.dumps(data), content_type = "application/json")

    return render_to_response('postwall.html',
                              {
                                  "thread_messages": posts,
                                  "username": auth.get_user(request)
                              },
                              context_instance=RequestContext(request))


def rppos(request, id):
    if request.method == 'GET':
    # if request.method == 'POST':
        username = request.GET.get('username')
        psse = Post.objects.get(id=int(id))
        usse = User.objects.get(username=username)
        psse.add_rela(usse, RELATIONSHIP_FOLLOWING)
        return HttpResponse('добавили', content_type = "application/json")
        # return HttpResponse(psse.get_foll, content_type = "application/json")




#-*- coding: utf-8 -*-
# Create your views here.

import json

import redis

from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from myapp.models import User

from privatemessages.models import Thread, Message

from privatemessages.utils import send_message

from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.core import serializers


def send_message_view(request):
    print ("send_message_view")
    if not request.method == "POST":
        return HttpResponse("Please use POST.")

    if not request.user.is_authenticated:
        return HttpResponse("Please sign in.")

    data = json.loads(request.body)
    message_text = data['message']

    if not message_text:
        return HttpResponse("No message found.")

    if len(message_text) > 10000:
        return HttpResponse("The message is too long.")

    recipient_name = data['recipient_name']

    try:
        recipient = User.objects.get(username=recipient_name)
    except User.DoesNotExist:
        return HttpResponse("No such user.")

    if recipient == request.user:
        return HttpResponse("You cannot send messages to yourself.")

    thread_queryset = Thread.objects.filter(participants=recipient).filter(participants=request.user)

    if thread_queryset.exists():
        thread = thread_queryset[0]
    else:
        thread = Thread.objects.create()
        thread.participants.add(request.user, recipient)

    send_message(
                    thread.id,
                    request.user.id,
                    message_text,
                    request.user.username
                )
    return HttpResponseRedirect(
        reverse(chat_view, args=(thread.id,))
    )

def messages_view(request):
    if not request.user.is_authenticated:
        return HttpResponse("Please sign in.")

    threads = Thread.objects.filter(
        participants=request.user
    ).order_by("-last_message")

    if not threads:
        return render(request, 'private_messages.html', {})

    r = redis.StrictRedis()

    user_id = str(request.user.id)
    
    for thread in threads:
        thread.partner = thread.participants.exclude(id=request.user.id)[0]
        thread.total_messages = r.hget(
             "".join(["private_", str(thread.id), "_messages"]),
             "total_messages"
        ).decode("utf-8")
    print ("messages_view")
    return render(request, 'private_messages.html',
                              {
                                  "threads": threads,
                                  "user_info":request.user
                              })




#def chat_view(request):
#    if not request.user.is_authenticated:
#        return index(request)
#    thread = Post.objects.all().order_by("-date_post")
#    paginator = Paginator(thread, 6)
#    page = request.GET.get('page')
#    data = {}
#    data['us'] = auth.get_user(request).username
#    try:
#        posts = paginator.page(page)
#        data['op1'] = paginator.page(page).next_page_number()
#        data['op2'] = paginator.page(page).previous_page_number()
#    except PageNotAnInteger:
#        posts = paginator.page(1)
#    except EmptyPage:
#        posts = paginator.page(paginator.num_pages)
#    if page:
#        data['data'] = serializers.serialize('json', posts, use_natural_foreign_keys=True, use_natural_primary_keys=True)
#        return HttpResponse(json.dumps(data), content_type = "application/json")

#    return render(request, 'postwall.html',
#                              {
#                                  "thread_messages": posts,
#                                  "username": auth.get_user(request)
#                              },
#                              )



def chat_view(request, thread_id):
    if not request.user.is_authenticated:
        return HttpResponse("Please sign in.")

    thread = get_object_or_404(Thread, id=thread_id, participants__id=request.user.id)

    messages = thread.message_set.order_by("-datetime")#[:100]
    paginator = Paginator(messages, 20)
    data = {}
    
    user_id = str(request.user.id)

    r = redis.StrictRedis()

    messages_total = r.hget(
         "".join(["private_", str(thread.id), "_messages"]),
         "total_messages"
    )

    messages_sent = r.hget(
        "".join(["private_", str(thread.id), "_messages"]),
        "".join(["from_", user_id])
    )

    if messages_total:
        messages_total = int(messages_total)
    else:
        messages_total = 0

    if messages_sent:
        messages_sent = int(messages_sent)
    else:
        messages_sent = 0

    messages_received = messages_total-messages_sent

    partner = thread.participants.exclude(id=request.user.id)[0]

    page = 1
    try:
        posts = paginator.page(page)
        data['op1'] = paginator.page(page).next_page_number()
        data['all_pages'] = paginator.num_pages
        print ("TRY OK")
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
    print ("chat_view", messages_total, messages_sent, posts.has_next, data)
    return render(request, 'chat.html',
                              {
                                  "thread_id": thread_id,
                                  "thread_messages": posts,
                                  "messages_total": messages_total,
                                  "messages_sent": messages_sent,
                                  "messages_received": messages_received,
                                  "partner": partner,
                              })



#def chat_view(request, thread_id):
#    if not request.user.is_authenticated:
#        return HttpResponse("Please sign in.")

#    thread = get_object_or_404(Thread, id=thread_id, participants__id=request.user.id)

#    messages = thread.message_set.order_by("-datetime")[:100]

#    user_id = str(request.user.id)

#    r = redis.StrictRedis()

#    messages_total = r.hget(
#         "".join(["private_", str(thread.id), "_messages"]),
#         "total_messages"
#    )

#    messages_sent = r.hget(
#        "".join(["private_", str(thread.id), "_messages"]),
#        "".join(["from_", user_id])
#    )

#    if messages_total:
#        messages_total = int(messages_total)
#    else:
#        messages_total = 0

#    if messages_sent:
#        messages_sent = int(messages_sent)
#    else:
#        messages_sent = 0

#    messages_received = messages_total-messages_sent

#    partner = thread.participants.exclude(id=request.user.id)[0]

#    # tz = request.COOKIES.get("timezone")
#    # if tz:
#    #     timezone.activate(tz)
#    print ("chat_view", messages_total, messages_sent)
#    return render(request, 'chat.html',
#                              {
#                                  "thread_id": thread_id,
#                                  "thread_messages": messages,
#                                  "messages_total": messages_total,
#                                  "messages_sent": messages_sent,
#                                  "messages_received": messages_received,
#                                  "partner": partner,
#                              })

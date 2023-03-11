#-*- coding: utf-8 -*-
# Create your views here.
import json
import redis
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.utils import timezone
from myapp.models import User
from privatemessages.models import Thread, Message
from privatemessages.utils import send_message
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage


def send_message_view(request):
    if not request.method == "POST":
        return HttpResponse("<div id='error_msg'><p>только POST запросы</p></div>")

    if not request.user.is_authenticated:
        return HttpResponse("<div id='error_msg'><p>войдите</p></div>")

    data = json.loads(request.body)
    message_text = data['message']

    if not message_text:
        return HttpResponse("<div id='error_msg'><p>не найдены сообщения</p></div>")

    if len(message_text) > 10000:
        return HttpResponse("<div id='error_msg'><p>сообщение очень длинное</p></div>")

    recipient_name = data['recipient_name']

    try:
        recipient = User.objects.get(username=recipient_name)
    except User.DoesNotExist:
        return HttpResponse("<div id='error_msg'><p>пользователь не найден</p></div>")

    if recipient == request.user:
        return HttpResponse("<div id='error_msg'><p>вы не можете посылать сообщения себе</p></div>")

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
    _type = request.GET.get('_type')
    r = redis.StrictRedis()

    user_id = str(request.user.id)
    
    for thread in threads:
        thread.partner = thread.participants.exclude(id=request.user.id)[0]
        try:
            thread.total_messages = r.hget(
                 "".join(["private_", str(thread.id), "_messages"]),
                 "total_messages"
            ).decode("utf-8")
        except AttributeError:
            mes_thr = Message.objects.filter(thread__id=thread.id)
            if mes_thr.count() > 0:
                for msg in mes_thr:
                    for key in ("total_messages", "".join(["from_", str(msg.sender.id)])):
                        r.hincrby(
                            "".join(["private_", str(thread.id), "_messages"]),
                            key,
                            1
                        )
                thread.total_messages = r.hget(
                     "".join(["private_", str(thread.id), "_messages"]),
                     "total_messages"
                ).decode("utf-8")                
    print (_type)
    if _type == "javascript":    
        return render(request, 'private_messages.html',
                                  {
                                      "threads": threads,
                                      "username":request.user
                                  })
    else:
        return render(request, '_private_messages.html',
                                  {
                                      "threads": threads,
                                      "username":request.user
                                  })



def chat_view(request, thread_id):
    if not request.user.is_authenticated:
        return HttpResponse("Please sign in.")

    thread = get_object_or_404(Thread, id=thread_id, participants__id=request.user.id)

    messages = thread.message_set.order_by("-datetime")#[:100]
    paginator = Paginator(messages, 40)
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
    print ("->>>>>>>>", messages_total, messages_sent)
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
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
        data['op1'] = "STOP"
    _type = request.GET.get('_type')
    if _type == "javascript":    
        return render(request, 'chat.html',
                                  {
                                      "thread_id": thread_id,
                                      "thread_messages": posts,
                                      "messages_total": messages_total,
                                      "messages_sent": messages_sent,
                                      "messages_received": messages_received,
                                      "partner": partner,
                                      "username":request.user
                                  })

    else:
        return render(request, '_chat.html',
                                  {
                                      "thread_id": thread_id,
                                      "thread_messages": posts,
                                      "messages_total": messages_total,
                                      "messages_sent": messages_sent,
                                      "messages_received": messages_received,
                                      "partner": partner,
                                      "username":request.user
                                  })


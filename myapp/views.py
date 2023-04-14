#-*- coding: utf-8 -*-
# django module
from django.shortcuts import render, redirect, HttpResponseRedirect
from django.http import HttpResponse, Http404, JsonResponse
try:
    from django.utils import simplejson as json
except ImportError:
    import json
from django.template.context_processors import csrf    
from django.contrib import auth

from myapp.models import *

from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.core import serializers
import requests
import base64
import re
import os
import uuid
from PIL import Image
from datetime import datetime
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.forms import UserCreationForm 

from django.template.loader import render_to_string
from django.template import loader
from django.template import Template, Context
from django.views.decorators.cache import cache_page


class ExtBaseSerializer(serializers.base.Serializer):
    def serialize(self, queryset, **options):
        self.selected_props = options.pop('props')
        return super(ExtBaseSerializer, self).serialize(queryset, **options)

    def serialize_property(self, obj):
        model = type(obj)
        for field in self.selected_props:
            if hasattr(model, field) and type(getattr(model, field)) == property:
                self.handle_prop(obj, field)

    def handle_prop(self, obj, field):
        self._current[field] = getattr(obj, field)

    def end_object(self, obj):
        self.serialize_property(obj)
        super(ExtBaseSerializer, self).end_object(obj)

class ExtPythonSerializer(ExtBaseSerializer, serializers.python.Serializer):
    pass

class ExtJsonSerializer(ExtPythonSerializer, serializers.json.Serializer):
    pass


@login_required
def create_comment(request):
    ps_id = None
    if request.method == 'GET':
        ps_id = request.GET['post_id']
        text = request.GET['comment_text']
    if ps_id:
        ans = Post.objects.get(id=ps_id)
        if ans:
              Comment.objects.create(comment_text=text, comment_user=request.user, post_id=ans)
              x = 'тебе не нравиться'
    return HttpResponse(x)


@login_required
def rppos(request, id):
    if request.method == 'GET':
    # if request.method == 'POST':
        username = request.GET.get('username')
        psse = Post.objects.get(id=id)
        usse = User.objects.get(username=username)
        if psse.relike.filter(id=request.user.id).exists():
            psse.remove_rela(usse, RELATIONSHIP_FOLLOWING)
            li = 0
            return JsonResponse({"answer":'удалили', "like-indicator":li})
        else:
            li = 1
            psse.add_rela(usse, RELATIONSHIP_FOLLOWING)
            return JsonResponse({"answer":'добавили', "like-indicator":li})


@login_required
def add_like(request):
    ps_id = None
    if request.method == 'GET':
        ps_id = request.GET['post_id']
    if ps_id:
        ans = Post.objects.get(id=ps_id)
        #votes = ans.votes
        if ans:
            if ans.likes.filter(id=request.user.id).exists():
            # пользователь готов к созданию лайка
            # убрать лайк/пользователя
              #ans.votes =+1
              ans.likes.remove(request.user)
              x = 'тебе не нравиться'
              li = 0
              #ans.save()
              ans.point_likes -= int(1)
              ans.save()
            else:
              #ans.votes =-1
              ans.likes.add(request.user)
#              x = request.user.username +' '+ u'понравилось'
              x = 'тебе понравилось'
              li = 1
              ans.point_likes += int(1)
              ans.save()
    return JsonResponse({"answer":x, "like-indicator":li})
#    return HttpResponse(json.dumps({"answer":x, "like-indicator":li}),
#                        content_type="application/json")


def create_post(request):
    if request.method == 'POST':
        text = request.POST.get('the_post')
        response_data = {}
        post = Comment(comment_text=text, comment_user=request.user)
        post.save()
        response_data['result'] = 'Create post successful!'
        response_data['postpk'] = post.pk
        response_data['text'] = post.comment_text
        response_data['author'] = post.comment_user.username
        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )
    else:
        return HttpResponse(
            json.dumps({"nothing to see": "this isn't happening"}),
            content_type="application/json"
        )


# Image crop
def crop(path, nameFile, size):
    crop_type='middle'
    modified_path = f"media/data_image/{path}/tm_{nameFile}"
    img_path = f"media/data_image/{path}/{nameFile}"
    img = Image.open(img_path)
    # Get current and desired ratio for the images
    img_ratio = img.size[0] / float(img.size[1])
    ratio = size[0] / float(size[1])
    #The image is scaled/cropped vertically or horizontally depending on the ratio
    if ratio > img_ratio:
        img = img.resize((size[0], int(size[0] * img.size[1] / img.size[0])),
                Image.ANTIALIAS)
        # Crop in the top, middle or bottom
        if crop_type == 'top':
            box = (0, 0, img.size[0], size[1])
        elif crop_type == 'middle':
            box = (0, int((img.size[1] - size[1]) / 2), img.size[0], int((img.size[1] + size[1]) / 2))
        elif crop_type == 'bottom':
            box = (0, int(img.size[1] - size[1]), img.size[0], img.size[1])
        else :
            raise ValueError('ERROR: invalid value for crop_type')
        img = img.crop(box)
    elif ratio < img_ratio:
        img = img.resize((int(size[1] * img.size[0] / img.size[1]), size[1]),
                Image.ANTIALIAS)
        # Crop in the top, middle or bottom
        if crop_type == 'top':
            box = (0, 0, size[0], img.size[1])
        elif crop_type == 'middle':
            box = (int((img.size[0] - size[0]) / 2), 0, int((img.size[0] + size[0]) / 2), img.size[1])
        elif crop_type == 'bottom':
            box = (int(img.size[0] - size[0]), 0, img.size[0], img.size[1])
        else :
            raise ValueError('ERROR: invalid value for crop_type')
        img = img.crop(box)
    else :
        img = img.resize((size[0], size[1]),
                Image.ANTIALIAS)
        # If the scale is the same, we do not need to crop
    img.save(modified_path)
    
    
def index(request):
    post = Post.objects.all().order_by('-date_post')
    paginator = Paginator(post, 26)
    page = request.GET.get('page')
    data = {}
    data['all_pages'] = paginator.num_pages   
    try:
        posts = paginator.page(page)
        data['op1'] = paginator.page(page).next_page_number()
        data['op2'] = paginator.page(page).previous_page_number()
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
        data['op1'] = "STOP"
    if page:
        data['data'] = serializers.serialize('json', posts, use_natural_foreign_keys=True, use_natural_primary_keys=True)
        return HttpResponse(json.dumps(data), content_type = "application/json")    
    else:
        return render(request, 'index.html',{'post': post, 'posts':posts, 'username': auth.get_user(request).username})


def new(request):
    post = Post.objects.all().order_by('-date_post')
    paginator = Paginator(post, 30)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
    data['op'] = paginator.num_pages
    data['op1'] = paginator.page_range
    try:
        posts = paginator.page(page)
        data['op2'] = paginator.page(page).next_page_number()
        data['op3'] = paginator.page(page).previous_page_number()
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
    if page:
        data['data'] = serializers.serialize('json', posts)
        return HttpResponse(json.dumps(data), content_type = "application/json")
    return render(request, 'new.html', {'post': posts, 'username': auth.get_user(request).username})
   
    
# На выходе мы получим в ответе post_id если не было ошибки
#def post(request, post):
#    try:
#        post_id = Post.objects.get(id=post)
#    except ObjectDoesNotExist:
#        return HttpResponse("Больше не существует")
#    data = {} 
#    comment  = Comment.objects.filter(post_id=post_id)
#    page = request.GET.get('page')
#    _type = request.GET.get('_type')
#    posts = Post.objects.filter(user_post__id=post_id.user_post.id).order_by('-date_post').exclude(id=post)
#    paginator = Paginator(posts, 3)
#    data['us'] = auth.get_user(request).username
#    try:
#        post_user = paginator.page(page)
#        data['op1'] = paginator.page(page).next_page_number()
#        data['op2'] = paginator.page(page).previous_page_number()
#    except PageNotAnInteger:
#        post_user = paginator.page(1)
#    except EmptyPage:
#        post_user = paginator.page(paginator.num_pages)
#    if page:
#        data['data'] = serializers.serialize('json', post_user)
#        return HttpResponse(json.dumps(data), content_type = "application/json")
#    if _type == "javascript":    
#        return render(request, 'post.html', {'post_user': post_user, 'post':post_id, 'username':auth.get_user(request),
#                                             'comment':comment})
#    else:
#        return render(request, '_post.html', {'post_user': post_user, 'post':post_id, 'username':auth.get_user(request),
#                                              'comment':comment})                                      



def post(request, post):
    try:
        post_id = Post.objects.get(id=post)
    except ObjectDoesNotExist:
        return HttpResponse("Больше не существует")
    data = {} 
    page = 1 #request.GET.get('page')
    _type = request.GET.get('_type')
    data['us'] = auth.get_user(request).username
    comment  = Comment.objects.filter(post_id=post_id).order_by('-timecomment')
    comment_paginator = Paginator(comment, 10)
    comment_data = comment_paginator.get_page(page)
    try:
        data['op1'] = comment_paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = comment_paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"    
#    if page:
#        data['data'] = serializers.serialize('json', comment_data)
#        return HttpResponse(json.dumps(data), content_type = "application/json")
    if _type == "javascript":    
        return render(request, 'post.html', {'post':post_id, 'username':auth.get_user(request),
                                             'comment':comment_data})
    else:
        return render(request, '_post.html', {'post':post_id, 'username':auth.get_user(request),
                                              'comment':comment_data})                                      


def viewcom(request, post_id):
#    comment  = Comment.objects.filter(post_id=post_id)
#    return render(request, 'comv.html',{'comment':comment,'id':post_id})
    comment = Comment.objects.filter(post_id=post_id).order_by('-timecomment')#.order_by('timecomment')#.reverse() # .order_by('-timecomment')
    paginator = Paginator(comment, 10)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages 
    comments = paginator.get_page(page) 
    try:
        data['op1'] = paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"
        
    if page:
        data['data'] = serializers.serialize('json', comments, use_natural_foreign_keys=True, use_natural_primary_keys=True)
        #render_to_string('comv.html', {'comment':comments,'id':post_id}, request=request)
        return HttpResponse(json.dumps(data), content_type = "application/json")

    return render(request, 'comv.html',{'comment':comments,'id':post_id})
    
    
def best(request):
    post = Post.objects.all().order_by('-point_likes')
    paginator = Paginator(post, 30)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
    data['op'] = paginator.num_pages
    data['op1'] = paginator.page_range
    try:
        posts = paginator.page(page)
        data['op2'] = paginator.page(page).next_page_number()
        data['op3'] = paginator.page(page).previous_page_number()
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
    if page:
        data['data'] = serializers.serialize('json', posts)
        return HttpResponse(json.dumps(data), content_type = "application/json")
    return render(request, 'best.html', {'post': posts, 'username': auth.get_user(request).username})


class UserForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('username','image_user',)


def login(request):
    args = {}
    args.update(csrf(request))
    if request.POST:
        username = request.POST.get('username','')
        password = request.POST.get('password','')
        user = auth.authenticate(username=username,password=password)
        if user is not None:
            auth.login(request, user)
            return redirect('/')
        else:
            try:
                U = User.objects.get(username=username)
                if U.password != password:
                    args['login_error']= 'Не правильный пароль'
            except User.DoesNotExist:
                args['login_error']= 'Пользователь не найден'

            t = loader.get_template('login.html')
            template = Template('{%extends "' + "base.html" + '"%} ...'+t.template.source)
            context = Context(args)
            result = template.render(context)
            return HttpResponse(result)
#            return render(request, 'login.html',args)            

    else:
        return render(request, 'login.html', args)


def logout(request):
    auth.logout(request)
    return redirect("/")


def register(request):
    args = {}
    args.update(csrf(request))
    args['form'] = UserForm()
    if request.POST:
        
        newuser_form = UserForm(request.POST, request.FILES)
        error_str = f"<html><body>{newuser_form.errors}</body></html>"
        if newuser_form.is_valid():
            path = str(uuid.uuid4())[:12]
            nameFile = f"{path}_{str(newuser_form.cleaned_data['username'])}.png"
            if not os.path.exists(f"media/data_image/{path}"):
                os.makedirs(f"media/data_image/{path}")
            
            
            with open(f"media/data_image/{path}/{nameFile}", 'wb+') as photo_save:
                for chunk in request.FILES['image_user'].chunks():
                    photo_save.write(chunk)
                    
            crop(path, nameFile, (150, 150))       
#            http://xn--90aci8aadpej1e.com/user/4
            
            new_author = newuser_form.save(commit=False)
            new_author.image_user = nameFile
            new_author.path_data = path
            
            new_author.save()
            newuser = auth.authenticate(username=newuser_form.cleaned_data['username'],
                                        password=newuser_form.cleaned_data['password2'],
                                        )
            auth.login(request, newuser)
            return redirect('/')
        else:
            args['form'] = newuser_form
            t = loader.get_template('register.html')
            template = Template('{%extends "' + "base.html" + '"%} ...'+t.template.source)
            context = Context(args)
            result = template.render(context)
            return HttpResponse(result)            
    else:
        _type = request.GET.get('_type')    
        if _type == "javascript":  
            return render(request, 'register.html', args)
        else:
            t = loader.get_template('register.html')
            template = Template('{%extends "' + "base.html" + '"%} ...'+t.template.source)
            context = Context(args)
            result = template.render(context)
            return HttpResponse(result)             


def user(request):
    args = {}
    args['username'] = auth.get_user(request).username
    args['id'] = auth.get_user(request).id
    args.update(csrf(request))
    if request.method == 'POST':
        usn = request.GET['username']
        userP = User.objects.get(username=str(usn))
        data = json.loads(request.body)
        image_post = data['my_image']
        color = data['color']
        if image_post != "undefined":
            imgstr = re.search(r'base64,(.*)', image_post).group(1)
            nameFile = f"{str(uuid.uuid4())[:12]}_{str(auth.get_user(request).username)}.png"
            img_file = open(f"media/data_image/{userP.path_data}/{nameFile}", 'wb+')
            img_file.write(base64.b64decode(imgstr))
            img_file.close()
            crop(userP.path_data, nameFile, (150, 150))  
            userP.image_user = nameFile
        userP.color = color
        userP.save()
    return render(request, 'profile.html', args)


def addfolow(request, user_info, username, userid):
    usse = User.objects.get(username=username)
    user_info.add_relationship(usse, RELATIONSHIP_FOLLOWING)


def delfolow(request, user_info, username, userid):
    usse = User.objects.get(username=username)
    user_info.remove_relationship(usse, RELATIONSHIP_FOLLOWING)


def follow(request, id):
    p = User.objects.get(id=id).get_followers()
    paginator = Paginator(p, 50) #.all() orphans=3
    page = request.GET.get('page', 0)
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages 
    users = paginator.get_page(page) 
    try:
        data['op1'] = paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"
            
    print (len(users), data) #/paginator.page(page).previous_page_number()
    data['data'] = serializers.serialize('json', users, fields=('username', 'image_user', 'path_data', 'date_joined'))
    return HttpResponse(json.dumps(data), content_type = "application/json")


def follows(request, id):
    p = User.objects.get(id=id).get_following()
    paginator = Paginator(p, 50) #.all() orphans=3
    page = request.GET.get('page', 0)
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages 
    users = paginator.get_page(page) 
    try:
        data['op1'] = paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"
            
    print (len(users), data) #/paginator.page(page).previous_page_number()
    data['data'] = serializers.serialize('json', users, fields=('username', 'image_user', 'path_data', 'date_joined'))
    return HttpResponse(json.dumps(data), content_type = "application/json")

from django.template import RequestContext
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
channel_layer = get_channel_layer()
# страница пользователя
def user_page(request, user):
    user_info = User.objects.get(pk=user)
    foll_blank = 0
    if str(request.user) != "AnonymousUser":
        if user_info in request.user.relationship.all():
            foll_blank = 1
    if request.method == 'GET':
        post = list(Post.objects.filter(user_post__id=user))
        p = Post.objects.filter(relike=user_info)
        post += p
        paginator = Paginator(post, 20)
        page = request.GET.get('page')
        data = {}
        data['us'] = auth.get_user(request).username
        data['all_pages'] = paginator.num_pages  
        try:
            posts = paginator.page(page)
            data['op1'] = paginator.page(page).next_page_number()
            data['op2'] = paginator.page(page).previous_page_number()
        except PageNotAnInteger:
            posts = paginator.page(1)
        except EmptyPage:
            data['op1'] = "STOP"
            posts = paginator.page(paginator.num_pages)
        if page:
            data['data'] = serializers.serialize('json', posts)
            return HttpResponse(json.dumps(data), content_type = "application/json")
        
#        try:
#            async_to_sync(channel_layer.group_add)("wall", UserChannels.get(user).dict()["channels"])
#        except:
#            P = UserChannels(channels=UserChannels.get(user).dict()["channels"], online=False)
#            P.pk = user
#            P.save()
#        async_to_sync(channel_layer.send)(UserChannels.get(user).dict()["channels"], {"type": "wallpost"})
        
        _type = request.GET.get('_type')    
        if _type == "javascript":    
            return render(request, 'user.html', {'user_info':user_info, 
                                                 'post':posts,
                                                 'online': user_info.online,
                                                 'username':auth.get_user(request),
                                                 'foll_blank':foll_blank,
                                                 'userid':auth.get_user(request).pk})
        else:
        
#            args = {'user_info':user_info, 
#                    'post':posts,
#                    'username':auth.get_user(request),
#                    'foll_blank':foll_blank,
#                    'userid':auth.get_user(request).pk}
#            t = loader.get_template('user.html')
#            template = Template('{%extends "' + "base.html" + '"%} ...'+t.template.source)
##            context = Context(args)
#            context = RequestContext(request, args)
#            result = template.render(context)
#            return HttpResponse(result)
            
            return render(request, '_user.html', {'user_info':user_info, 
                                                 'post':posts,
                                                 'online': user_info.online,
                                                 'username':auth.get_user(request),
                                                 'foll_blank':foll_blank,
                                                 'userid':auth.get_user(request).pk})

    if request.method == 'POST':
        username = request.GET.get('username')
        userid = request.GET.get('userid')
        user_blank = request.GET.get('user_blank')
        if int(user_blank) == 1:
            addfolow(request, user_info, username, userid)
            return HttpResponse('ok', content_type = "application/json")
        if int(user_blank) == 0:
            delfolow(request, user_info, username, userid)
            return HttpResponse('ok', content_type = "application/json")

# друзья
from privatemessages.utils import send_message
from privatemessages.models import Thread
#def friends(request):
#    if request.user.is_authenticated:
#        if request.method == 'GET':
#            user = auth.get_user(request).get_friends()
#            data = {}
#            data["data"] = serializers.serialize('json', user, fields=('username', 'image_user', 'path_data'))
#            return JsonResponse(data)
#        if request.method == 'POST':
##            print ("POST FR", request.user.is_authenticated, request.user)
#            data = json.loads(request.body)
#            recipient = User.objects.get(pk=data["user_id"])
#            print (data, recipient)
#            thread_queryset = Thread.objects.filter(participants=recipient).filter(participants=request.user)
#            if thread_queryset.exists():
#                thread = thread_queryset[0]
#            else:
#                thread = Thread.objects.create()
#                thread.participants.add(request.user, recipient)            
#            send_message(
#                            thread.id,
#                            request.user.id,
#                            data["post_id"],
#                            request.user.username,
#                            "True"
#                        )
#            return JsonResponse({"data":"ok"})


def friends(request):
    if request.user.is_authenticated:
        if request.method == 'GET':
            user = auth.get_user(request).get_friends()
            paginator = Paginator(user, 100) #.all() orphans=3
            page = request.GET.get('page', 0)
            data = {}
            data['us'] = auth.get_user(request).username
            data['all_pages'] = paginator.num_pages 
            users = paginator.get_page(page) 
            try:
                data['op1'] = paginator.page(page).next_page_number()
            except EmptyPage:
                data['op1'] = "STOP"
            except PageNotAnInteger:
                data['op1'] = "STOP"
                
            try:
                data['op2'] = paginator.page(page).previous_page_number()
            except EmptyPage:
                data['op2'] = "STOP"    
            except PageNotAnInteger:
                data['op2'] = "STOP"
                    
            print (len(users), data)
            data['data'] = serializers.serialize('json', users, fields=('username', 'image_user', 'path_data', 'date_joined'))
            return HttpResponse(json.dumps(data), content_type = "application/json")
            
        if request.method == 'POST':
            data = json.loads(request.body)
            recipient = User.objects.get(pk=data["user_id"])
            print (data, recipient)
            thread_queryset = Thread.objects.filter(participants=recipient).filter(participants=request.user)
            if thread_queryset.exists():
                thread = thread_queryset[0]
            else:
                thread = Thread.objects.create()
                thread.participants.add(request.user, recipient)            
            send_message(
                            thread.id,
                            request.user.id,
                            data["post_id"],
                            request.user.username,
                            "True"
                        )
            return JsonResponse({"data":"ok"})


# страница пользователей
def users_all(request):
    paginator = Paginator(User.objects.all(), 40)
    page = request.GET.get('page', None)
    _type = request.GET.get('_type')
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages    
    users = paginator.get_page(page) 
    try:
        data['op1'] = paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"

    if page:
        # сложная реализация
        data['data'] = ExtJsonSerializer().serialize(users, fields=('username', 'image_user', 'path_data'), props=['online'])
        return HttpResponse(json.dumps(data), content_type = "application/json")
        
#        # простая реализация
#        _data = json.loads(serializers.serialize('json', users, fields=('username', 'image_user', 'path_data')))
#        for ix, i in enumerate(_data):
#            try:
#                online = UserChannels.get(i["pk"]).dict()["online"]
#            except Exception as e: 
#                online = False
#            _data[ix]["online"] = online
#        data['data'] = json.dumps(_data)
#        return HttpResponse(json.dumps(data), content_type = "application/json")

    if _type == "javascript":    
        return render(request, 'users.html', {'users':users,
                                              'username':auth.get_user(request)})
    else:
#        args = {'users':posts, 'username':auth.get_user(request)}
#        t = loader.get_template('users.html')
#        template = Template('{%extends "' + "base.html" + '"%} ...'+t.template.source)
#        context = RequestContext(request, args)
#        result = template.render(context)
#        return HttpResponse(result)
    
        return render(request, '_users.html', {'users':users,
                                              'username':auth.get_user(request)})



def likeover(request):
    page = request.GET.get('page', None)
    ps_id = request.GET.get('post_id', None)
    posts = Post.objects.get(id=ps_id).likes.all()
    print (posts)
    paginator = Paginator(posts, 100)
    
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages    
    posts = paginator.get_page(page) 
    try:
        data['op1'] = paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"

    data['data'] = serializers.serialize('json', posts, fields=('username', 'image_user', 'path_data'))
    return HttpResponse(json.dumps(data), content_type = "application/json")
    

def getlkpost(request, id):
    ht = ''
    post = Post.objects.all().filter(likes__id=id)
    paginator = Paginator(post, 6)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages   
    posts = paginator.get_page(page) 
    try:
        data['op1'] = paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"    
  ##walload.html  
    data['data'] = render_to_string("walload.html", { "thread_messages": posts, "username": auth.get_user(request)}, request=request) # Вариант 2
    
#    data['data'] = serializers.serialize('json', posts, use_natural_foreign_keys=True, use_natural_primary_keys=True,
#                                                 fields=('body', 'date_post', 'image', 'path_data', 
#                                                         'user_post', 'title', 'point_likes')) # Вариант 1
    return HttpResponse(json.dumps(data), content_type = "application/json")   

#@cache_page(60)
def main_page(request):
    if not request.user.is_authenticated:
        return index(request)
    thread = Post.objects.all().order_by("-date_post")
    paginator = Paginator(thread, 6)
    page = request.GET.get('page')
    _type = request.GET.get('_type')
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages   
    posts = paginator.get_page(page) 
    try:
        data['op1'] = paginator.page(page).next_page_number()
    except EmptyPage:
        data['op1'] = "STOP"
    except PageNotAnInteger:
        data['op1'] = "STOP"
        
    try:
        data['op2'] = paginator.page(page).previous_page_number()
    except EmptyPage:
        data['op2'] = "STOP"    
    except PageNotAnInteger:
        data['op2'] = "STOP"

    if page:
        data['data'] = render_to_string("walload.html", { "thread_messages": posts, "username": auth.get_user(request)}, request=request)
        return HttpResponse(json.dumps(data), content_type = "application/json")

    if _type == "javascript":    
        return render(request, 'postwall.html', { "thread_messages": posts,
                                                  "username": auth.get_user(request) })
    else:
        args = { "thread_messages": posts, "username": auth.get_user(request) }
        t = loader.get_template('postwall.html')
        template = Template('{%extends "' + "base.html" + '"%} ...'+t.template.source)
        context = RequestContext(request, args)
        result = template.render(context)
        return HttpResponse(result)
    
def addpost(request):
    _type = request.GET.get('_type')
    if _type == "javascript": 
        return render(request, 'addpost.html')
    else:
        args = { "username": auth.get_user(request) }
#        t = loader.get_template('addpost.html')
#        template = Template('{%extends "' + "base.html" + '"%} ...'+t.template.source)

        t = Template('{% block addpost %}<script>addPost()</script>{% endblock %}')
        template = Template('{%extends "' + "base.html" + '"%} ...'+t.source)
        context = RequestContext(request, args)
        result = template.render(context)
        return HttpResponse(result)
        
# Поиск Redis Search
from myapp.ormsearch import UserDocument#PostDocument
document_class = UserDocument

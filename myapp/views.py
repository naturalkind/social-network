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



@login_required
def create_comment(request):
    ps_id = None
    if request.method == 'GET':
        ps_id = request.GET['post_id']
        text = request.GET['comment_text']
    if ps_id:
        ans = Post.objects.get(id=(int(ps_id)))
        if ans:

              Comment.objects.create(comment_text=text, comment_user=request.user, post_id=ans)
              x = 'тебе не нравиться'
    return HttpResponse(x)


@login_required
def rppos(request, id):
    if request.method == 'GET':
    # if request.method == 'POST':
        username = request.GET.get('username')
        psse = Post.objects.get(id=int(id))
        usse = User.objects.get(username=username)
         
        if psse.relike.filter(id=request.user.id).exists():
            psse.remove_rela(usse, RELATIONSHIP_FOLLOWING)
#            return HttpResponse('удалили', content_type = "application/json")
            li = 0
            return JsonResponse({"answer":'удалили', "like-indicator":li})
        else:
            li = 1
            psse.add_rela(usse, RELATIONSHIP_FOLLOWING)
#            return HttpResponse('добавили', content_type = "application/json")    
            return JsonResponse({"answer":'добавили', "like-indicator":li})


@login_required
def add_like(request):
    ps_id = None
    if request.method == 'GET':
        ps_id = request.GET['post_id']
    if ps_id:
        ans = Post.objects.get(id=(int(ps_id)))
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
              x = request.user.username +' '+ u'понравилось'
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
def post(request, post):
    try:
        post_id = Post.objects.get(id=post)
    except ObjectDoesNotExist:
        return HttpResponse("Больше не существует")
    data = {} 
    comment  = Comment.objects.filter(post_id=post_id)
    page = request.GET.get('page')
    posts = Post.objects.filter(user_post__id=post_id.user_post.id).order_by('-date_post').exclude(id=post)
    paginator = Paginator(posts, 3)
    data['us'] = auth.get_user(request).username
    try:
        post_user = paginator.page(page)
        data['op1'] = paginator.page(page).next_page_number()
        data['op2'] = paginator.page(page).previous_page_number()
    except PageNotAnInteger:
        post_user = paginator.page(1)
    except EmptyPage:
        post_user = paginator.page(paginator.num_pages)
    if page:
        data['data'] = serializers.serialize('json', post_user)
        return HttpResponse(json.dumps(data), content_type = "application/json")
    data['post_user_likes'] = post_id.likes.all()

    return render(request, 'post.html', {'post_user': post_user, 'post':post_id, 'username':auth.get_user(request).username,
                                         'comment':comment, 'post_user_likes': post_id.likes.all()})


def viewcom(request, post_id):
    comment  = Comment.objects.filter(post_id=post_id)
    return render(request, 'comv.html',{'comment':comment,'id':post_id})
    
    
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
            args['login_error']= 'Пользователь не найден'
            return render(request, 'login.html',args)
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
#            print (">>>>>>>>>>>>>", error_str)
#            return HttpResponse(error_str)
#    else:
    return render(request, 'register.html', args)


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
        imgstr = re.search(r'base64,(.*)', image_post).group(1)
        #----------->
        nameFile = f"{str(uuid.uuid4())[:12]}_{str(auth.get_user(request).username)}.png"
        img_file = open(f"media/data_image/{userP.path_data}/{nameFile}", 'wb+')
        img_file.write(base64.b64decode(imgstr))
        img_file.close()
        crop(userP.path_data, nameFile, (150, 150))  
        userP.image_user = nameFile
        userP.save()
    return render(request, 'profile.html', args)


def getps(i):
    ps = Post.objects.get(id=int(i))
    return ps


def addfolow(request, user_info, username, userid):
    usse = User.objects.get(username=username)
    user_info.add_relationship(usse, RELATIONSHIP_FOLLOWING)


def delfolow(request, user_info, username, userid):
    usse = User.objects.get(username=username)
    user_info.remove_relationship(usse, RELATIONSHIP_FOLLOWING)


def follow(request, id):
    ht = ''
    p = User.objects.get(id=id)
    for x in p.get_followers():
        img = f'/media/data_image/{x.path_data}/tm_{x.image_user}'
        idu = str(x.pk)
        if len(str(x.username)) > 15:
            uname = f"str(x.username)[:15]..."
        else:
            uname = str(x.username)
        li = """<div class="fr-cell"><a onclick="userPROFILE('%s')" style="color:#ffffff"><img src="%s">%s</a></div>""" % (idu, img, uname)
        ht += li
    return HttpResponse("<div id='foll'>%s</div>" % ht)


def follows(request, id):
    ht = ''
    p = User.objects.get(id=id)
    for x in p.get_following():
        img = f'/media/data_image/{x.path_data}/tm_{x.image_user}'
        idu = str(x.pk)
        if len(str(x.username)) > 15:
            uname = f"{str(x.username)[:10]}..."
        else:
            uname = str(x.username)
        li = """<div class="fr-cell"><a onclick="userPROFILE('%s')" style="color:#ffffff"><img src="%s">%s</a></div>""" % (idu, img, uname)
        ht += li
    return HttpResponse("<div id='foll'>%s</div>" % ht)

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
        for i in p:
            post.append(getps(int(i.id)))
        paginator = Paginator(post, 20)
        page = request.GET.get('page')
        print ("user_page>>>>>>>>>>>>", page, request, paginator.num_pages)
        
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
            print (data)
            data['data'] = serializers.serialize('json', posts)
            return HttpResponse(json.dumps(data), content_type = "application/json")
            
        _type = request.GET.get('_type')    
        if _type == "javascript":    
            return render(request, 'user.html', {'user_info':user_info, 'post':posts,
                                                 'username':auth.get_user(request),
                                                 'foll_blank':foll_blank,
                                                 'userid':auth.get_user(request).pk})
        else:
            return render(request, '_user.html', {'user_info':user_info, 'post':posts,
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



# страница пользователей
def users_all(request):
    users = User.objects.all()
    paginator = Paginator(users, 40)
    page = request.GET.get('page', None)
    _type = request.GET.get('_type')
    print (page, _type, paginator.num_pages)
    posts = paginator.page(1)
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
        posts = paginator.page(paginator.num_pages)
        data['op1'] = "STOP"
    if page:
        
        data['data'] = serializers.serialize('json', posts)
        return HttpResponse(json.dumps(data), content_type = "application/json")
    if _type == "javascript":    
        return render(request, 'users.html', {
                                              'users':posts,
                                              'username':auth.get_user(request)})
    else:
        return render(request, '_users.html', {'users':posts,
                                              'username':auth.get_user(request)})



def likeover(request):
    if request.method == 'GET':
        ps_id = request.GET['post_id']
    if ps_id:
        ans = Post.objects.get(id=(int(ps_id)))
        df = ans.likes.all()
        lk = serializers.serialize('json', df)
    return HttpResponse(lk, content_type = "application/json")
    

def getlkpost(request,id):
    ht = ''
    user = User.objects.get(id=id)
    ps = Post.objects.all().filter(likes=user)
    for x in ps:
        pid = str(x.id)
        li = f"""<li class="views-foll" width="600px"><div class="views-title" onclick="showContent('{pid}')">{x.title}</div><img src="/media/data_image/{x.path_data}/{x.image}" id="imgf" onclick="showContent('{pid}')"><img class="icon-like" src="/media/images/mesvF.png" onclick="comView(this)" open-atr="close" id-comment="{pid}" id="comment_image_id_{pid}" type-div="icon" indicator-ws="close" style="display:none;"></li>"""
        ht += li

    return HttpResponse(ht)


def chat_view(request):
    print ("chat_view>>>>>>>>>>>>>>>>>>>")
    if not request.user.is_authenticated:
        return index(request)
    thread = Post.objects.all().order_by("-date_post")
    paginator = Paginator(thread, 6)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
    data['all_pages'] = paginator.num_pages   
#    foll_blank = 0
#    if auth.get_user(request).username in list(thread.relike.all()):
#        foll_blank = 1    
#    print (thread)
#    for p in thread:
#        print (p.get_foll())
#        dir(p), 
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

    return render(request, 'postwall.html',
                              {
                                  "thread_messages": posts,
                                  "username": auth.get_user(request)
                              },
                              )

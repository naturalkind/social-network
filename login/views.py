# -*- coding: utf-8 -*-
from django.shortcuts import render_to_response, redirect, HttpResponse
from django.contrib import auth
from django.core.context_processors import csrf
from django.contrib.auth.forms import UserCreationForm
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from myapp.models import Post
from django.contrib.auth.models import User
from PIL import Image
import re
import base64
import json
import uuid

# Create your views here.

def login(request):
    args = {}
    args.update(csrf(request))
    if request.POST:
        username = request.POST.get('username','')
        password = request.POST.get('password','')
        user = auth.authenticate(username=username,password=password)
        if user is not None:
            auth.login(request,user)
            return redirect('/')
        else:
            args['login_error']= 'Пользователь не найден'
            return render_to_response('login.html',args)
    else:
        return render_to_response('login.html', args)

def logout(request):
    auth.logout(request)
    return redirect("/")

def register(request):
    args = {}
    args.update(csrf(request))
    args['form'] = UserCreationForm()
    if request.POST:
        newuser_form = UserCreationForm(request.POST, request.FILES)
        if newuser_form.is_valid():
            #print newuser_form.cleaned_data['username'], newuser_form.cleaned_data['password2']
            IDS = newuser_form.save()
            newuser = auth.authenticate(username=newuser_form.cleaned_data['username'],password=newuser_form.cleaned_data['password2'])
            auth.login(request, newuser)
            #nameFile = str(newuser.id)+"_"+str(newuser_form.cleaned_data['username'])+".png"
            nameFile = str(newuser_form.cleaned_data['username'])+".png"
            print (nameFile)
            with open("media/data_image/"+ nameFile, 'wb+') as photo_save:
                 for chunk in request.FILES['image_user'].chunks():
                    photo_save.write(chunk)
            crop(nameFile)       
            return redirect('/')
        else:
          args['form'] = newuser_form
    return render_to_response('register.html', args)


def crop(usn):
    size = 150, 150
    crop_type='middle'
    modified_path = "media/data_image/tm_%s" % usn
    img_path = "media/data_image/%s" % usn
    img = Image.open(img_path)
    # Get current and desired ratio for the images
    img_ratio = img.size[0] / float(img.size[1])
    ratio = size[0] / float(size[1])
    #The image is scaled/cropped vertically or horizontally depending on the ratio
    if ratio > img_ratio:
        img = img.resize((size[0], size[0] * img.size[1] / img.size[0]),
                Image.ANTIALIAS)
        # Crop in the top, middle or bottom
        if crop_type == 'top':
            box = (0, 0, img.size[0], size[1])
        elif crop_type == 'middle':
            box = (0, (img.size[1] - size[1]) / 2, img.size[0], (img.size[1] + size[1]) / 2)
        elif crop_type == 'bottom':
            box = (0, img.size[1] - size[1], img.size[0], img.size[1])
        else :
            raise ValueError('ERROR: invalid value for crop_type')
        img = img.crop(box)
    elif ratio < img_ratio:
        img = img.resize((size[1] * img.size[0] / img.size[1], size[1]),
                Image.ANTIALIAS)
        # Crop in the top, middle or bottom
        if crop_type == 'top':
            box = (0, 0, size[0], img.size[1])
        elif crop_type == 'middle':
            box = ((img.size[0] - size[0]) / 2, 0, (img.size[0] + size[0]) / 2, img.size[1])
        elif crop_type == 'bottom':
            box = (img.size[0] - size[0], 0, img.size[0], img.size[1])
        else :
            raise ValueError('ERROR: invalid value for crop_type')
        img = img.crop(box)
    else :
        img = img.resize((size[0], size[1]),
                Image.ANTIALIAS)
        # If the scale is the same, we do not need to crop
    img.save(modified_path)


def user(request):
    args = {}
    args['username'] = auth.get_user(request).username
    args.update(csrf(request))
    # args['form'] = UserForm()
    if request.method == 'POST':
        usn = request.GET['username']
        userP = User.objects.get(username=str(usn))
        data = json.loads(request.body)
        image_post = data['my_image']
        imgstr = re.search(r'base64,(.*)', image_post).group(1)
        #path = default_storage.save('%s.png' % auth.get_user(request).username , ContentFile(base64.b64decode(imgstr)))
        #----------->
        img_file = open("media/data_image/%s.png" % auth.get_user(request).username, 'wb')
        img_file.write(base64.b64decode(imgstr))
        img_file.close()
        crop("%s.png" % auth.get_user(request).username)
        userP.image_user = "media/data_image/%s.png" % auth.get_user(request).username
        
        userP.save()
    return render_to_response('profile.html', args)

from django.template import RequestContext
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.core import serializers
#from django.contrib.auth.models import RELATIONSHIP_FOLLOWING


#def addfolow(request, user_info, username):
#    usse = User.objects.get(username=username)
#    user_info.add_relationship(usse, RELATIONSHIP_FOLLOWING)

def getps(i):
    ps = Post.objects.get(id=int(i))
    return ps

def user_page(request, user):
    user_info = User.objects.get(pk=user)
    if request.method == 'GET':
        # post = Post.objects.filter(user_post__id=user).order_by('-date_post')
        post = list(Post.objects.filter(user_post__id=user))
        p = Post.objects.filter(relike=user_info)
        for i in p:
            post.append(getps(int(i.id)))
        paginator = Paginator(post, 15)
        page = request.GET.get('page')
        data = {}
        data.update(csrf(request))
        data['us'] = auth.get_user(request).username
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
        return render_to_response('user.html', {'user_info':user_info, 'post':posts,
                                                'username':auth.get_user(request).username,
                                                'userid':auth.get_user(request).pk},
                                                     context_instance=RequestContext(request))
    if request.method == 'POST':
        username = request.GET.get('username')
        #addfolow(request,user_info, username)
        return HttpResponse('ok', content_type = "application/json")

def my_page(request, username):
    user_info = User.objects.get(username=username)
    # post = Post.objects.filter(user_post__username=username).order_by('-date_post')
    post = list(Post.objects.filter(user_post__username=username))
    p = Post.objects.filter(relike=user_info)
    for i in p:
        post.append(getps(int(i.id)))
    paginator = Paginator(post, 15)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
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
    return render_to_response('user.html', {'user_info':user_info, 'post':posts,
                                            'username':auth.get_user(request).username})

# страница пользователя
def userViews(request):
    users = User.objects.all()
    paginator = Paginator(users, 25)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
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

    return render_to_response('users.html', {'users':posts,
                                             'username':auth.get_user(request).username})


def jsonu(request):
    users = User.objects.all()
    paginator = Paginator(users, 6)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
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


def getlkpost(request,id):
    ht = ''
    user = User.objects.get(id=id)
    ps = Post.objects.all().filter(likes=user)
    for x in ps:
        pid = str(x.id)
        li = """<li class="views-foll" width="600px"><div class="views-title" onclick="showContent('%s')">%s</div><img src="/media/data_image/%s.png" id="imgf" onclick="showContent('%s')"></li>""" % (pid,x.title, x.image,pid)
        ht += li

    return HttpResponse(ht)

#-*- coding: utf-8 -*-
# django module
from django.shortcuts import render_to_response, redirect, HttpResponseRedirect
from django.http import HttpResponse, Http404
try:
    from django.utils import simplejson as json
except ImportError:
    import json
from django.core.context_processors import csrf
from django.contrib import auth

# myapp module import
from myapp.models import *
import uuid
# Create your views here.


from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
import requests
import urllib
import urllib2
import json
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile


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
            return HttpResponse('удалили', content_type = "application/json")
        else:
            psse.add_rela(usse, RELATIONSHIP_FOLLOWING)
            return HttpResponse('добавили', content_type = "application/json")    

        # return HttpResponse(psse.get_foll, content_type = "application/json")

@login_required
def add_like(request):
    ps_id = None
    if request.method == 'GET':
        ps_id = request.GET['post_id']
    if ps_id:
        ans = Post.objects.get(id=(int(ps_id)))
        #votes = ans.votes
        x = []
        if ans:
            if ans.likes.filter(id=request.user.id).exists():
            # пользователь готов к созданию лайка
            # убрать лайк/пользователя
              #ans.votes =+1
              ans.likes.remove(request.user)

              x = 'тебе не нравиться'
              #ans.save()
              ans.point_likes -= int(1)

              ans.save()
            else:
              #ans.votes =-1

              ans.likes.add(request.user)
              x += request.user.username +' '+ u'понравилось'
              ans.point_likes += int(1)

              ans.save()


    return HttpResponse(x)


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

#
import re
import base64
from PIL import Image
# -*- coding: utf-8 -*-
from datetime import datetime
def crop(nameFile):
    size = 220, 150
    crop_type='middle'
    modified_path = "/home/sadko/social-network-master/media/data_image/%s_tm.png" % nameFile
    img_path = "/home/sadko/social-network-master/media/data_image/%s.png" % nameFile
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

def addpost(request):
    args = {}
    # tm = datetime.now().time()
    if request.method == 'GET':
       args['username'] = auth.get_user(request).username
       args.update(csrf(request))
       return render_to_response('addpost.html', args)
    if request.method == 'POST':
        post_title = request.GET['id_title']
        
        nameFile = str(uuid.uuid4())[:12]
        # nameFile = "%s_%s" % (post_title, auth.get_user(request).id)
        # nameFile = "%s" % post_title
        body_text = request.GET['id_text']
        data = json.loads(request.body)
        image_post = data['my_image']
        imgstr = re.search(r'base64,(.*)', image_post).group(1)
        #path = default_storage.save('/home/sadko/social-network-master/media/data_image/%s.png' % nameFile, ContentFile(imgstr))
        # pathmedium = default_storage.save('%s_tm.png' % nameFile, ContentFile(imgstr))
        img_file = open("/home/sadko/social-network-master/media/data_image/%s.png" % nameFile, 'wb')
        img_file.write(base64.b64decode(imgstr))
        img_file.close()
        # save timbinal imageMedium=pathmedium,
        crop(nameFile)
        #
        post = Post(title=post_title, body=body_text, user_post=request.user, image=nameFile)
        post.save()

        owner_id = '47376425' # intattoo
        token = '2d3fddc7fb9d92e47dda437815fab6eed531688e14402224344aa686851b455778ef49894d49fb9ce0b8b'

        # token = 'eb9bd1088f0623a59e41f8cb4ee42a1f4f38114b4e23738d5a7d96df1e8c7136af4718225d1da430bcf51'
        method_0 = 'https://api.vk.com/method/wall.post?' # 1
        method_1 = 'https://api.vk.com/method/photos.getWallUploadServer?'
        method_2 = 'https://api.vk.com/method/photos.saveWallPhoto?'
        #titVK = post.title
        titVK = post_title
            ######
        # f = open("/Users/macbookpro/PycharmProjects/app/media/%s" % path, "rb")
        f = open("/home/sadko/social-network-master/media/%s" % path, "rb")

        img = {'photo': f} #!!!!!!
        # data = dict(access_token=token, gid=owner_id)
        data = dict(group_id=owner_id,access_token=token)
        response = requests.post(method_1, data)
        result = json.loads(response.text)
        upload_url = result['response']['upload_url']
# Загружаем изображение на url
        response = requests.post(upload_url, files=img)
        result = json.loads(response.text)
# Сохраняем фото на сервере и получаем id
#         data = dict(access_token=token, gid=owner_id, photo=result['photo'], hash=result['hash'], server=result['server'])
        data = dict(group_id=owner_id, photo=result['photo'], hash=result['hash'], server=result['server'], access_token=token)
        response = requests.post(method_2, data)
        result = json.loads(response.text)['response'][0]['id']
# отправка в вк
#         data = dict(access_token=token, owner_id='-' + owner_id, attachments=result, message='%s' % titVK)

        data = dict(owner_id='-' + owner_id, attachments=result, message='%s' % titVK, access_token=token)
        response = requests.post(method_0, data)
        result = json.loads(response.text)
        return redirect('/', result)

    return render_to_response('addpost.html', args)

import md5
from django.core import serializers

def index(request):
    post = Post.objects.all().order_by('-date_post')
    paginator = Paginator(post, 24)
    page = request.GET.get('page')
    try:
        posts = paginator.page(page)
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
    if page:
        return render_to_response('indexv1.html',{'post': post, 'posts':posts, 'username': auth.get_user(request).username})
    else:
        return render_to_response('index.html',{'post': post, 'posts':posts, 'username': auth.get_user(request).username})

def jsons(request):
    f = Post.objects.all().order_by('-date_post')
    paginator = Paginator(f, 24)
    page = request.GET.get('page')
    data = {}
    data['us'] = auth.get_user(request).username
    # data['op'] = paginator.num_pages
    # data['op1'] = paginator.page_range
    try:
        posts = paginator.page(page)
        data['op1'] = paginator.page(page).next_page_number()
        data['op2'] = paginator.page(page).previous_page_number()
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
    if page:
        # return render_to_response('indexv1.html',{'posts':posts, 'username': auth.get_user(request).username})
        data['data'] = serializers.serialize('json', posts)
    return HttpResponse(json.dumps(data), content_type = "application/json")
#####

#####
def likeover(request):
    if request.method == 'GET':
        ps_id = request.GET['post_id']
    if ps_id:
        ans = Post.objects.get(id=(int(ps_id)))
        df = ans.likes.all()
        lk = serializers.serialize('json', df)


    return HttpResponse(lk, content_type = "application/json")
#
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
    return render_to_response('new.html', {'post': posts, 'username': auth.get_user(request).username})
# На выходе мы получим в ответе post_id если не было ошибки
#######
def post(request, post):
    post_id = Post.objects.get(id=post)
    data = {} #словарь
    comment  = Comment.objects.filter(post_id=post_id)
    # data.update(csrf(request))
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

    return render_to_response('post.html', {'post_user': post_user, 'post':post_id, 'username':auth.get_user(request).username,
                                             'comment':comment, 'post_user_likes': post_id.likes.all()})

def viewcom(request, post_id):
    comment  = Comment.objects.filter(post_id=post_id)
    return render_to_response('comv.html',{'comment':comment,'id':post_id})
    
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
    return render_to_response('best.html', {'post': posts, 'username': auth.get_user(request).username})




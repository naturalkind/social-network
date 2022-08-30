#-*- coding: utf-8 -*-
"""app URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin
from django.conf import settings
#from rest_framework import generics
from myapp.models import Post, User
#from myapp.serializers import UserSerializer, PostSerializer

urlpatterns = [
    ############## приложение myapp
    url(r'^admin/', include(admin.site.urls)), # административная страница
    url(r'^send_message_api/$', 'wall.views.send_message_api_view'),
    url(r'^$', 'wall.views.chat_view'),
    
    ############## Лайки/Репосты
    url(r'add_like/$', 'myapp.views.add_like', name='add_like'),
    url(r'likeover/$', 'myapp.views.likeover'),
    url(r'^rppos/(?P<id>.*)$', 'myapp.views.rppos'),
    ############## Обрезание масштабирование картинки
    url(r'crop/$', 'myapp.views.crop'),
    
    ############## Посты
    url(r'^addpost/$', 'myapp.views.addpost'), # добавление материала
    url(r'^(?P<post>\d+)/$', 'myapp.views.post'), # страница материала
    
    url(r'^new', 'myapp.views.new'), # страница новых
    url(r'^best', 'myapp.views.best'), # страница новых
    

    ############### приложение login
    url(r'^login', 'login.views.login'),
    url(r'^logout/', 'login.views.logout'),
    url(r'^register/', 'login.views.register'),
    url(r'^profile/', 'login.views.user'),
    url(r'(\d{1,2})/(?P<user>\d+)/', 'login.views.user_page'), # пользователь
    url(r'^user/(?P<user>\d+)/', 'login.views.user_page'), # пользователь
    url(r'^users/(?P<user>\d+)/', 'login.views.user_page'), # пользователь
    url(r'^users/$', 'login.views.userViews'),
    url(r'^my/(?P<username>\w+)/', 'login.views.my_page'),
# сообщения
    url(r'^messages/', include('privatemessages.urls')),
# уроки
    ##
    url(r'^jsonu/', 'login.views.jsonu'), # пользователь
    url(r'^json/', 'myapp.views.jsons'), # контент
# медиа ссылки
    url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.MEDIA_ROOT}),

    ##################### Подписаться на пользователя
    url(r'^follow/(?P<id>.*)$', 'login.views.follow'),
    url(r'^follows/(?P<id>.*)$', 'login.views.follows'),
    url(r'^getlkpost/(?P<id>.*)$', 'login.views.getlkpost'),
    ##################### Коментарии
    url(r'^viewcom/(?P<post_id>.*)$', 'myapp.views.viewcom'),
    url(r'^create_post/$', 'myapp.views.create_post'),
    url(r'^create_comment/$', 'myapp.views.create_comment'),
    url(r'^commentapi/(?P<post_id>\d+)/$', 'comment.views.send_comment_api_view'),
]

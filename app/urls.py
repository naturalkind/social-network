"""app URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include
from django.urls import path
from django.urls import re_path
from django.conf import settings

from myapp import views as myapp

#from django.views.static import serve 
#path(r'^media/(?P<path>.*)$', serve,{'document_root': settings.MEDIA_ROOT}),

from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', myapp.chat_view),

    # пользовательский материал
    re_path(r'^data/(?P<post>\d+)/$', myapp.post), # страница материала
    
    # вход выход для пользователя
    path(r'login', myapp.login), 
    path(r'logout/', myapp.logout),
    path(r'register/', myapp.register),  
    path(r'profile/', myapp.user),
    path(r'users/', myapp.users_all),
    re_path(r'user/(?P<user>\d+)/', myapp.user_page), 
    
    # сообщения
    path(r'messages/', include('privatemessages.urls')), 
    
    # подписки/подписчики, любимый контент
    re_path(r'^follow/(?P<id>.*)/', myapp.follow),
    re_path(r'^follows/(?P<id>.*)/', myapp.follows),
    re_path(r'^getlkpost/(?P<id>.*)/', myapp.getlkpost), 
    
    # друзья
    re_path(r'^friends/', myapp.friends), 
    
    # лайки/репосты
    re_path(r'add_like/$', myapp.add_like, name='add_like'),
    re_path(r'likeover/$', myapp.likeover),
    re_path(r'^rppos/(?P<id>.*)$', myapp.rppos),
    
    # комментарии
#    re_path(r'^comment/(?P<post_id>.*)$', myapp.viewcom),
    re_path(r'^comment/(?P<post_id>.*)/', myapp.viewcom),
    
    # тест выбора цвета
    re_path(r'^test_js/', myapp.test_js), 
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


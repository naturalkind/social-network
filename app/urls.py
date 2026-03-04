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
from django.views.generic import TemplateView
from django.contrib.auth import views as auth_views
from django.contrib import admin
from django.urls import include
from django.urls import path
from django.urls import re_path
from django.conf import settings

from api.views import RegisterView, LoginView, LogoutView

#from django.views.static import serve 
#path(r'^media/(?P<path>.*)$', serve,{'document_root': settings.MEDIA_ROOT}),

from django.conf.urls.static import static, serve
urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    
    path('api/', include('api.urls')),  # новые API
    
    re_path(r'^(?!api|admin|media|login|logout|register).*$', TemplateView.as_view(template_name='base.html'), name='home'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


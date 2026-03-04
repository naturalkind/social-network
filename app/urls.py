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

from django.conf.urls.static import static, serve
urlpatterns = [
    path('admin/', admin.site.urls),
    re_path(r'^(?!api|admin|media).*$', myapp.main_page),
    path('api/', include('api.urls')),  # новые API
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


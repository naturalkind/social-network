"""
Django settings for app project.

Generated by 'django-admin startproject' using Django 1.8.4.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))

IP_SYS = s.getsockname()[0]

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '(ztg!4x93jlg24hirejick24dj6p2@(bmn$h_#l3)uv+bzq638'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = (
    'cacheops',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'myapp',
    'login',
    'privatemessages',
    'wall',
    'comment',
)

AUTH_USER_MODEL = 'myapp.User'
MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
)

ROOT_URLCONF = 'app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates/',],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'app.wsgi.application'

# Redis
SESSION_ENGINE = 'redis_sessions.session'
#
# SESSION_REDIS_HOST = 'localhost'
# SESSION_REDIS_PORT = 6379
# SESSION_REDIS_DB = 0
# SESSION_REDIS_PASSWORD = 'password'
# SESSION_REDIS_PREFIX = 'session'
# SESSION_REDIS_SOCKET_TIMEOUT=1

# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    'default': {

        # 'ENGINE': 'south.db.sqlite3',
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

# LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

LANGUAGE_CODE = 'ru-RU'

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, "static"),
    'media/data_image',
)

STATIC_ROOT = os.path.join('media/static/')
STATIC_URL = '/media/static/'
# Media

MEDIA_URL = '/media/'
MEDIA_ROOT = 'media'

#chat
API_KEY = '$0m3-U/\/1qu3-K3Y'


SEND_MESSAGE_API_URL = 'http://'+ IP_SYS +':8888/messages/send_message_api'
SEND_POST_API_URL = 'http://'+ IP_SYS +':8888/send_message_api'




CACHES = {
    'default': {
        'BACKEND': 'redis_cache.RedisCache',
    },
}

CACHEOPS_REDIS = {
    'host': 'localhost',
    'port': 6379,
    'socket_timeout': 3,
}



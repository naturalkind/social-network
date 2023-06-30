"""
Django settings for app project.

Generated by 'django-admin startproject' using Django 3.2.16.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.2/ref/settings/
"""

from pathlib import Path
import os
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

#SECURE_CROSS_ORIGIN_OPENER_POLICY = None

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
#LOGGING = {
#    'version': 1,
#    'formatters': {
#        'verbose': {
#            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
#        },
#        'simple': {
#            'format': '%(levelname)s %(message)s'
#        },
#    },
#    'handlers': {
#        'console': {
#            'level': 'DEBUG',
#            'class': 'logging.StreamHandler',
#            'formatter': 'simple'
#        },
#        'file': {
#            'level': 'DEBUG',
#            'class': 'logging.FileHandler',
#            'filename': 'log/file.log',
#            'formatter': 'simple'
#        },
#    },
#    'loggers': {
#        'django': {
#            'handlers': ['file'],
#            'level': 'DEBUG',
#            'propagate': True,
#        },
#    }
#}

#if DEBUG:
#    # make all loggers use the console.
#    for logger in LOGGING['loggers']:
#        LOGGING['loggers'][logger]['handlers'] = ['console']




ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '178.158.131.41', '192.168.1.50', 'сообщество.com', 'xn--90aci8aadpej1e.com', 'www.xn--90aci8aadpej1e.com']

#SESSION_COOKIE_HTTPONLY=False

# Application definition

INSTALLED_APPS = [
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'myapp',
    'wall',
    'privatemessages',
    'redis_search_django',
]

AUTH_USER_MODEL = 'myapp.User'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'myapp.middleware.ActiveUserMiddleware'
]

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
ASGI_APPLICATION = "app.asgi.application"

#https://github.com/django/channels_redis/issues/332
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.pubsub.RedisPubSubChannelLayer",
        "CONFIG": {
            "hosts": ["redis://localhost:6379/4"],
        },
    },
}

#CHANNEL_LAYERS = {
#    "default": {
#        "BACKEND": "channels_redis.core.RedisChannelLayer",
#        "CONFIG": {
#            "hosts": [("localhost", 6379)],
#        },
#    },
#}

#CHANNEL_LAYERS = {
#    'default': {
#        ## Method 1: Via redis lab
#        # 'BACKEND': 'channels_redis.core.RedisChannelLayer',
#        # 'CONFIG': {
#        #     "hosts": [
#        #       'redis://h:le16Dn6dYwGHOZLF9vWxySxmQSIwE4Zz@redis-12573.c99.us-east-1-4.ec2.cloud.redislabs.com:12573' 
#        #     ],
#        # }
#        
#        ## Method 2: Via local redis
#        # 'BACKEND': 'channels_redis.core.RedisChannelLayer',
#        # 'CONFIG': {
#        #     # "hosts": [('127.0.0.1', 6379)],
#        # },
#        
#        ## Method 3: Via In-memory channel layer
#        
#        "BACKEND": "channels.layers.InMemoryChannelLayer"
#    },
#}

# Redis
SESSION_ENGINE = 'redis_sessions.session'

CACHES = {
    'default': {
        "BACKEND": "django_redis.cache.RedisCache",
        'LOCATION': 'redis://127.0.0.1:6379/7',
    }
}

# Number of seconds of inactivity before a user is marked offline
USER_ONLINE_TIMEOUT = 60#300

# Number of seconds that we will keep track of inactive users for before 
# their last seen is removed from the cache
USER_LASTSEEN_TIMEOUT = 60 * 60 * 24 * 7

# Celery
CELERY_BROKER_URL = "redis://localhost:6379/4"
CELERY_RESULT_BACKEND = "redis://localhost:6379/4"

# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

#DATABASES = {
#    'default': {
#        'ENGINE': 'django.db.backends.sqlite3',
#        'NAME': BASE_DIR / 'db.sqlite3',
#    }
#}


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'com',                      
        'USER': 'sadko',
        'PASSWORD': '1qaz',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}

# Password validation
# https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
#    {
#        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
#        'OPTIONS': {
#            'min_length': 5,
#        },
#    },
#    {
#        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
#    },
#    {
#        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
#    },
]



# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = 'en-us'
#LANGUAGE_CODE = 'ru-RU'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/

#STATIC_URL = '/static/'
#STATICFILES_DIRS = (
#    os.path.join(BASE_DIR, "media/static"),
#    'media/data_image',
#)
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, "static"),
)


#STATIC_ROOT = os.path.join('/static/')
STATIC_URL = '/static/'
# Media

MEDIA_URL = '/media/'
#MEDIA_ROOT = 'media'

MEDIA_ROOT = '/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/social-network/media'

DATA_UPLOAD_MAX_MEMORY_SIZE = 31457280
DJANGO_ALLOW_ASYNC_UNSAFE = "true"


# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# redis-search-django settings

REDIS_SEARCH_AUTO_INDEX = True

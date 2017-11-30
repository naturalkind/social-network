#-*- coding: utf-8 -*-
from django.db import models
from datetime import datetime
from django.template.defaultfilters import slugify
from django.contrib.auth.models import User
import base64
import re
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from base64 import b64decode
from django.core.files.base import ContentFile
# Create your models here.
def get_upload_file_name(file, name):
    return 'media/%s' % name


class Post(models.Model):
    title = models.CharField(max_length=50, default="", verbose_name='Загаловок', blank=True)
    video = models.TextField(max_length=200, default="", verbose_name='Название видео', blank=True)
    audio = models.TextField(max_length=200, default="", verbose_name='Название аудио', blank=True)
    image = models.TextField(max_length=200, default="", verbose_name='Название картинки', blank=True)
    body = models.TextField(max_length=999999, default="", verbose_name='Текст', blank=True)
    date_post = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    user_post = models.ForeignKey(User,related_name='us_post', default="")
    slug = models.SlugField(blank=True)
    likes = models.ManyToManyField(User, related_name='likes', blank=True)
    point_likes = models.IntegerField(default=0)

    #
    relike = models.ManyToManyField(User, through='Relike',symmetrical=False,related_name='userlk')


    def __unicode__(self):
            return u'name: %s , id: %s' % (self.title, self.id)

    def add_rela(self, person, status):
        relike, created = Relike.objects.get_or_create(
            from_post=self,
            to_pers=person,
            status=status)
        return relike

    def remove_rela(self, person, status):
        Relike.objects.filter(
            from_post=self,
            to_pers=person,
            status=status).delete()
        return

    def get_rela(self, status):
        return self.relike.filter(
            people_lk__status=status,
            people_lk__from_post=self)


    def get_foll(self):
        return self.get_rela(RELATIONSHIP_FOLLOWING)


###
    @property
    def total_likes(self):
        """
        Likes for the company
        :return: Integer: Likes for the company
        """
        return self.likes.count()

    def save(self, *args, **kwargs):
        self.slug = slugify(self.title)
        super(Post, self).save(*args, **kwargs)


class Comment(models.Model):
    post_id = models.ForeignKey(Post, default="")
    comment_user = models.ForeignKey(User, default="")
    comment_text = models.TextField(max_length=250, default="", blank=True)
    comment_image = models.TextField(max_length=200, default="", verbose_name='Название картинки', blank=True)
    timecomment = models.DateTimeField(auto_now_add=True, db_index=True)
# новый модуль
class Media(models.Model):
    about = models.CharField(max_length=50, default="", verbose_name='О файле', blank=True)
    media = models.TextField(max_length=200, default="", verbose_name='Название файла', blank=True)
    video = models.TextField(max_length=200, default="", verbose_name='Название видео', blank=True)
    audio = models.TextField(max_length=200, default="", verbose_name='Название аудио', blank=True)
    image = models.TextField(max_length=200, default="", verbose_name='Название картинки', blank=True)
    style = models.TextField(max_length=999999, default="", verbose_name='Текст', blank=True)
    user_post = models.ForeignKey(User, default="")

class Community(models.Model):
    user_community = models.ForeignKey(User, default="")
    users_community = models.ManyToManyField(User, related_name='users_community', blank=True)
    community_post = models.ManyToManyField(Post, related_name='community_post', blank=True)
    community_media = models.ManyToManyField(Media, related_name='community_media', blank=True)


RELATIONSHIP_FOLLOWING = 1
RELATIONSHIP_BLOCKED = 2
RELATIONSHIP_STATUSES = (
    (RELATIONSHIP_FOLLOWING, 'Following'),
    (RELATIONSHIP_BLOCKED, 'Blocked'),
)

class Relike(models.Model):
    from_post = models.ForeignKey(Post, related_name='from_post_lk')
    to_pers = models.ForeignKey(User, related_name='people_lk')
    status = models.IntegerField(choices=RELATIONSHIP_STATUSES)

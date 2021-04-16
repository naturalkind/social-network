#-*- coding: utf-8 -*-
from django.db import models
from django.template.defaultfilters import slugify

from django.conf import settings
from django.contrib.auth.models import AbstractUser

from django.core.files.base import ContentFile
from django.core import validators
from datetime import datetime
import base64
import re

# Create your models here.
RELATIONSHIP_FOLLOWING = 1
RELATIONSHIP_BLOCKED = 2
RELATIONSHIP_STATUSES = (
    (RELATIONSHIP_FOLLOWING, 'Following'),
    (RELATIONSHIP_BLOCKED, 'Blocked'),
)
class User(AbstractUser):
    relationship = models.ManyToManyField('self', through='Relationship',symmetrical=False, related_name='related_to')
    class Meta(AbstractUser.Meta):
        swappable = 'AUTH_USER_MODEL'
    def add_relationship(self, person, status):
        relationship, created = Relationship.objects.get_or_create(
            from_person=self,
            to_person=person,
            status=status)
        return relationship

    def remove_relationship(self, person, status):
        Relationship.objects.filter(
            from_person=self,
            to_person=person,
            status=status).delete()
        return

    def get_relationship(self, status):
        return self.relationship.filter(
            to_people__status=status,
            to_people__from_person=self)

    def get_related_to(self, status):
        return self.related_to.filter(
            from_people__status=status,
            from_people__to_person=self)

    def get_following(self):
        return self.get_relationship(RELATIONSHIP_FOLLOWING)

    def get_followers(self):
        return self.get_related_to(RELATIONSHIP_FOLLOWING)

    def get_friends(self):
        return self.relationship.filter(
            to_people__status=RELATIONSHIP_FOLLOWING,
            to_people__from_person=self,
            from_people__status=RELATIONSHIP_FOLLOWING,
            from_people__to_person=self)


class Relationship(models.Model):
    from_person = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='from_people')
    to_person = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='to_people')
    status = models.IntegerField(choices=RELATIONSHIP_STATUSES)


class Post(models.Model):
    title = models.CharField(max_length=50, default="", verbose_name='Загаловок', blank=True)
    video = models.TextField(max_length=200, default="", verbose_name='Название видео', blank=True)
    audio = models.TextField(max_length=200, default="", verbose_name='Название аудио', blank=True)
    image = models.TextField(max_length=200, default="", verbose_name='Название картинки', blank=True)
    body = models.TextField(max_length=999999, default="", verbose_name='Текст', blank=True)
    date_post = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    user_post = models.ForeignKey(settings.AUTH_USER_MODEL,related_name='us_post', default="")
    slug = models.SlugField(blank=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='likes', blank=True)
    point_likes = models.IntegerField(default=0)

    relike = models.ManyToManyField(settings.AUTH_USER_MODEL, through='Relike',symmetrical=False,related_name='userlk')

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
    comment_user = models.ForeignKey(settings.AUTH_USER_MODEL, default="")
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
    user_post = models.ForeignKey(settings.AUTH_USER_MODEL, default="")

class Community(models.Model):
    user_community = models.ForeignKey(settings.AUTH_USER_MODEL, default="")
    users_community = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='users_community', blank=True)
    community_post = models.ManyToManyField(Post, related_name='community_post', blank=True)
    community_media = models.ManyToManyField(Media, related_name='community_media', blank=True)

class Relike(models.Model):
    from_post = models.ForeignKey(Post, related_name='from_post_lk')
    to_pers = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='people_lk')
    status = models.IntegerField(choices=RELATIONSHIP_STATUSES)
    


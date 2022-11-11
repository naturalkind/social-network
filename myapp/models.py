#-*- coding: utf-8 -*-
from django.db import models
from django.template.defaultfilters import slugify

from django.db.models.signals import post_save

from django.conf import settings
from django.contrib.auth.models import AbstractUser

from datetime import datetime
import base64
import re

# qr code
import qrcode
import qrcode.image.svg

# Create your models here.
RELATIONSHIP_FOLLOWING = 1
RELATIONSHIP_BLOCKED = 2
RELATIONSHIP_STATUSES = (
    (RELATIONSHIP_FOLLOWING, 'Following'),
    (RELATIONSHIP_BLOCKED, 'Blocked'),
)
class User(AbstractUser):
    relationship = models.ManyToManyField('self', through='Relationship',symmetrical=False, related_name='related_to')
    image_user = models.TextField(max_length=200, default="oneProf.png", verbose_name='Название картинки', blank=True)
    path_data = models.TextField(max_length=200, default="", verbose_name='Название каталога', blank=True)
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
    
    def natural_key(self):
        return (self.image_user, self.path_data, self.id, self.username)
        
def generate_qr(sender, instance, created, **kwargs):
    print (instance.id, instance.username, instance.path_data)
    img = qrcode.make(f'http://xn--90aci8aadpej1e.com/user/{instance.id}', image_factory=qrcode.image.svg.SvgImage)
    with open(f'media/data_image/{instance.path_data}/{instance.username}_qr.svg', 'wb') as qr:
        img.save(qr)

post_save.connect(generate_qr, sender=User)


class Relationship(models.Model):
    from_person = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='from_people', on_delete=models.CASCADE)
    to_person = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='to_people', on_delete=models.CASCADE)
    status = models.IntegerField(choices=RELATIONSHIP_STATUSES)


class Post(models.Model):
    title = models.CharField(max_length=50, default="", verbose_name='Загаловок', blank=True)
    video = models.TextField(max_length=200, default="", verbose_name='Название видео', blank=True)
    image = models.TextField(max_length=200, default="", verbose_name='Название картинки', blank=True)
    path_data = models.TextField(max_length=200, default="", verbose_name='Расположение', blank=True)
    body = models.TextField(max_length=999999, default="", verbose_name='Текст', blank=True)
    date_post = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    user_post = models.ForeignKey(settings.AUTH_USER_MODEL,related_name='us_post', default="", on_delete=models.CASCADE)
    slug = models.SlugField(blank=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='likes', blank=True)
    point_likes = models.IntegerField(default=0)
    relike = models.ManyToManyField(settings.AUTH_USER_MODEL, through='Relike', symmetrical=False,related_name='userlk')

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
    post_id = models.ForeignKey(Post, default="", on_delete=models.CASCADE)
    comment_user = models.ForeignKey(settings.AUTH_USER_MODEL, default="", on_delete=models.CASCADE,)
    comment_text = models.TextField()
    comment_image = models.TextField(max_length=200, default="", verbose_name='Название картинки', blank=True)
    timecomment = models.DateTimeField(auto_now_add=True, db_index=True)
    
# новый модуль
class Media(models.Model):
    about = models.CharField(max_length=1000, default="", verbose_name='О файле', blank=True)
    media = models.TextField(max_length=1000, default="", verbose_name='Название файла', blank=True)
    path_data = models.TextField(max_length=1000, default="", verbose_name='Расположение', blank=True)
    user_post = models.ForeignKey(settings.AUTH_USER_MODEL, default="", on_delete=models.CASCADE)
    attachment = models.ManyToManyField(Post, related_name='community_post', blank=True) 
      
#    style = models.TextField(max_length=999999, default="", verbose_name='Текст', blank=True)
#class Community(models.Model):
#    user_community = models.ForeignKey(settings.AUTH_USER_MODEL, default="", on_delete=models.CASCADE)
#    users_community = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='users_community', blank=True)
#    community_post = models.ManyToManyField(Post, related_name='community_post', blank=True)
#    community_media = models.ManyToManyField(Media, related_name='community_media', blank=True)

class Relike(models.Model):
    from_post = models.ForeignKey(Post, related_name='from_post_lk', on_delete=models.CASCADE)
    to_pers = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='people_lk', on_delete=models.CASCADE)
    status = models.IntegerField(choices=RELATIONSHIP_STATUSES)
    


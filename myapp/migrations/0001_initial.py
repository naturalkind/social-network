# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('comment_text', models.TextField(default=b'', max_length=250, blank=True)),
                ('comment_image', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xba\xd0\xb0\xd1\x80\xd1\x82\xd0\xb8\xd0\xbd\xd0\xba\xd0\xb8', blank=True)),
                ('timecomment', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('comment_user', models.ForeignKey(default=b'', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Community',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
            ],
        ),
        migrations.CreateModel(
            name='Media',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('about', models.CharField(default=b'', max_length=50, verbose_name=b'\xd0\x9e \xd1\x84\xd0\xb0\xd0\xb9\xd0\xbb\xd0\xb5', blank=True)),
                ('media', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd1\x84\xd0\xb0\xd0\xb9\xd0\xbb\xd0\xb0', blank=True)),
                ('video', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xb2\xd0\xb8\xd0\xb4\xd0\xb5\xd0\xbe', blank=True)),
                ('audio', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xb0\xd1\x83\xd0\xb4\xd0\xb8\xd0\xbe', blank=True)),
                ('image', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xba\xd0\xb0\xd1\x80\xd1\x82\xd0\xb8\xd0\xbd\xd0\xba\xd0\xb8', blank=True)),
                ('style', models.TextField(default=b'', max_length=999999, verbose_name=b'\xd0\xa2\xd0\xb5\xd0\xba\xd1\x81\xd1\x82', blank=True)),
                ('user_post', models.ForeignKey(default=b'', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Post',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('title', models.CharField(default=b'', max_length=50, verbose_name=b'\xd0\x97\xd0\xb0\xd0\xb3\xd0\xb0\xd0\xbb\xd0\xbe\xd0\xb2\xd0\xbe\xd0\xba', blank=True)),
                ('video', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xb2\xd0\xb8\xd0\xb4\xd0\xb5\xd0\xbe', blank=True)),
                ('audio', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xb0\xd1\x83\xd0\xb4\xd0\xb8\xd0\xbe', blank=True)),
                ('image', models.TextField(default=b'', max_length=200, verbose_name=b'\xd0\x9d\xd0\xb0\xd0\xb7\xd0\xb2\xd0\xb0\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xba\xd0\xb0\xd1\x80\xd1\x82\xd0\xb8\xd0\xbd\xd0\xba\xd0\xb8', blank=True)),
                ('body', models.TextField(default=b'', max_length=999999, verbose_name=b'\xd0\xa2\xd0\xb5\xd0\xba\xd1\x81\xd1\x82', blank=True)),
                ('date_post', models.DateTimeField(auto_now_add=True, verbose_name=b'\xd0\x94\xd0\xb0\xd1\x82\xd0\xb0 \xd1\x81\xd0\xbe\xd0\xb7\xd0\xb4\xd0\xb0\xd0\xbd\xd0\xb8\xd1\x8f')),
                ('slug', models.SlugField(blank=True)),
                ('point_likes', models.IntegerField(default=0)),
                ('likes', models.ManyToManyField(related_name='likes', to=settings.AUTH_USER_MODEL, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Relike',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('status', models.IntegerField(choices=[(1, b'Following'), (2, b'Blocked')])),
                ('from_post', models.ForeignKey(related_name='from_post_lk', to='myapp.Post')),
                ('to_pers', models.ForeignKey(related_name='people_lk', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='post',
            name='relike',
            field=models.ManyToManyField(related_name='userlk', through='myapp.Relike', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='post',
            name='user_post',
            field=models.ForeignKey(related_name='us_post', default=b'', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='community',
            name='community_media',
            field=models.ManyToManyField(related_name='community_media', to='myapp.Media', blank=True),
        ),
        migrations.AddField(
            model_name='community',
            name='community_post',
            field=models.ManyToManyField(related_name='community_post', to='myapp.Post', blank=True),
        ),
        migrations.AddField(
            model_name='community',
            name='user_community',
            field=models.ForeignKey(default=b'', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='community',
            name='users_community',
            field=models.ManyToManyField(related_name='users_community', to=settings.AUTH_USER_MODEL, blank=True),
        ),
        migrations.AddField(
            model_name='comment',
            name='post_id',
            field=models.ForeignKey(default=b'', to='myapp.Post'),
        ),
    ]

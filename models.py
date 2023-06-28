# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('MyappUser', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class MyappComment(models.Model):
    id = models.BigAutoField(primary_key=True)
    post_id = models.ForeignKey('MyappPost', models.DO_NOTHING)
    comment_user = models.ForeignKey('MyappUser', models.DO_NOTHING)
    comment_text = models.TextField()
    comment_image = models.TextField()
    timecomment = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'myapp_comment'


class MyappMedia(models.Model):
    id = models.BigAutoField(primary_key=True)
    about = models.CharField(max_length=1000)
    media = models.TextField()
    path_data = models.TextField()
    user_post = models.ForeignKey('MyappUser', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'myapp_media'


class MyappMediaAttachment(models.Model):
    id = models.BigAutoField(primary_key=True)
    media = models.ForeignKey(MyappMedia, models.DO_NOTHING)
    post = models.ForeignKey('MyappPost', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'myapp_media_attachment'
        unique_together = (('media', 'post'),)


class MyappPost(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=50)
    video = models.TextField()
    image = models.TextField()
    path_data = models.TextField()
    body = models.TextField()
    date_post = models.DateTimeField()
    user_post = models.ForeignKey('MyappUser', models.DO_NOTHING)
    slug = models.CharField(max_length=50)
    point_likes = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'myapp_post'


class MyappPostLikes(models.Model):
    id = models.BigAutoField(primary_key=True)
    post = models.ForeignKey(MyappPost, models.DO_NOTHING)
    user = models.ForeignKey('MyappUser', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'myapp_post_likes'
        unique_together = (('post', 'user'),)


class MyappRelationship(models.Model):
    id = models.BigAutoField(primary_key=True)
    from_person = models.ForeignKey('MyappUser', models.DO_NOTHING)
    to_person = models.ForeignKey('MyappUser', models.DO_NOTHING)
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'myapp_relationship'


class MyappRelike(models.Model):
    id = models.BigAutoField(primary_key=True)
    from_post = models.ForeignKey(MyappPost, models.DO_NOTHING)
    to_pers = models.ForeignKey('MyappUser', models.DO_NOTHING)
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'myapp_relike'


class MyappUser(models.Model):
    id = models.BigAutoField(primary_key=True)
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()
    image_user = models.TextField()
    path_data = models.TextField()

    class Meta:
        managed = False
        db_table = 'myapp_user'


class MyappUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(MyappUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'myapp_user_groups'
        unique_together = (('user', 'group'),)


class MyappUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(MyappUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'myapp_user_user_permissions'
        unique_together = (('user', 'permission'),)


class PrivatemessagesMessage(models.Model):
    id = models.BigAutoField(primary_key=True)
    text = models.TextField()
    resend = models.TextField()
    sender = models.ForeignKey(MyappUser, models.DO_NOTHING)
    thread = models.ForeignKey('PrivatemessagesThread', models.DO_NOTHING)
    datetime = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'privatemessages_message'


class PrivatemessagesThread(models.Model):
    id = models.BigAutoField(primary_key=True)
    last_message = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'privatemessages_thread'


class PrivatemessagesThreadParticipants(models.Model):
    id = models.BigAutoField(primary_key=True)
    thread = models.ForeignKey(PrivatemessagesThread, models.DO_NOTHING)
    user = models.ForeignKey(MyappUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'privatemessages_thread_participants'
        unique_together = (('thread', 'user'),)

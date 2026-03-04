from rest_framework import serializers
from myapp.models import User, Post, Comment, Relationship, Relike, Keystroke
from privatemessages.models import Thread, Message
from django.contrib.auth import get_user_model
from django.core.cache import cache
from datetime import datetime, timedelta
from django.conf import settings

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    online = serializers.SerializerMethodField()
    total_friends = serializers.IntegerField(read_only=True)
    total_likes = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'avatar_url', 'online', 'color', 
                  'total_friends', 'total_likes', 'date_joined')
        read_only_fields = ('id', 'date_joined')

    def get_avatar_url(self, obj):
        if obj.image_user and obj.image_user != "oneProf.png":
            return f"/media/data_image/{obj.path_data}/tm_{obj.image_user}"
        return "/static/images/oneProf.png"

    def get_online(self, obj):
        return obj.online  # используем property из модели


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True, source='user_post')
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comment_set.count', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('id', 'date_post', 'slug', 'point_likes', 'likes', 'relike')

    def get_image_url(self, obj):
        if obj.image:
            return f"/media/data_image/{obj.path_data}/{obj.image}"
        return None

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True, source='comment_user')
    post = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(),
        write_only=True,
        source='post_id'  # связываем с полем модели post_id
    )
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'author', 'post', 'comment_text', 'comment_image', 'timecomment', 'image_url')
        read_only_fields = ('id', 'timecomment', 'author')

    def get_image_url(self, obj):
        if obj.comment_image and obj.comment_user:
            # Формируем путь как в оригинале: /media/data_image/{{user.path_data}}/{{comment_image}}.png
            return f"/media/data_image/{obj.comment_user.path_data}/{obj.comment_image}.png"
        return None


class RelationshipSerializer(serializers.ModelSerializer):
    from_person = UserSerializer(read_only=True)
    to_person = UserSerializer(read_only=True)

    class Meta:
        model = Relationship
        fields = '__all__'


class RelikeSerializer(serializers.ModelSerializer):
    from_post = serializers.PrimaryKeyRelatedField(read_only=True)
    to_pers = UserSerializer(read_only=True)

    class Meta:
        model = Relike
        fields = '__all__'


class KeystrokeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True, source='user_post_key')

    class Meta:
        model = Keystroke
        fields = '__all__'

class ThreadSerializer(serializers.ModelSerializer):
    partner = serializers.SerializerMethodField()
    last_message_time = serializers.DateTimeField(source='last_message')
    total_messages = serializers.IntegerField(read_only=True)  # будет заполнено из Redis в view

    class Meta:
        model = Thread
        fields = ('id', 'participants', 'partner', 'last_message_time', 'total_messages')
        read_only_fields = ('id', 'last_message_time')

    def get_partner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            partner = obj.participants.exclude(id=request.user.id).first()
            if partner:
                # используем уже существующий UserSerializer
                from .serializers import UserSerializer
                return UserSerializer(partner, context=self.context).data
        return None


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    thread = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('id', 'datetime')

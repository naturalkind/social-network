from rest_framework import serializers
from myapp.models import User, Post, Comment, Relationship, Relike, Keystroke
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
    post = serializers.PrimaryKeyRelatedField(read_only=True, source='post_id')
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('id', 'timecomment')

    def get_image_url(self, obj):
        if obj.comment_image:
            return f"/media/data_image/{obj.comment_image}"  # путь нужно уточнить
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

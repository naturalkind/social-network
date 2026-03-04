import os
import uuid

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from myapp.models import User, Post, Comment, Relationship, Relike, Keystroke
from privatemessages.models import Thread, Message
from django.contrib.auth import get_user_model
from django.core.cache import cache
from PIL import Image
from datetime import datetime, timedelta
from django.conf import settings

User = get_user_model()

# Вспомогательная функция для обрезки изображения (можно вынести в отдельный модуль)
def crop_image(path, nameFile, size=(150, 150)):
    """
    Создаёт квадратную миниатюру изображения.
    
    Аргументы:
        path (str): поддиректория внутри MEDIA_ROOT/data_image/
        nameFile (str): имя оригинального файла (например, "abc123_user.png")
        size (tuple): целевой размер (ширина, высота), по умолчанию (150, 150)
    
    Результат:
        В той же папке создаётся файл с именем "tm_{nameFile}" (миниатюра).
        Если оригинал не найден или произошла ошибка, функция ничего не делает
        (исключение логируется, но не прерывает выполнение).
    """
    # Определяем фильтр ресемплинга для совместимости с разными версиями Pillow
    try:
        resample_filter = Image.Resampling.LANCZOS
    except AttributeError:
        resample_filter = Image.ANTIALIAS

    original_path = os.path.join(settings.MEDIA_ROOT, 'data_image', path, nameFile)
    thumbnail_path = os.path.join(settings.MEDIA_ROOT, 'data_image', path, f"tm_{nameFile}")

    if not os.path.exists(original_path):
        # Можно добавить логирование предупреждения
        return

    try:
        with Image.open(original_path) as img:
            # Конвертируем в RGB для JPEG-совместимости, сохраняя прозрачность через белый фон
            if img.mode in ('RGBA', 'LA', 'P'):
                # Создаём белое полотно
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                # Вставляем изображение с учётом альфа-канала
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Обрезаем до квадрата по центру
            width, height = img.size
            new_side = min(width, height)
            left = (width - new_side) // 2
            top = (height - new_side) // 2
            right = left + new_side
            bottom = top + new_side

            img_cropped = img.crop((left, top, right, bottom))
            img_resized = img_cropped.resize(size, resample_filter)

            # Сохраняем как PNG (оптимизированный)
            img_resized.save(thumbnail_path, 'PNG', optimize=True)

    except Exception as e:
        # В реальном проекте здесь следует использовать логирование
        print(f"Ошибка при создании миниатюры: {e}")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'image')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        image = validated_data.pop('image', None)

        # Создаем пользователя
        user = User.objects.create_user(**validated_data)
        # Обработка аватара, если он предоставлен
        if image:
            path = str(uuid.uuid4())[:12]
            nameFile = f"{path}_{user.username}.png"
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'data_image', path)
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, nameFile)

            # Сохраняем оригинал
            with open(file_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

            # Обрезка изображения
            crop_image(path, nameFile, (150, 150))  # раскомментируйте если есть функция

            # Сохраняем путь в модели
            user.image_user = nameFile
            user.path_data = path
            user.save()

        return user

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
        source='post_id'
    )
    comment_image = serializers.ImageField(required=False, allow_null=True, write_only=True)  # <-- изменено
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'author', 'post', 'comment_text', 'comment_image', 'timecomment', 'image_url')
        read_only_fields = ('id', 'timecomment', 'author')

    def get_image_url(self, obj):
        if obj.comment_image and obj.comment_user:
            # Предполагаем, что в поле хранится полное имя файла (с расширением)
            return f"/media/data_image/{obj.comment_user.path_data}/{obj.comment_image}"
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

    def get_last_message(self, obj):
        last_msg = obj.message_set.order_by('-datetime').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None

    def get_total_messages(self, obj):
        return obj.message_set.count()

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'sender', 'thread', 'text', 'pm_image', 'datetime', 'image_url')
        read_only_fields = ('id', 'datetime')

    def get_image_url(self, obj):
        if obj.pm_image and obj.sender:
            return f"/media/data_image/{obj.sender.path_data}/{obj.pm_image}.png"
        return None

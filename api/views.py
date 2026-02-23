import redis
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
import json
import base64
import re
import os
import uuid
from PIL import Image
from privatemessages.models import Thread, Message
from privatemessages.utils import send_message as utils_send_message
from myapp.models import User, Post, Comment, Relationship, Relike, Keystroke
from .serializers import (
    UserSerializer, PostSerializer, CommentSerializer,
    RelationshipSerializer, RelikeSerializer, KeystrokeSerializer,
    ThreadSerializer, MessageSerializer
)
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

User = get_user_model()

# Вспомогательная функция для обрезки изображения (можно вынести в отдельный модуль)
def crop_image(path, nameFile, size=(150,150)):
    # аналогично функции crop из views.py
    pass  # реализация не изменяется

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для просмотра пользователей.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        user = self.get_object()
        followers = user.get_followers()
        page = self.paginate_queryset(followers)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        user = self.get_object()
        following = user.get_following()
        page = self.paginate_queryset(following)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(following, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def friends(self, request, pk=None):
        user = self.get_object()
        friends = user.get_friends()
        page = self.paginate_queryset(friends)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(friends, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        user_to_follow = self.get_object()
        request.user.add_relationship(user_to_follow, 1)  # RELATIONSHIP_FOLLOWING
        return Response({'status': 'followed'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unfollow(self, request, pk=None):
        user_to_unfollow = self.get_object()
        request.user.remove_relationship(user_to_unfollow, 1)
        return Response({'status': 'unfollowed'})


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-date_post')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user_post=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        if post.likes.filter(id=request.user.id).exists():
            post.likes.remove(request.user)
            liked = False
        else:
            post.likes.add(request.user)
            liked = True
        return Response({'liked': liked, 'likes_count': post.likes.count()})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def repost(self, request, pk=None):
        post = self.get_object()
        # репост через Relike
        if post.relike.filter(id=request.user.id).exists():
            post.remove_rela(request.user, 1)
            reposted = False
        else:
            post.add_rela(request.user, 1)
            reposted = True
        return Response({'reposted': reposted})

    @action(detail=True, methods=['get'])
    def likes_list(self, request, pk=None):
        post = self.get_object()
        likes = post.likes.all()
        page = self.paginate_queryset(likes)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = UserSerializer(likes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        post = self.get_object()
        comments = post.comment_set.all().order_by('-timecomment')
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = CommentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-timecomment')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(comment_user=self.request.user)


# Кастомные вьюхи для специфических операций (например, загрузка изображений)
class ProfileUpdateView(generics.UpdateAPIView):
    """
    Обновление профиля (аватар, цвет).
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        data = request.data
        image_data = data.get('my_image')
        color = data.get('color')

        if image_data and image_data != "undefined":
            # Обработка base64 изображения
            imgstr = re.search(r'base64,(.*)', image_data).group(1)
            nameFile = f"{str(uuid.uuid4())[:12]}_{user.username}.png"
            path = user.path_data
            if not path:
                path = str(user.id)[:12]
                os.makedirs(f"media/data_image/{path}", exist_ok=True)
                user.path_data = path

            with open(f"media/data_image/{path}/{nameFile}", 'wb') as f:
                f.write(base64.b64decode(imgstr))
            crop_image(path, nameFile)  # ваша функция кропа
            user.image_user = nameFile

        if color:
            user.color = color

        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)


# Вьюха для получения лайкнутых постов пользователя
class UserLikedPostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        return Post.objects.filter(likes__id=user_id).order_by('-date_post')


class ThreadViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для работы с чатами текущего пользователя.
    """
    serializer_class = ThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Только чаты, где участвует текущий пользователь
        return Thread.objects.filter(participants=self.request.user).order_by('-last_message')

    def retrieve(self, request, *args, **kwargs):
        """Переопределяем retrieve, чтобы добавить счётчики сообщений из Redis."""
        thread = self.get_object()
        serializer = self.get_serializer(thread)

        # Получаем данные из Redis
        r = redis.StrictRedis()
        user_id = str(request.user.id)
        thread_id = str(thread.id)
        messages_total = r.hget(f"private_{thread_id}_messages", "total_messages")
        messages_sent = r.hget(f"private_{thread_id}_messages", f"from_{user_id}")

        total = int(messages_total) if messages_total else 0
        sent = int(messages_sent) if messages_sent else 0
        received = total - sent

        data = serializer.data
        data.update({
            'messages_total': total,
            'messages_sent': sent,
            'messages_received': received,
        })
        return Response(data)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """
        Возвращает список сообщений в чате (с пагинацией).
        """
        thread = self.get_object()
        messages_qs = thread.message_set.order_by('-datetime')
        page = self.paginate_queryset(messages_qs)
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(messages_qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """
        Отправляет сообщение в указанный чат.
        Ожидает JSON: {"message": "текст сообщения"}
        """
        thread = self.get_object()
        message_text = request.data.get('message')
        if not message_text:
            return Response({'error': 'Message text required'}, status=status.HTTP_400_BAD_REQUEST)

        # Определяем собеседника (для уведомлений)
        partner = thread.participants.exclude(id=request.user.id).first()
        if not partner:
            return Response({'error': 'No partner in thread'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            utils_send_message(
                thread_id=thread.id,
                sender=request.user,
                message_text=message_text,
                partner=partner.id,
                sender_name=request.user.username,
                resend="False"   # можно расширить, если нужно пересылать посты
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'status': 'message sent'}, status=status.HTTP_201_CREATED)


# Вьюха для поиска пользователей (Redis Search) – пример
from myapp.ormsearch import UserDocument
# Но можно оставить как есть, через WebSocket

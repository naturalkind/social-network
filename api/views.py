import redis
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
import json
import base64
import re
import os
import uuid
from privatemessages.models import Thread, Message
from privatemessages.utils import send_message as utils_send_message
from myapp.models import User, Post, Comment, Relationship, Relike, Keystroke
from .serializers import (
    UserSerializer, PostSerializer, CommentSerializer,
    RelationshipSerializer, RelikeSerializer, KeystrokeSerializer,
    ThreadSerializer, MessageSerializer, RegisterSerializer
)
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

User = get_user_model()

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

    def get_queryset(self):
        queryset = super().get_queryset()
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(user_post_id=author_id)
        return queryset
        
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
    queryset = Comment.objects.all()  # Добавьте эту строку
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()  # Используем базовый queryset
        post_id = self.request.query_params.get('post')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        return queryset.order_by('-timecomment')  # добавим сортировку

    def perform_create(self, serializer):
        serializer.save(comment_user=self.request.user)

# Кастомные вьюхи для специфических операций (например, загрузка изображений)
class ProfileUpdateView(generics.RetrieveUpdateAPIView):  # ← Изменено здесь
    """
    Получение и обновление профиля текущего пользователя.
    GET — получить данные, PUT/PATCH — обновить.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user  # Всегда возвращаем текущего пользователя


# Вьюха для получения лайкнутых постов пользователя
class UserLikedPostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        return Post.objects.filter(likes__id=user_id).order_by('-date_post')


class ThreadViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с чатами текущего пользователя.
    """
    serializer_class = ThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        r = redis.StrictRedis()
        user_id = str(request.user.id)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
            for item in data:
                thread_id = item['id']
                total = r.hget(f"private_{thread_id}_messages", "total_messages")
                sent = r.hget(f"private_{thread_id}_messages", f"from_{user_id}")
                item['total_messages'] = int(total) if total else 0
                # также можно добавить messages_sent, messages_received при необходимости
            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        for item in data:
            thread_id = item['id']
            total = r.hget(f"private_{thread_id}_messages", "total_messages")
            sent = r.hget(f"private_{thread_id}_messages", f"from_{user_id}")
            item['total_messages'] = int(total) if total else 0
        return Response(data)
        
    def create(self, request, *args, **kwargs):
        recipient_id = request.data.get('recipient')
        message_text = request.data.get('message')

        if not recipient_id or not message_text:
            return Response(
                {'error': 'Поля recipient и message обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Проверяем, существует ли уже тред между этими двумя пользователями
        thread = Thread.objects.filter(participants=request.user).filter(participants=recipient).first()
        if not thread:
            thread = Thread.objects.create()
            thread.participants.add(request.user, recipient)

        # Отправляем первое сообщение
        try:
            utils_send_message(
                thread_id=thread.id,
                sender=request.user,
                message_text=message_text,
                partner=recipient.id,
                sender_name=request.user.username,
                resend="False"
            )
        except Exception as e:
            return Response(
                {'error': f'Ошибка отправки сообщения: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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

class LogoutView(APIView):
    """
    Выход пользователя из системы.
    """
    permission_classes = [IsAuthenticated]  # Только для авторизованных
    def post(self, request):
        """
        Завершает сессию пользователя.
        """
        try:
            # Очищаем Redis данные для пользователя (если нужно)
            r = redis.StrictRedis()
            user_id = str(request.user.id)
            
            # Опционально: удаляем информацию о пользователе из Redis
            # Например, если храните онлайн-статус или сессии
            r.srem("online_users", user_id)
            
            # Стандартный logout Django
            logout(request)
            
            return Response({
                'success': True,
                'message': 'Вы успешно вышли из системы'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Ошибка при выходе: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = []  # разрешаем всем

    @method_decorator(ensure_csrf_cookie)
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({'success': True})
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]  # доступно всем

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response({
            "user": UserSerializer(user).data,  # если есть UserSerializer
            "message": "Пользователь успешно создан."
        }, status=status.HTTP_201_CREATED)

# Вьюха для поиска пользователей (Redis Search) – пример
from myapp.ormsearch import UserDocument
# Но можно оставить как есть, через WebSocket

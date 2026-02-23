from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, PostViewSet, CommentViewSet,
    ProfileUpdateView, UserLikedPostsView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('users/<uuid:user_id>/liked-posts/', UserLikedPostsView.as_view(), name='user-liked-posts'),
    # можно добавить другие кастомные эндпоинты
]

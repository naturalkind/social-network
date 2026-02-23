from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from .views import (
    UserViewSet, PostViewSet, CommentViewSet,
    ProfileUpdateView, UserLikedPostsView,
    ThreadViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'threads', ThreadViewSet, basename='thread')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('users/<uuid:user_id>/liked-posts/', UserLikedPostsView.as_view(), name='user-liked-posts'),
    # OpenAPI схема
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI (удобная документация с возможностью тестировать запросы)
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # ReDoc (альтернативная документация)
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # можно добавить другие кастомные эндпоинты
]

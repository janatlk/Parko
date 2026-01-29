from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    UserViewSet,
    DemoStartView,
    DemoCleanupView,
)


router = DefaultRouter()
router.register('users', UserViewSet, basename='users')


urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    # Demo session endpoints
    path('auth/demo/start/', DemoStartView.as_view(), name='demo-start'),
    path('auth/demo/cleanup/', DemoCleanupView.as_view(), name='demo-cleanup'),
]

urlpatterns += router.urls


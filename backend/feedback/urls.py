from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import FeedbackViewSet

router = DefaultRouter()
router.register('feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('', include(router.urls)),
]

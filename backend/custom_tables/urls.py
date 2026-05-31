from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CustomTableViewSet, CustomRecordViewSet

router = DefaultRouter()
router.register(r'tables', CustomTableViewSet, basename='custom-table')
router.register(r'records', CustomRecordViewSet, basename='custom-record')

urlpatterns = [
    path('', include(router.urls)),
]

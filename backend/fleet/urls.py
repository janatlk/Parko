from rest_framework.routers import DefaultRouter

from django.urls import path

from .views import CarViewSet
from .views import CarPhotoDeleteView, CarPhotoListCreateView
from .views import CarSpareListCreateView, SpareViewSet
from .views import CarTiresListCreateView, TiresViewSet
from .views import AccumulatorViewSet, CarAccumulatorListCreateView
from .views import FuelViewSet
from .views import InsuranceViewSet, InspectionViewSet


router = DefaultRouter()
router.register('cars', CarViewSet, basename='cars')
router.register('spares', SpareViewSet, basename='spares')
router.register('tires', TiresViewSet, basename='tires')
router.register('accumulators', AccumulatorViewSet, basename='accumulators')
router.register('fuel', FuelViewSet, basename='fuel')
router.register('insurances', InsuranceViewSet, basename='insurances')
router.register('inspections', InspectionViewSet, basename='inspections')

urlpatterns = [
    path('cars/<int:car_id>/photos/', CarPhotoListCreateView.as_view(), name='car-photos'),
    path('cars/<int:car_id>/spares/', CarSpareListCreateView.as_view(), name='car-spares'),
    path('cars/<int:car_id>/tires/', CarTiresListCreateView.as_view(), name='car-tires'),
    path('cars/<int:car_id>/accumulators/', CarAccumulatorListCreateView.as_view(), name='car-accumulators'),
    path('cars/photos/<int:photo_id>/', CarPhotoDeleteView.as_view(), name='car-photo-delete'),
]

urlpatterns += router.urls

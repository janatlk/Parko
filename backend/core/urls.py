from django.urls import path

from .views import CarBrandsView, FuelTypesView, RegionsView, VehicleTypesView


urlpatterns = [
    path('dictionaries/regions/', RegionsView.as_view(), name='dict-regions'),
    path('dictionaries/fuel-types/', FuelTypesView.as_view(), name='dict-fuel-types'),
    path('dictionaries/vehicle-types/', VehicleTypesView.as_view(), name='dict-vehicle-types'),
    path('dictionaries/car-brands/', CarBrandsView.as_view(), name='dict-car-brands'),
]

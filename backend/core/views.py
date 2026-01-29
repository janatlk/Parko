from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Create your views here.

from .dictionaries import CAR_BRANDS, FUEL_TYPES, REGIONS, VEHICLE_TYPES, to_choices


class RegionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(to_choices(REGIONS))


class FuelTypesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(to_choices(FUEL_TYPES))


class VehicleTypesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(to_choices(VEHICLE_TYPES))


class CarBrandsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(to_choices(CAR_BRANDS))

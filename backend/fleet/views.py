from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsCompanyAdminOrDispatcher, IsCompanyMember
from core.viewsets import CompanyScopedModelViewSet

from rest_framework.exceptions import ValidationError

from .models import Accumulator, Car, CarPhoto, Fuel, Insurance, Inspection, Spare, Tires
from .serializers import (
    AccumulatorCreateUpdateSerializer,
    AccumulatorDetailSerializer,
    AccumulatorListSerializer,
    CarCreateUpdateSerializer,
    CarDetailSerializer,
    CarListSerializer,
    CarPhotoSerializer,
    FuelCreateUpdateSerializer,
    FuelDetailSerializer,
    FuelListSerializer,
    InsuranceCreateUpdateSerializer,
    InsuranceDetailSerializer,
    InsuranceListSerializer,
    InspectionCreateUpdateSerializer,
    InspectionDetailSerializer,
    InspectionListSerializer,
    SpareCreateUpdateSerializer,
    SpareDetailSerializer,
    SpareListSerializer,
    TiresCreateUpdateSerializer,
    TiresDetailSerializer,
    TiresListSerializer,
)


class CarViewSet(CompanyScopedModelViewSet):
    queryset = Car.objects.select_related('company').all()
    filterset_fields = ['region', 'type', 'brand', 'numplate', 'status']
    search_fields = ['numplate', 'vin', 'driver', 'title', 'drivers_phone', 'fuel_card']
    ordering_fields = ['id', 'numplate', 'brand', 'status', 'commissioned_at', 'created_at']
    ordering = ['-id']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsCompanyMember()]
        return [IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CarListSerializer
        if self.action == 'retrieve':
            return CarDetailSerializer
        return CarCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class CarPhotoListCreateView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, car_id: int):
        IsCompanyMember().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        qs = CarPhoto.objects.filter(car=car).order_by('-uploaded_at')
        return Response(CarPhotoSerializer(qs, many=True).data)

    def post(self, request, car_id: int):
        IsCompanyAdminOrDispatcher().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        serializer = CarPhotoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(car=car)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CarPhotoDeleteView(APIView):
    def delete(self, request, photo_id: int):
        IsCompanyAdminOrDispatcher().has_permission(request, self) or self.permission_denied(request)
        photo = get_object_or_404(CarPhoto, pk=photo_id, car__company_id=request.user.company_id)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SpareViewSet(CompanyScopedModelViewSet):
    queryset = Spare.objects.select_related('car', 'car__company').all()
    filterset_fields = {
        'car': ['exact'],
        'installed_at': ['exact', 'gte', 'lte'],
    }
    search_fields = ['title', 'description', 'job_description']
    ordering_fields = ['id', 'installed_at', 'created_at']
    ordering = ['-installed_at', '-id']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsCompanyMember()]
        return [IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return SpareListSerializer
        if self.action == 'retrieve':
            return SpareDetailSerializer
        return SpareCreateUpdateSerializer

    def perform_create(self, serializer):
        car = serializer.validated_data.get('car')
        if car is None:
            raise ValidationError({'car': 'This field is required'})
        if car.company_id != self.request.user.company_id:
            raise ValidationError({'car': 'Car does not belong to your company'})
        serializer.save()

    def perform_update(self, serializer):
        if 'car' in serializer.validated_data and serializer.validated_data['car'] != self.get_object().car:
            raise ValidationError({'car': 'Changing car is not allowed'})
        serializer.save()


class InsuranceViewSet(CompanyScopedModelViewSet):
    queryset = Insurance.objects.select_related('car', 'car__company').all()
    filterset_fields = {
        'car': ['exact'],
        'insurance_type': ['exact'],
        'start_date': ['exact', 'gte', 'lte'],
        'end_date': ['exact', 'gte', 'lte'],
    }
    search_fields = ['number']
    ordering_fields = ['id', 'start_date', 'end_date', 'cost', 'created_at']
    ordering = ['-end_date', '-id']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsCompanyMember()]
        return [IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return InsuranceListSerializer
        if self.action == 'retrieve':
            return InsuranceDetailSerializer
        return InsuranceCreateUpdateSerializer

    def perform_create(self, serializer):
        car = serializer.validated_data.get('car')
        if car is None:
            raise ValidationError({'car': 'This field is required'})
        if car.company_id != self.request.user.company_id:
            raise ValidationError({'car': 'Car does not belong to your company'})
        serializer.save()

    def perform_update(self, serializer):
        if 'car' in serializer.validated_data and serializer.validated_data['car'] != self.get_object().car:
            raise ValidationError({'car': 'Changing car is not allowed'})
        serializer.save()


class InspectionViewSet(CompanyScopedModelViewSet):
    queryset = Inspection.objects.select_related('car', 'car__company').all()
    filterset_fields = {
        'car': ['exact'],
        'inspected_at': ['exact', 'gte', 'lte'],
    }
    search_fields = ['number']
    ordering_fields = ['id', 'inspected_at', 'cost', 'created_at']
    ordering = ['-inspected_at', '-id']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsCompanyMember()]
        return [IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return InspectionListSerializer
        if self.action == 'retrieve':
            return InspectionDetailSerializer
        return InspectionCreateUpdateSerializer

    def perform_create(self, serializer):
        car = serializer.validated_data.get('car')
        if car is None:
            raise ValidationError({'car': 'This field is required'})
        if car.company_id != self.request.user.company_id:
            raise ValidationError({'car': 'Car does not belong to your company'})
        serializer.save()

    def perform_update(self, serializer):
        if 'car' in serializer.validated_data and serializer.validated_data['car'] != self.get_object().car:
            raise ValidationError({'car': 'Changing car is not allowed'})
        serializer.save()


class FuelViewSet(CompanyScopedModelViewSet):
    queryset = Fuel.objects.select_related('car', 'car__company').all()
    filterset_fields = {
        'car': ['exact'],
        'year': ['exact'],
        'month': ['exact'],
    }
    ordering_fields = ['id', 'year', 'month', 'created_at']
    ordering = ['-year', '-month', '-id']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsCompanyMember()]
        return [IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return FuelListSerializer
        if self.action == 'retrieve':
            return FuelDetailSerializer
        return FuelCreateUpdateSerializer

    def perform_create(self, serializer):
        car = serializer.validated_data.get('car')
        if car is None:
            raise ValidationError({'car': 'This field is required'})
        if car.company_id != self.request.user.company_id:
            raise ValidationError({'car': 'Car does not belong to your company'})
        serializer.save()

    def perform_update(self, serializer):
        if 'car' in serializer.validated_data and serializer.validated_data['car'] != self.get_object().car:
            raise ValidationError({'car': 'Changing car is not allowed'})
        serializer.save()


class CarSpareListCreateView(APIView):
    def get(self, request, car_id: int):
        IsCompanyMember().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        qs = Spare.objects.filter(car=car).order_by('-installed_at', '-id')
        return Response(SpareListSerializer(qs, many=True).data)

    def post(self, request, car_id: int):
        IsCompanyAdminOrDispatcher().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        serializer = SpareCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(car=car)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TiresViewSet(CompanyScopedModelViewSet):
    queryset = Tires.objects.select_related('car', 'car__company').all()
    filterset_fields = {
        'car': ['exact'],
        'installed_at': ['exact', 'gte', 'lte'],
        'expires_at': ['exact', 'gte', 'lte'],
    }
    search_fields = ['model', 'size']
    ordering_fields = ['id', 'installed_at', 'expires_at', 'created_at']
    ordering = ['-installed_at', '-id']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsCompanyMember()]
        return [IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return TiresListSerializer
        if self.action == 'retrieve':
            return TiresDetailSerializer
        return TiresCreateUpdateSerializer

    def perform_create(self, serializer):
        car = serializer.validated_data.get('car')
        if car is None:
            raise ValidationError({'car': 'This field is required'})
        if car.company_id != self.request.user.company_id:
            raise ValidationError({'car': 'Car does not belong to your company'})
        serializer.save()

    def perform_update(self, serializer):
        if 'car' in serializer.validated_data and serializer.validated_data['car'] != self.get_object().car:
            raise ValidationError({'car': 'Changing car is not allowed'})
        serializer.save()


class CarTiresListCreateView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, car_id: int):
        IsCompanyMember().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        qs = Tires.objects.filter(car=car).order_by('-installed_at', '-id')
        return Response(TiresListSerializer(qs, many=True).data)

    def post(self, request, car_id: int):
        IsCompanyAdminOrDispatcher().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        serializer = TiresCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(car=car)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AccumulatorViewSet(CompanyScopedModelViewSet):
    queryset = Accumulator.objects.select_related('car', 'car__company').all()
    filterset_fields = {
        'car': ['exact'],
        'installed_at': ['exact', 'gte', 'lte'],
        'expires_at': ['exact', 'gte', 'lte'],
    }
    search_fields = ['model', 'serial_number', 'capacity']
    ordering_fields = ['id', 'installed_at', 'expires_at', 'created_at']
    ordering = ['-installed_at', '-id']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsCompanyMember()]
        return [IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return AccumulatorListSerializer
        if self.action == 'retrieve':
            return AccumulatorDetailSerializer
        return AccumulatorCreateUpdateSerializer

    def perform_create(self, serializer):
        car = serializer.validated_data.get('car')
        if car is None:
            raise ValidationError({'car': 'This field is required'})
        if car.company_id != self.request.user.company_id:
            raise ValidationError({'car': 'Car does not belong to your company'})
        serializer.save()

    def perform_update(self, serializer):
        if 'car' in serializer.validated_data and serializer.validated_data['car'] != self.get_object().car:
            raise ValidationError({'car': 'Changing car is not allowed'})
        serializer.save()


class CarAccumulatorListCreateView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, car_id: int):
        IsCompanyMember().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        qs = Accumulator.objects.filter(car=car).order_by('-installed_at', '-id')
        return Response(AccumulatorListSerializer(qs, many=True).data)

    def post(self, request, car_id: int):
        IsCompanyAdminOrDispatcher().has_permission(request, self) or self.permission_denied(request)
        car = get_object_or_404(Car, pk=car_id, company_id=request.user.company_id)
        serializer = AccumulatorCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(car=car)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

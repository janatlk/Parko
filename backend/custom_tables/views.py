from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsCompanyMember, IsCompanyAdminOrDispatcher
from core.viewsets import CompanyScopedModelViewSet

from .models import CustomTable, CustomRecord
from .serializers import (
    CustomTableListSerializer,
    CustomTableDetailSerializer,
    CustomTableCreateUpdateSerializer,
    CustomRecordListSerializer,
    CustomRecordDetailSerializer,
    CustomRecordCreateUpdateSerializer,
)


class CustomTableViewSet(CompanyScopedModelViewSet):
    """
    CRUD для пользовательских таблиц.
    GET — все пользователи компании
    POST/PUT/PATCH/DELETE — админ или диспетчер
    """
    queryset = CustomTable.objects.annotate(record_count=Count('records'))
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-updated_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated(), IsCompanyMember()]
        return [IsAuthenticated(), IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomTableListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return CustomTableCreateUpdateSerializer
        return CustomTableDetailSerializer

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class CustomRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD для записей в пользовательских таблицах.
    Фильтрация по company через table__company.
    """
    queryset = CustomRecord.objects.select_related('table', 'car')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['table']
    search_fields = ['data']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated(), IsCompanyMember()]
        return [IsAuthenticated(), IsCompanyAdminOrDispatcher()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomRecordListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return CustomRecordCreateUpdateSerializer
        return CustomRecordDetailSerializer

    def get_queryset(self):
        user = self.request.user
        return CustomRecord.objects.filter(
            table__company_id=user.company_id
        ).select_related('table', 'car')

    def perform_create(self, serializer):
        # Validate that table belongs to user's company
        table_id = self.request.data.get('table')
        if table_id:
            from django.shortcuts import get_object_or_404
            table = get_object_or_404(CustomTable, id=table_id, company=self.request.user.company)
            serializer.save(table=table)
        else:
            serializer.save()

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .mixins import CompanyFilterMixin


class BulkDeleteMixin:
    """Миксин для массового удаления объектов через POST /bulk-delete/."""

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'status': 'error', 'message': 'No IDs provided'},
                status=400,
            )
        queryset = self.get_queryset().filter(id__in=ids)
        deleted_count, _ = queryset.delete()
        return Response({
            'status': 'success',
            'deleted': deleted_count,
        })


class CompanyScopedModelViewSet(BulkDeleteMixin, CompanyFilterMixin, viewsets.ModelViewSet):
    """Базовый ModelViewSet с автоматической фильтрацией queryset по company текущего пользователя."""

    pass

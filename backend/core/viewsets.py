from rest_framework import viewsets

from .mixins import CompanyFilterMixin


class CompanyScopedModelViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    """Базовый ModelViewSet с автоматической фильтрацией queryset по company текущего пользователя."""

    pass

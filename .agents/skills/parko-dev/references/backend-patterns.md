# Backend Patterns

## Multi-Tenant Model

Every model that stores company data MUST include a `company` FK and timestamps:

```python
from django.db import models

class NewEntity(models.Model):
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='new_entities',
    )
    # ... entity fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'created_at']),
        ]
```

## Serializer

```python
from rest_framework import serializers

class NewEntityListSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewEntity
        fields = ['id', 'company', 'field1', 'field2', 'created_at']

class NewEntityDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewEntity
        fields = '__all__'

class NewEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewEntity
        fields = '__all__'
        read_only_fields = ['company']
```

## ViewSet

```python
from core.viewsets import CompanyScopedModelViewSet

class NewEntityViewSet(CompanyScopedModelViewSet):
    queryset = NewEntity.objects.select_related('company').all()
    serializer_class = NewEntitySerializer
    filterset_fields = ['field1', 'field2']
    search_fields = ['field1', 'field2']
    ordering_fields = ['created_at', 'field1']
```

`CompanyScopedModelViewSet` automatically filters the queryset by the current user's
`company_id` via `CompanyFilterMixin`.

## URL Registration

```python
from rest_framework.routers import DefaultRouter
from .views import NewEntityViewSet

router = DefaultRouter()
router.register('new-entities', NewEntityViewSet, basename='newentity')
```

## Admin Registration

```python
from django.contrib import admin
from .models import NewEntity

@admin.register(NewEntity)
class NewEntityAdmin(admin.ModelAdmin):
    list_display = ['id', 'company', 'field1', 'created_at']
    list_filter = ['company']
    search_fields = ['field1']
```

## StandardJSONRenderer Envelope

All API responses are wrapped automatically:

```json
{
  "status": "success",
  "data": { ... },
  "message": "...",
  "errors": { ... }
}
```

The frontend `http` axios instance intercepts responses and returns `record.data` directly.

## Rules Checklist

- [ ] `company` ForeignKey present
- [ ] Inherits `CompanyScopedModelViewSet`
- [ ] `select_related` / `prefetch_related` used
- [ ] `filterset_fields`, `search_fields`, `ordering_fields` defined
- [ ] Migration created (`python manage.py makemigrations`)
- [ ] Registered in `admin.py`
- [ ] Follows PEP 8, snake_case, PascalCase for classes

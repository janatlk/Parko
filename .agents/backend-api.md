# Backend API Agent

## Purpose
Automatically create Django REST API endpoints, models, serializers, and views for the Parko fleet management system.

## Trigger
When the user says: "create API for...", "add endpoint...", "new model...", "CRUD for..."

## Workflow

1. **Understand the entity** — what fields, relationships, permissions
2. **Create model** in `backend/fleet/models.py` (or new app)
   - Add company FK for multi-tenant isolation
   - Add proper indexes, Meta ordering
3. **Create serializer** in `backend/fleet/serializers.py`
   - ListSerializer vs DetailSerializer
   - Validation rules
4. **Create view** in `backend/fleet/views.py`
   - Use `CompanyScopedModelViewSet` for CRUD
   - Add filters, search, ordering
   - Permission classes
5. **Add URL** in `backend/fleet/urls.py`
6. **Create migration** — `python manage.py makemigrations`
7. **Register in admin** — `backend/fleet/admin.py`

## Patterns to follow

### Model
```python
class NewEntity(models.Model):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='new_entities')
    # ... fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
```

### ViewSet
```python
class NewEntityViewSet(CompanyScopedModelViewSet):
    queryset = NewEntity.objects.select_related('company').all()
    serializer_class = NewEntitySerializer
    filterset_fields = ['field1', 'field2']
    search_fields = ['field1', 'field2']
    ordering_fields = ['created_at', 'field1']
```

### URL
```python
router.register('new-entities', NewEntityViewSet, basename='newentity')
```

## Rules
- ALWAYS add `company` FK
- ALWAYS use `CompanyScopedModelViewSet` for standard CRUD
- ALWAYS add `select_related` / `prefetch_related` for performance
- ALWAYS add filters, search, ordering
- Run `makemigrations` after model changes
- Follow existing code style (snake_case, Django conventions)

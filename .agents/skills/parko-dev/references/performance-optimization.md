# Performance Optimization

## Backend

### Identify Slow Endpoints
- Check query count per request (Django debug toolbar or logging)
- Use `django.db.connection.queries` in tests

### Eliminate N+1 Queries

```python
# Bad — N+1
cars = Car.objects.all()
for car in cars:
    print(car.driver)  # query per iteration

# Good — single query
cars = Car.objects.select_related('driver').all()
```

### Add Database Indexes

```python
class Meta:
    indexes = [
        models.Index(fields=['company', 'status']),
    ]
```

### Use Annotations/Aggregations

Replace Python loops with DB-level calculations:

```python
from django.db.models import Sum, Avg

Car.objects.annotate(total_fuel=Sum('fuel_records__volume'))
```

### Caching

Use `django.core.cache` with DatabaseCache backend (5–10 min TTL keyed by `company_id`):

```python
from django.core.cache import cache

cache_key = f'dashboard_stats:{company_id}'
data = cache.get(cache_key)
if data is None:
    data = compute_stats()
    cache.set(cache_key, data, 300)
```

### Pagination

Ensure all list endpoints use pagination. Already enabled by default in `core` pagination config.

## Frontend

### Bundle Size
- Check `npm run build` output for chunk sizes
- Use dynamic imports (`React.lazy`) for routes

### React Query Tuning
- Set appropriate `staleTime` and `gcTime`
- Use `placeholderData` for pagination
- Deduplicate requests with consistent `queryKey`

### Virtualization
- Use virtualized lists/tables for >50 items

### Memoization
- `React.memo` for pure components
- `useMemo` for expensive calculations
- `useCallback` for stable function references passed to children

### Image Optimization
- Proper sizes, lazy loading via Mantine `Image`

## Rules

- ALWAYS profile before optimizing (don't guess)
- ALWAYS measure after to confirm improvement
- Prefer DB-level operations over Python loops
- Use `EXPLAIN ANALYZE` for slow SQL queries
- Check Network tab for redundant API calls

# Performance Agent

## Purpose
Optimize performance of the Parko fleet management system — backend queries, frontend rendering, bundle size, caching.

## Trigger
When the user says: "slow...", "optimize...", "performance issue...", "make it faster..."

## Workflow

### Backend Optimization
1. **Identify slow endpoints** — check Django debug toolbar, query count
2. **Add select_related/prefetch_related** — reduce N+1 queries
3. **Add database indexes** — on frequently filtered fields
4. **Use annotations/aggregations** — replace Python loops with DB queries
5. **Add caching** — Redis or per-view cache for expensive queries
6. **Pagination** — ensure large datasets are paginated

```python
# Bad — N+1 queries
cars = Car.objects.all()
for car in cars:
    print(car.driver)  # Separate query per car

# Good — single query
cars = Car.objects.select_related('driver').all()
```

### Frontend Optimization
1. **Check bundle size** — `npx vite build` output, code splitting
2. **React Query** — proper staleTime, cacheTime, deduplication
3. **Virtualization** — for large lists/tables (>50 items)
4. **Memoization** — React.memo, useMemo, useCallback for expensive renders
5. **Lazy loading** — React.lazy for routes/components
6. **Image optimization** — proper sizes, lazy loading

### Rules
- ALWAYS profile before optimizing (don't guess)
- ALWAYS measure after to confirm improvement
- Prefer DB-level operations over Python loops
- Use `EXPLAIN ANALYZE` for slow SQL queries
- Check Network tab for redundant API calls
- Use React DevTools Profiler for slow components

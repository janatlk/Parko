# 🐌 План оптимизации медленной работы базы данных

## 📊 Диагностика проблемы

**Симптомы:**
- Dashboard грузится **10 секунд**
- Cars страница грузится **4 секунды**
- Запросы к API выполняются очень медленно

**Текущая конфигурация:**
- Supabase PostgreSQL (AWS Tokyo region)
- Подключение из Казахстана/Кыргызстана
- Высокая сетевая задержка (RTT ~200-300мс)

---

## 🔍 Причины медленной работы

### 1. **Сетевая задержка (Latency)**
```
Ваша локация → Supabase (AWS Tokyo) = ~250-400мс RTT
```

Каждый SQL-запрос требует минимум 1 RTT. При 10-50 запросах на страницу:
- 10 запросов × 300мс = **3 секунды** только на сеть
- 50 запросов × 300мс = **15 секунд** только на сеть

### 2. **N+1 проблема запросов**
Django ORM может генерировать множество дополнительных запросов:

```python
# ПЛОХО: N+1 запросов
cars = Car.objects.all()
for car in cars:
    print(car.driver)  # Запрос к БД на каждой итерации

# ХОРОШО: 1 запрос
cars = Car.objects.select_related('driver').all()
```

### 3. **Отсутствие индексов**
Без индексов PostgreSQL выполняет **full table scan**:
- Cars: O(n) вместо O(log n)
- Fuel: O(n×m) для JOIN вместо O(log n + log m)

### 4. **Connection Pooler ограничения**
Порт 6543 (PgBouncer) не поддерживает:
- Подготовленные выражения
- Некоторые типы транзакций
- Может добавлять overhead

---

## ✅ План оптимизации

### Этап 1: Кэширование (СРОЧНО, 1-2 часа)

**Проблема:** Dashboard делает 20+ запросов к БД при каждой загрузке.

**Решение:** Кэшировать результаты на 5-15 минут.

#### 1.1 Включить кэширование в Redis

```bash
pip install django-redis
```

```python
# config/settings/dev.py
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "TIMEOUT": 300,  # 5 минут
    }
}
```

#### 1.2 Кэширование Dashboard API

```python
# dashboard/views.py
from django.core.cache import cache

class DashboardStatsView(APIView):
    def get(self, request):
        cache_key = f'dashboard_stats_{request.user.company.id}'
        data = cache.get(cache_key)
        
        if data is None:
            # Выполняем тяжелые запросы
            data = self._calculate_stats()
            cache.set(cache_key, data, 300)  # 5 минут
        
        return Response(data)
```

**Ожидаемый эффект:** 
- Первый запрос: 5-10 секунд
- Повторные запросы: **100-200 мс** (в 50 раз быстрее!)

---

### Этап 2: Оптимизация ORM запросов (2-3 часа)

#### 2.1 Добавить select_related/prefetch_related

```python
# fleet/views.py - CarViewSet
class CarViewSet(CompanyScopedModelViewSet):
    # БЫЛО
    queryset = Car.objects.select_related('company').all()
    
    # СТАЛО (добавить driver если это ForeignKey)
    queryset = Car.objects.select_related(
        'company',
        'driver'  # Если driver это ForeignKey к User
    ).all()
```

```python
# dashboard/views.py
class DashboardActivityFeedView(APIView):
    def get(self, request):
        # БЫЛО
        fuel_entries = Fuel.objects.filter(
            car__company=company
        ).select_related('car')
        
        # СТАЛО
        fuel_entries = Fuel.objects.filter(
            car__company=company
        ).select_related('car__company')  # Добавить company
```

#### 2.2 Использовать only() для уменьшения данных

```python
# БЫЛО: Загружает все поля
cars = Car.objects.filter(company=company)

# СТАЛО: Только нужные поля
cars = Car.objects.filter(
    company=company
).only('id', 'numplate', 'brand', 'status')
```

**Ожидаемый эффект:** Уменьшение трафика в 2-5 раз.

---

### Этап 3: Индексы в базе данных (30 минут)

Создайте миграцию:

```bash
python manage.py makemigrations --empty fleet
```

```python
# fleet/migrations/00XX_add_indexes.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('fleet', '00XX_previous_migration'),
    ]

    operations = [
        # Cars
        migrations.AddIndex(
            model_name='car',
            index=models.Index(fields=['company', 'status']),
        ),
        migrations.AddIndex(
            model_name='car',
            index=models.Index(fields=['company', 'numplate']),
        ),
        
        # Fuel
        migrations.AddIndex(
            model_name='fuel',
            index=models.Index(fields=['car', 'year', 'month']),
        ),
        
        # Insurance
        migrations.AddIndex(
            model_name='insurance',
            index=models.Index(fields=['car', 'end_date']),
        ),
        
        # Inspection
        migrations.AddIndex(
            model_name='inspection',
            index=models.Index(fields=['car', 'inspected_at']),
        ),
    ]
```

Применить:
```bash
python manage.py migrate
```

**Ожидаемый эффект:** Ускорение SELECT в 10-100 раз для фильтрованных запросов.

---

### Этап 4: Оптимизация frontend (1-2 часа)

#### 4.1 React Query кэширование

```typescript
// frontend/src/features/cars/api/useCars.ts
export function useCars(params: ListCarsParams) {
  return useQuery({
    queryKey: ['cars', params],
    queryFn: () => listCars(params),
    staleTime: 5 * 60 * 1000,  // 5 минут
    gcTime: 10 * 60 * 1000,    // 10 минут в кэше
  })
}
```

#### 4.2 Отложенная загрузка (Lazy Loading)

```typescript
// Загружать данные только когда они нужны
const Dashboard = () => {
  const { data: stats, isLoading } = useDashboardStats()
  
  if (isLoading) return <Skeleton />
  return <DashboardContent stats={stats} />
}
```

---

### Этап 5: Альтернативные решения (если не помогло)

#### 5.1 Локальный PostgreSQL для разработки

```bash
# Docker Compose
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
```

```env
# .env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

**Эффект:** Запросы за **10-50 мс** вместо 2-10 секунд

#### 5.2 Деплой backend ближе к Supabase

Разместить Django backend в том же регионе (AWS Tokyo):
- Railway Tokyo
- AWS EC2 ap-northeast-2
- Render Tokyo

**Эффект:** Запросы за **20-50 мс** вместо 300+ мс

---

## 📋 Приоритеты

| Задача | Время | Эффект | Приоритет |
|--------|-------|--------|-----------|
| Кэширование Dashboard | 1 час | 50x быстрее | 🔴 КРИТИЧНО |
| Индексы в БД | 30 мин | 10-100x быстрее | 🔴 КРИТИЧНО |
| select_related | 2 часа | 5-10x быстрее | 🟡 ВАЖНО |
| Frontend кэширование | 1 час | 2-5x быстрее | 🟡 ВАЖНО |
| Локальный PostgreSQL | 30 мин | 100x быстрее | 🟢 ОПЦИОНАЛЬНО |
| Деплой в Tokyo | 2 часа | 10x быстрее | 🟢 ОПЦИОНАЛЬНО |

---

## 🚀 Быстрая оптимизация (15 минут)

Если нужно СРОЧНО улучшить:

### 1. Увеличить timeout и pool size

```python
# config/settings/dev.py
DATABASES = {
    'default': {
        # ...
        'CONN_MAX_AGE': 60,  # 1 минута
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 30,  # 30 секунд
            'socket_timeout': 30,
        },
    }
}
```

### 2. Включить простое кэширование

```python
# config/settings/dev.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'parko-cache',
        'TIMEOUT': 300,
    }
}
```

### 3. Кэшировать Dashboard

```python
# dashboard/views.py
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class DashboardStatsView(APIView):
    @method_decorator(cache_page(60 * 5))  # 5 минут
    def get(self, request):
        # ...
```

---

## ✅ Чеклист

- [ ] Измерить текущее время запросов (Network tab)
- [ ] Включить кэширование (Redis или LocMem)
- [ ] Добавить cache_page на Dashboard endpoints
- [ ] Создать индексы для Cars, Fuel, Insurance
- [ ] Добавить select_related в queryset
- [ ] Настроить React Query кэширование
- [ ] (Опционально) Поднять локальный PostgreSQL

---

**Ожидаемый результат после всех оптимизаций:**
- Dashboard: **200-500 мс** (было 10 сек) → **20-50x быстрее**
- Cars: **100-300 мс** (было 4 сек) → **13-40x быстрее**

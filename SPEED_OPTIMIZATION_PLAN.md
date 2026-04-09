# 🚀 План оптимизации скорости Parko

## 📊 Диагностика текущей ситуации

### Проблема:
- Страницы грузятся **4-10 секунд**
- Каждый запрос к API: **~4 секунды**
- Причина: **Сетевая задержка до Supabase (Tokyo)**

### Текущая архитектура:
```
Кыргызстан/Казахстан → Supabase (AWS Tokyo)
        RTT: ~300-400мс
        Запросов на страницу: 10-20
        Итого: 4-10 секунд
```

---

## 🎯 Варианты решения (по приоритету)

### 🔴 ВАРИАНТ 1: Локальный PostgreSQL для разработки ⭐ РЕКОМЕНДУЕТСЯ

**Время:** 30 минут  
**Эффект:** **100x быстрее** (запросы за 10-50мс)

#### Шаг 1: Установить Docker

Скачать: https://www.docker.com/products/docker-desktop/

#### Шаг 2: Создать docker-compose.yml

```yaml
# backend/docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:16
    container_name: parko-db
    environment:
      POSTGRES_DB: parko
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

#### Шаг 3: Обновить .env

```env
# Локальная база данных
POSTGRES_DB=parko
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

#### Шаг 4: Запустить базу

```bash
cd backend
docker-compose up -d
```

#### Шаг 5: Применить миграции

```bash
python manage.py migrate
python manage.py createsuperuser
```

**Результат:**
- Запросы: **10-50 мс** (было 4000 мс)
- Страницы: **< 1 секунды** (было 4-10 сек)

---

### 🟡 ВАРИАНТ 2: Агрессивное кэширование

**Время:** 1 час  
**Эффект:** **10-50x быстрее** для повторных запросов

#### Шаг 1: Установить Redis

```bash
# Windows - скачать с https://github.com/microsoftarchive/redis/releases
# Или использовать Docker:
docker run -d -p 6379:6379 redis:latest
```

#### Шаг 2: Настроить Django

```bash
pip install django-redis
```

```python
# config/settings/dev.py
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "TIMEOUT": 300,
    }
}
```

#### Шаг 3: Кэшировать все API

```python
# dashboard/views.py
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 5), name='dispatch')
class DashboardStatsView(APIView):
    # ...
```

#### Шаг 4: Кэширование на frontend

```typescript
// frontend/src/features/cars/api/useCars.ts
export function useCars(params: ListCarsParams) {
  return useQuery({
    queryKey: ['cars', params],
    queryFn: () => listCars(params),
    staleTime: 5 * 60 * 1000,  // 5 минут
    gcTime: 30 * 60 * 1000,    // 30 минут
    retries: 1,
  })
}
```

**Результат:**
- Первый запрос: **4 секунды**
- Повторные: **100-200 мс**

---

### 🟢 ВАРИАНТ 3: Деплой backend ближе к Supabase

**Время:** 2-3 часа  
**Эффект:** **5-10x быстрее**

#### Разместить backend в Tokyo (AWS ap-northeast-2):

**Варианты:**
1. **Railway** - Tokyo region
2. **Render** - Tokyo region  
3. **AWS EC2** - ap-northeast-2

#### Пример для Railway:

1. Зарегистрироваться: https://railway.app
2. Создать проект → Deploy from GitHub
3. Указать root directory: `backend`
4. Добавить переменные окружения:

```env
POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
POSTGRES_PORT=5432
POSTGRES_USER=postgres.vulnzaoagtxzpayyjjct
POSTGRES_PASSWORD=NwC1e3oj09s4nrLs
```

**Результат:**
- Запросы: **50-100 мс** (было 400 мс)
- Страницы: **1-2 секунды** (было 4-10 сек)

---

### 🔵 ВАРИАНТ 4: Оптимизация запросов (долгосрочный)

**Время:** 4-6 часов  
**Эффект:** **2-5x быстрее**

#### 4.1 Уменьшить количество запросов

```python
# БЫЛО: N+1 запросов
cars = Car.objects.all()
for car in cars:
    print(car.driver)

# СТАЛО: 1 запрос
cars = Car.objects.select_related('driver').all()
```

#### 4.2 Использовать only() для уменьшения данных

```python
# БЫЛО: Загружает все поля
cars = Car.objects.filter(company=company)

# СТАЛО: Только нужные поля
cars = Car.objects.filter(
    company=company
).only('id', 'numplate', 'brand', 'status')
```

#### 4.3 Объединять запросы

```python
# БЫЛО: 3 запроса
total_cars = Car.objects.filter(company=company).count()
active_cars = Car.objects.filter(company=company, status='ACTIVE').count()
inactive_cars = Car.objects.filter(company=company, status='INACTIVE').count()

# СТАЛО: 1 запрос
from django.db.models import Count, Q
stats = Car.objects.filter(company=company).aggregate(
    total=Count('id'),
    active=Count('id', filter=Q(status='ACTIVE')),
    inactive=Count('id', filter=Q(status='INACTIVE')),
)
```

---

## 📋 Сравнение вариантов

| Вариант | Время | Эффект | Стоимость | Сложность |
|---------|-------|--------|-----------|-----------|
| **Локальный PostgreSQL** | 30 мин | 100x быстрее | Бесплатно | ⭐ Легко |
| **Redis кэширование** | 1 час | 10-50x быстрее | Бесплатно | ⭐⭐ Средне |
| **Деплой в Tokyo** | 2-3 часа | 5-10x быстрее | ~$5-10/мес | ⭐⭐ Средне |
| **Оптимизация запросов** | 4-6 часов | 2-5x быстрее | Бесплатно | ⭐⭐⭐ Сложно |

---

## 🎯 Рекомендации

### Для локальной разработки:

```
✅ Локальный PostgreSQL (Вариант 1)
```

**Почему:**
- Мгновенная скорость (10-50 мс)
- Работает без интернета
- Бесплатно
- Быстрая итерация при разработке

### Для production:

```
✅ Деплой backend в Tokyo (Вариант 3)
✅ + Агрессивное кэширование (Вариант 2)
```

**Почему:**
- Низкая задержка (50-100 мс)
- Кэш снижает нагрузку на БД
- Надёжно и масштабируемо

---

## 🚀 Быстрый старт (прямо сейчас)

### 1. Локальный PostgreSQL за 5 минут:

```bash
# 1. Установить Docker Desktop
# https://www.docker.com/products/docker-desktop/

# 2. Создать файл backend/docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: parko
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

# 3. Запустить
cd backend
docker-compose up -d

# 4. Обновить backend/.env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=parko

# 5. Применить миграции
python manage.py migrate

# 6. Запустить сервер
python manage.py runserver
```

**Результат:** Страницы грузятся за **< 1 секунды** 

---

## 📈 Ожидаемая производительность

| Сценарий | Сейчас | После оптимизации |
|----------|--------|-------------------|
| **Dashboard (первый)** | 10 сек | 200-500 мс |
| **Dashboard (повтор)** | 10 сек | 50-100 мс |
| **Cars** | 4 сек | 20-50 мс |
| **Fuel** | 4 сек | 20-50 мс |
| **API (средний)** | 4000 мс | 10-50 мс |

**Ускорение: в 80-400 раз!**

---

## ✅ Чеклист

- [ ] Установить Docker Desktop
- [ ] Создать docker-compose.yml для PostgreSQL
- [ ] Обновить .env для локальной БД
- [ ] Применить миграции
- [ ] Протестировать скорость
- [ ] (Production) Деплой в Tokyo
- [ ] (Production) Настроить Redis кэширование

---

**Начните с локального PostgreSQL — это займёт 30 минут и ускорит разработку в 100 раз!**

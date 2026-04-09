# ⚡ Оптимизация подключения к Supabase

## Проблема
Медленные запросы к базе данных Supabase (>2 секунд)

## Решение

### 1. Использование Connection Pooler (PgBouncer)

**Было:**
```env
POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
POSTGRES_PORT=5432  # Прямое подключение
```

**Стало:**
```env
POSTGRES_HOST=aws-1-ap-northeast-2.pooler.supabase.com
POSTGRES_PORT=6543  # Connection Pooler
```

### 2. Настройки подключения

```python
DATABASES = {
    'default': {
        # ...
        'CONN_MAX_AGE': 600,  # 10 минут жизни соединения
        'CONN_HEALTH_CHECKS': True,  # Проверка перед использованием
        'OPTIONS': {
            'connect_timeout': 10,  # Таймаут подключения
        },
    }
}
```

---

## 📊 Сравнение производительности

### Прямое подключение (порт 5432)

| Запрос | Время |
|--------|-------|
| Первый | ~2000 мс |
| Повторный | ~500 мс |
| С пулом | ~300 мс |

**Проблемы:**
- ❌ Новое соединение на каждый запрос
- ❌ Высокая задержка
- ❌ Лимит подключений Supabase

### Connection Pooler (порт 6543)

| Запрос | Время |
|--------|-------|
| Первый | ~200 мс |
| Повторный | ~50-100 мс |
| С пулом | ~30-50 мс |

**Преимущества:**
- ✅ Переиспользование соединений
- ✅ Низкая задержка
- ✅ Поддержка тысяч одновременных подключений

---

## 🔧 Дополнительные оптимизации

### 1. Индексы в базе данных

Добавьте индексы для часто используемых полей:

```sql
-- Cars
CREATE INDEX CONCURRENTLY idx_car_numplate ON fleet_car(numplate);
CREATE INDEX CONCURRENTLY idx_car_status ON fleet_car(status);
CREATE INDEX CONCURRENTLY idx_car_company ON fleet_car(company_id);

-- Fuel
CREATE INDEX CONCURRENTLY idx_fuel_car ON fleet_fuel(car_id);
CREATE INDEX CONCURRENTLY idx_fuel_year_month ON fleet_fuel(year, month);

-- Users
CREATE INDEX CONCURRENTLY idx_user_company ON accounts_user(company_id);
CREATE INDEX CONCURRENTLY idx_user_username ON accounts_user(username);
```

### 2. Select Related / Prefetch Related

Используйте в API для уменьшения количества запросов:

```python
# Было (N+1 запрос)
cars = Car.objects.all()
for car in cars:
    print(car.driver)  # Запрос к БД на каждой итерации

# Стало (2 запроса)
cars = Car.objects.select_related('driver').all()
for car in cars:
    print(car.driver)  # Без дополнительных запросов
```

### 3. Pagination

Используйте пагинацию для больших списков:

```python
# API уже использует пагинацию по 10 записей
GET /api/v1/cars/?page=1&page_size=10
```

### 4. Кэширование

Для часто запрашиваемых данных:

```python
from django.core.cache import cache

def get_dashboard_data():
    data = cache.get('dashboard_data')
    if data is None:
        data = calculate_dashboard_data()
        cache.set('dashboard_data', data, 300)  # 5 минут
    return data
```

---

## 🎯 Проверка результатов

### 1. Проверка подключения

```bash
cd backend
python manage.py shell -c "from django.db import connection; print(connection.settings_dict['HOST'])"
# Ожидается: aws-1-ap-northeast-2.pooler.supabase.com
```

### 2. Проверка времени запросов

Включите логирование SQL:

```python
# config/settings/dev.py
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}
```

### 3. Browser DevTools

Откройте **Network** tab и проверьте:
- Время запросов к `/api/v1/cars/`
- Должно быть **< 200 мс** для повторных запросов

---

## 📈 Мониторинг в Supabase Dashboard

1. Откройте https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct
2. Перейдите в **Logs** → **Database Logs**
3. Проверьте:
   - Количество подключений
   - Медленные запросы (>1 сек)
   - Ошибки подключения

---

## ✅ Чеклист оптимизации

- [x] Переключиться на Connection Pooler (порт 6543)
- [x] Настроить CONN_MAX_AGE
- [x] Включить CONN_HEALTH_CHECKS
- [x] Установить connect_timeout
- [ ] Добавить индексы в базу данных
- [ ] Использовать select_related/prefetch_related в API
- [ ] Настроить кэширование для dashboard
- [ ] Оптимизировать медленные запросы

---

**Результат:** Запросы должны выполняться за **50-200 мс** вместо 2+ секунд.

# 🔧 Настройка подключения к Supabase

## Ваши данные проекта

```
Project URL: https://vulnzaoagtxzpayyjjct.supabase.co
Project Ref: vulnzaoagtxzpayyjjct
Anon Key: sb_publishable_ILWHqh3z6W5AH5TkfNPRww_tHsHVSoT
Password: NwC1e3oj09s4nrLs
```

---

## Шаг 1: Получение правильной строки подключения

### Вариант A: Через Supabase Dashboard (Рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct)
2. Перейдите в **Settings** (шестерёнка слева внизу)
3. Выберите **Database**
4. Найдите секцию **Connection string**
5. Выберите **URI** tab
6. Скопируйте строку:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.vulnzaoagtxzpayyjjct.supabase.co:5432/postgres
   ```

### Вариант B: Через Pooler (для продакшена)

1. В Dashboard: **Settings > Database > Connection Pooling**
2. Включите **Transaction Mode**
3. Скопируйте строку pooler:
   ```
   postgresql://postgres.[PROJECT_REF]@[POOLER_HOST]:6543/postgres
   ```

---

## Шаг 2: Обновление .env файла

Откройте `backend/.env` и обновите:

```env
# Supabase Database Configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=NwC1e3oj09s4nrLs

# ВАРИАНТ 1: Прямое подключение (для разработки)
POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
POSTGRES_PORT=5432

# ВАРИАНТ 2: Connection Pooler (для продакшена)
# Раскомментируйте если используете pooler:
# POSTGRES_HOST=aws-0-<REGION>.pooler.supabase.com
# POSTGRES_PORT=6543
```

---

## Шаг 3: Проверка подключения

### Тест через Python

```bash
cd backend
python -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='db.vulnzaoagtxzpayyjjct.supabase.co',
        database='postgres',
        user='postgres',
        password='NwC1e3oj09s4nrLs',
        port=5432,
        connect_timeout=10
    )
    print('✓ Подключение успешно!')
    conn.close()
except Exception as e:
    print(f'✗ Ошибка: {e}')
"
```

### Тест через Django

```bash
cd backend
python manage.py check
python manage.py migrate
```

---

## 🔴 Возможные проблемы и решения

### Ошибка: "Connection timed out"

**Причина:** Брандмауэр блокирует порт 5432

**Решения:**

1. **Проверьте брандмауэр Windows:**
   - Откройте "Брандмауэр Защитника Windows"
   - Разрешите Python доступ к сети
   - Или временно отключите брандмауэр для теста

2. **Используйте Connection Pooler (порт 6543):**
   ```env
   POSTGRES_HOST=aws-0-<REGION>.pooler.supabase.com
   POSTGRES_PORT=6543
   ```

3. **Проверьте прокси/антивирус:**
   - Некоторые антивирусы блокируют подключения
   - Попробуйте отключить VPN/прокси

### Ошибка: "could not translate host name"

**Причина:** Проблема с DNS

**Решение:**
```env
# Попробуйте IP адрес вместо хоста
# Узнайте IP через ping:
ping db.vulnzaoagtxzpayyjjct.supabase.co

# Затем используйте IP в .env:
POSTGRES_HOST=104.18.38.10
```

### Ошибка: "password authentication failed"

**Причина:** Неверный пароль

**Решение:**
1. В Dashboard: **Settings > Database**
2. Нажмите **Reset Database Password**
3. Скопируйте новый пароль
4. Обновите `.env`

---

## Шаг 4: Применение миграций

После успешного подключения:

```bash
cd backend

# 1. Проверка
python manage.py check

# 2. Миграции
python manage.py migrate

# 3. Создание суперпользователя
python manage.py createsuperuser

# 4. Тестовые данные (опционально)
python create_test_data.py

# 5. Запуск сервера
python manage.py runserver
```

---

## ✅ Проверка успешной миграции

1. Откройте Django Admin: `http://127.0.0.1:8000/admin/`
2. Войдите как суперпользователь
3. Проверьте наличие данных в моделях

Или через API:
- Swagger: `http://127.0.0.1:8000/api/docs/`
- Login: `POST /api/v1/auth/login/`

---

## 📊 Мониторинг в Supabase Dashboard

После миграции проверьте:

1. **Dashboard > Table Editor** — данные должны быть видны
2. **Settings > Database** — размер БД, подключения
3. **Logs** — логи запросов

---

## 🔄 Альтернатива: Локальная разработка на SQLite

Если подключение к Supabase не работает:

1. Закомментируйте `POSTGRES_HOST` в `.env`:
   ```env
   # POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
   ```

2. Примените миграции на SQLite:
   ```bash
   python manage.py migrate
   python create_test_data.py
   python manage.py runserver
   ```

3. Позже мигрируйте на Supabase:
   ```bash
   python manage.py dumpdata --format json -o backup.json
   # Раскомментируйте POSTGRES_HOST
   python manage.py migrate
   python manage.py loaddata backup.json
   ```

---

## 📞 Поддержка

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Dashboard: https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct

# Инструкция по миграции на Supabase

## Обзор

Этот документ описывает процесс миграции Parko с локальной SQLite базы данных на облачную PostgreSQL базу данных Supabase.

---

## Шаг 1: Создание проекта Supabase

### 1.1 Регистрация и создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **Start your project** или **Sign Up**
3. Войдите через GitHub или создайте аккаунт по email
4. Нажмите **New Project**
5. Заполните форму:
   - **Organization**: Выберите существующую или создайте новую
   - **Project name**: `parko` (или ваше название)
   - **Database Password**: Запомните этот пароль! (минимум 6 символов)
   - **Region**: Выберите ближайший регион (например, `Frankfurt (eu-central-1)` для Европы)
6. Нажмите **Create new project**

### 1.2 Получение данных для подключения

После создания проекта (2-5 минут):

1. В левом меню выберите **Settings** (шестерёнка)
2. Перейдите в **Database**
3. Найдите секцию **Connection string**
4. Выберите **URI** tab
5. Скопируйте строку подключения, она выглядит так:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

Извлеките из строки:
- `POSTGRES_HOST`: `db.xxxxx.supabase.co` (без `postgresql://` и порта)
- `POSTGRES_PASSWORD`: Ваш пароль из шага создания
- `POSTGRES_DB`: `postgres`
- `POSTGRES_USER`: `postgres`
- `POSTGRES_PORT`: `5432`

---

## Шаг 2: Настройка backend/.env

### 2.1 Копирование файла

```bash
cd backend
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

### 2.2 Заполнение переменных

Откройте `backend/.env` и заполните:

```env
# Django
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DJANGO_SETTINGS_MODULE=config.settings.dev

# Supabase Database Configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ВАШ_ПАРОЛЬ_ОТ_SUPABASE
POSTGRES_HOST=db.ВАШ_PROJECT_ID.supabase.co
POSTGRES_PORT=5432

# Hosts
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@parko.com
```

---

## Шаг 3: Резервное копирование данных SQLite

Перед миграцией создайте резервную копию текущих данных:

```bash
cd backend
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude auth.permission \
    --exclude contenttypes \
    -o backup_sqlite.json
```

**Результат:** Файл `backup_sqlite.json` с данными из SQLite.

---

## Шаг 4: Применение миграций на Supabase

Теперь примените миграции Django к базе данных Supabase:

```bash
cd backend
python manage.py migrate
```

**Ожидаемый результат:**
```
Operations to perform:
  Apply all migrations: admin, auth, accounts, companies, fleet, reports, dashboard
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
```

---

## Шаг 5: Импорт данных из SQLite в Supabase

### 5.1 Импорт данных

```bash
cd backend
python manage.py loaddata backup_sqlite.json
```

**Примечание:** Если возникнут ошибки с `contenttypes` или `auth`, используйте упрощённый импорт:

```bash
python manage.py loaddata --exclude contenttypes --exclude auth backup_sqlite.json
```

### 5.2 Альтернативный способ (скрипт миграции)

Используйте подготовленный скрипт:

```bash
cd backend
python migrate_to_supabase.py
```

---

## Шаг 6: Проверка подключения

### 6.1 Тестирование подключения

```bash
cd backend
python manage.py shell
```

Введите в оболочке:

```python
from django.contrib.auth import get_user_model
User = get_user_model()
print(f"Всего пользователей: {User.objects.count()}")
print(f"БД: {User.objects.db}")
```

**Ожидаемый результат:**
```
Всего пользователей: X
БД: default
```

### 6.2 Проверка Django Admin

1. Запустите сервер:
   ```bash
   python manage.py runserver
   ```

2. Откройте браузер: `http://127.0.0.1:8000/admin/`
3. Войдите как суперпользователь
4. Проверьте, что данные отображаются

---

## Шаг 7: Создание суперпользователя (если нужно)

Если в импортированных данных нет суперпользователя:

```bash
python manage.py createsuperuser
```

Введите:
- Username: `admin`
- Email: `admin@parko.com`
- Password: `ваш_надёжный_пароль`

---

## Шаг 8: Запуск тестов

### 8.1 Тесты backend

```bash
cd backend
python manage.py test
```

### 8.2 Проверка API

1. Откройте Swagger docs: `http://127.0.0.1:8000/api/docs/`
2. Проверьте endpoints:
   - `GET /api/v1/cars/`
   - `GET /api/v1/users/`
   - `GET /api/v1/dashboard/`

---

## Шаг 9: Настройка frontend (если нужно)

Frontend не требует изменений, так как API остаётся тем же.

Просто убедитесь, что `.env` frontend содержит правильный API URL:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

---

## Решение проблем

### Ошибка: "database is locked"

**Причина:** Попытка записи в SQLite при активном подключении.

**Решение:**
```bash
# Закройте все процессы Django
taskkill /F /IM python.exe  # Windows
killall python              # Linux/Mac

# Удалите SQLite файл
del db.sqlite3              # Windows
rm db.sqlite3               # Linux/Mac
```

### Ошибка: "password authentication failed"

**Причина:** Неверный пароль Supabase.

**Решение:**
1. Проверьте пароль в `backend/.env`
2. В Supabase Dashboard: **Settings > Database > Reset Password**
3. Обновите `.env` и перезапустите сервер

### Ошибка: "could not translate host name"

**Причина:** Неверный POSTGRES_HOST.

**Решение:**
- Убедитесь, что HOST указан без `postgresql://` и порта
- Пример: `db.abcdefgh.supabase.co` (не `postgresql://db.abcdefgh...`)

### Ошибка: "relation already exists"

**Причина:** Миграции уже применены.

**Решение:**
```bash
# Отметить миграции как применённые
python manage.py migrate --fake-initial
```

---

## Дополнительные настройки Supabase

### Pooling соединений (Production)

Для production используйте Supabase Connection Pooler:

1. В Dashboard: **Settings > Database > Connection Pooling**
2. Включите **Transaction Mode**
3. Скопируйте строку подключения
4. Обновите `.env`:
   ```env
   POSTGRES_HOST=aws-0-region.pooler.supabase.co
   POSTGRES_PORT=5432
   ```

### Backup данных

Supabase автоматически делает бэкапы, но можно создать вручную:

```bash
# Экспорт всех данных
python manage.py dumpdata --format json --indent 2 -o backup.json

# Экспорт конкретной модели
python manage.py dumpdata fleet.Car --format json --indent 2 -o cars_backup.json
```

### Мониторинг

1. **Dashboard > Database**: Использование БД, запросы
2. **Settings > Database**: Connection limits, размер БД
3. **Logs**: SQL логи и ошибки

---

## Чек-лист миграции

- [ ] Создан проект Supabase
- [ ] Получены credentials из Dashboard
- [ ] Настроен `backend/.env`
- [ ] Создана резервная копия SQLite (`backup_sqlite.json`)
- [ ] Применены миграции (`python manage.py migrate`)
- [ ] Импортированы данные (`python manage.py loaddata backup_sqlite.json`)
- [ ] Django Admin работает
- [ ] API endpoints отвечают
- [ ] Тесты проходят
- [ ] Frontend подключается к API

---

## Откат миграции (если нужно)

Если нужно вернуться на SQLite:

1. Обновите `backend/.env`:
   ```env
   # Закомментируйте строки PostgreSQL
   # POSTGRES_DB=postgres
   # POSTGRES_USER=postgres
   # POSTGRES_PASSWORD=...
   # POSTGRES_HOST=...
   ```

2. Примените миграции на SQLite:
   ```bash
   python manage.py migrate
   ```

3. Импортируйте данные из бэкапа:
   ```bash
   python manage.py loaddata backup_sqlite.json
   ```

---

## Контакты и поддержка

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Django Docs**: [docs.djangoproject.com](https://docs.djangoproject.com)
- **Parko Documentation**: См. `TZ.md`, `README.md`

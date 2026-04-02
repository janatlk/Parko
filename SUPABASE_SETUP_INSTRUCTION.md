# 🔧 Инструкция по настройке Supabase для Parko

## 📋 Быстрая настройка (5 минут)

### Шаг 1: Проверка подключения к Supabase

Ваш проект уже создан:
- **URL:** https://vulnzaoagtxzpayyjjct.supabase.co
- **Project Ref:** vulnzaoagtxzpayyjjct

---

### Шаг 2: Настройка .env файла

Откройте файл `backend/.env` и **раскомментируйте** строки подключения:

```env
# Django
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DJANGO_SETTINGS_MODULE=config.settings.dev

# Supabase Database Configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=NwC1e3oj09s4nrLs

# ⚠️ РАСКОММЕНТИРУЙТЕ ЭТИ СТРОКИ:
POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
POSTGRES_PORT=5432

# Supabase API Configuration
SUPABASE_URL=https://vulnzaoagtxzpayyjjct.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bG56YW9hZ3R4enBheXlqamN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTQyNzksImV4cCI6MjA1OTE3MDI3OX0.sTz3v3qKGXz6jXz6jXz6jXz6jXz6jXz6jXz6jXz6jXz

# Hosts
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Важно:** Удалите `# ` в начале строк:
- `# POSTGRES_HOST=...` → `POSTGRES_HOST=...`
- `# POSTGRES_PORT=...` → `POSTGRES_PORT=...`

---

### Шаг 3: Применение миграций на Supabase

После изменения `.env` выполните:

```bash
cd backend

# Применить миграции на Supabase
python manage.py migrate

# Создать суперпользователя
python manage.py createsuperuser
```

Введите:
- Username: `admin`
- Email: `admin@parko.com`
- Password: `admin123` (или ваш пароль)

---

### Шаг 4: Перенос данных из SQLite в Supabase

Если у вас есть данные в локальной SQLite:

```bash
cd backend

# 1. Экспорт данных из SQLite
# Временно закомментируйте POSTGRES_HOST в .env
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude auth.permission \
    --exclude contenttypes \
    --format json \
    --indent 2 \
    -o backup_sqlite.json

# 2. Раскомментируйте POSTGRES_HOST в .env

# 3. Импорт данных в Supabase
python manage.py loaddata backup_sqlite.json
```

---

### Шаг 5: Проверка подключения

```bash
cd backend

# Проверка подключения к Supabase
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
print(f'Users in Supabase: {User.objects.count()}')
print(f'Database: {User.objects.db}')
"
```

**Ожидаемый результат:**
```
Users in Supabase: X
Database: default
```

---

### Шаг 6: Запуск проекта

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Доступ:**
- Лендинг: http://localhost:5173/
- Логин: http://localhost:5173/login
- Admin: http://127.0.0.1:8000/admin/

**Тестовые учётные данные:**
- Username: `admin`
- Password: `admin123`

---

## 🔴 Решение проблем

### Ошибка: "could not translate host name"

**Причина:** DNS не резолвит хост Supabase

**Решение 1: Использовать IP адрес**

1. Узнайте IP через nslookup:
   ```bash
   nslookup db.vulnzaoagtxzpayyjjct.supabase.co
   ```

2. Используйте IP в `.env`:
   ```env
   POSTGRES_HOST=104.18.38.10
   ```

**Решение 2: Использовать Connection Pooler**

1. В Dashboard: **Settings > Database > Connection Pooling**
2. Включите **Transaction Mode**
3. Скопируйте строку pooler
4. Обновите `.env`:
   ```env
   POSTGRES_HOST=aws-0-<REGION>.pooler.supabase.co
   POSTGRES_PORT=6543
   ```

---

### Ошибка: "Connection timed out"

**Причина:** Брандмауэр блокирует порт 5432

**Решение:**

1. **Проверьте брандмауэр Windows:**
   - Откройте "Брандмауэр Защитника Windows"
   - Разрешите Python доступ к сети
   - Или временно отключите для теста

2. **Используйте порт 6543 (Connection Pooler):**
   ```env
   POSTGRES_HOST=aws-0-<REGION>.pooler.supabase.co
   POSTGRES_PORT=6543
   ```

3. **Проверьте антивирус/VPN:**
   - Отключите VPN если используется
   - Проверьте настройки антивируса

---

### Ошибка: "password authentication failed"

**Причина:** Неверный пароль

**Решение:**

1. В Dashboard: **Settings > Database**
2. Нажмите **Reset Database Password**
3. Скопируйте новый пароль
4. Обновите `.env`:
   ```env
   POSTGRES_PASSWORD=новый_пароль
   ```
5. Перезапустите сервер

---

### Ошибка: "relation already exists"

**Причина:** Миграции уже применены

**Решение:**
```bash
python manage.py migrate --fake-initial
```

---

## 📊 Проверка данных в Supabase Dashboard

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct)
2. Перейдите в **Table Editor**
3. Проверьте таблицы:
   - `accounts_user` - пользователи
   - `companies_company` - компании
   - `fleet_car` - автомобили
   - `fleet_fuel` - топливо
   - `feedback_feedback` - обратная связь

---

## 🔐 Безопасность

### Что нужно изменить для продакшена:

1. **Смените SECRET_KEY:**
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```
   Обновите в `.env`:
   ```env
   DJANGO_SECRET_KEY=новый_секретный_ключ
   ```

2. **Смените пароль базы данных:**
   - Dashboard: **Settings > Database > Reset Password**
   - Обновите в `.env`

3. **Обновите ALLOWED_HOSTS:**
   ```env
   ALLOWED_HOSTS=your-domain.com,www.your-domain.com
   CORS_ALLOWED_ORIGINS=https://your-domain.com
   ```

4. **Установите DEBUG=False:**
   В `backend/config/settings/dev.py` или создайте `prod.py`:
   ```python
   DEBUG = False
   ```

---

## 📁 Структура файлов

```
backend/
├── .env                        # ⚠️ Настройте этот файл!
├── .env.example                # Шаблон
├── manage.py
├── config/
│   └── settings/
│       ├── base.py
│       ├── dev.py              # Авто-переключение SQLite/PostgreSQL
│       └── prod.py
└── ...
```

---

## ✅ Чек-лист настройки

- [ ] Раскомментирован `POSTGRES_HOST` в `.env`
- [ ] Применены миграции: `python manage.py migrate`
- [ ] Создан суперпользователь: `python manage.py createsuperuser`
- [ ] Проверено подключение: `python manage.py shell`
- [ ] Данные видны в Supabase Dashboard
- [ ] Логин работает: `admin` / `admin123`
- [ ] Django Admin доступен
- [ ] Frontend подключается к API

---

## 🆘 Если ничего не помогает

### Вариант: Использовать SQLite для разработки

1. Закомментируйте `POSTGRES_HOST` в `.env`:
   ```env
   # POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
   ```

2. Примените миграции на SQLite:
   ```bash
   python manage.py migrate
   python create_test_data.py
   ```

3. Для продакшена используйте Supabase на хостинге

---

## 📞 Поддержка

- **Supabase Docs:** https://supabase.com/docs
- **Django Docs:** https://docs.djangoproject.com
- **Dashboard:** https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct

---

## 🎯 Текущие учётные данные

### Backend (SQLite/Supabase):
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@parko.com`

### Supabase Dashboard:
- **URL:** https://vulnzaoagtxzpayyjjct.supabase.co
- **Password:** `NwC1e3oj09s4nrLs`

---

**После настройки `.env` перезапустите сервер!**

```bash
# Остановить сервер (Ctrl+C)

# Запустить заново
cd backend
python manage.py runserver
```

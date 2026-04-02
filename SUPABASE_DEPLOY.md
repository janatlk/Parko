# 🚀 Деплой Parko на Supabase через хостинг

## ⚠️ Проблема локального подключения

Ваша корпоративная сеть блокирует прямые подключения к PostgreSQL (порт 5432) на адреса Supabase.

**Решение:** Развернуть Django backend на облачном хостинге (Railway, Render, Heroku), где нет таких ограничений.

---

## 📋 Ваши credentials от Supabase

```
Project URL: https://vulnzaoagtxzpayyjjct.supabase.co
Project Ref: vulnzaoagtxzpayyjjct
Database Password: NwC1e3oj09s4nrLs

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=NwC1e3oj09s4nrLs
POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
POSTGRES_PORT=5432
```

---

## 🎯 Вариант 1: Railway (Рекомендуется)

### Шаг 1: Подготовка

1. Создайте репозиторий на GitHub (если ещё не создан)
2. **НЕ коммитьте `.env` файл!** Добавьте в `.gitignore`:
   ```
   .env
   db.sqlite3
   __pycache__/
   ```

### Шаг 2: Деплой на Railway

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Нажмите **New Project** → **Deploy from GitHub repo**
3. Выберите ваш репозиторий `Parko`
4. Укажите root directory: `backend`

### Шаг 3: Настройка переменных окружения

В Railway Dashboard добавьте переменные:

```env
# Django
DJANGO_SECRET_KEY=<сгенерируйте случайную строку>
DJANGO_SETTINGS_MODULE=config.settings.prod
DEBUG=False

# Supabase Database
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=NwC1e3oj09s4nrLs
POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
POSTGRES_PORT=5432

# Hosts
ALLOWED_HOSTS=<ваш-domain-railway>.railway.app
CORS_ALLOWED_ORIGINS=https://<ваш-domain-railway>.railway.app,http://localhost:5173

# Email (опционально)
SENDGRID_API_KEY=<ваш-key>
DEFAULT_FROM_EMAIL=noreply@parko.com
```

### Шаг 4: Запуск миграций

В Railway CLI или через Dashboard:

```bash
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

### Шаг 5: Деплой frontend

1. В том же проекте Railway добавьте ещё один сервис
2. Укажите root directory: `frontend`
3. Build command: `npm run build`
4. Start command: `npx serve dist`
5. Добавьте переменную: `VITE_API_URL=https://<backend-url>.railway.app`

---

## 🎯 Вариант 2: Render

### Шаг 1: Создание Web Service

1. Зарегистрируйтесь на [render.com](https://render.com)
2. **New +** → **Web Service**
3. Подключите GitHub репозиторий
4. Configure:
   - **Name**: `parko-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate`
   - **Start Command**: `gunicorn config.wsgi:application`

### Шаг 2: Environment Variables

```env
DJANGO_SECRET_KEY=<сгенерируйте случайную строку>
DJANGO_SETTINGS_MODULE=config.settings.prod
DEBUG=False

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=NwC1e3oj09s4nrLs
POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
POSTGRES_PORT=5432

ALLOWED_HOSTS=<ваш-domain>.onrender.com
CORS_ALLOWED_ORIGINS=https://<ваш-domain>.onrender.com,http://localhost:5173
```

### Шаг 3: Создайте суперпользователя

Через SSH в Dashboard Render:

```bash
python manage.py createsuperuser
```

---

## 🎯 Вариант 3: Heroku

### Шаг 1: Установка Heroku CLI

```bash
# Windows
choco install heroku-cli

# Или скачайте с https://devcenter.heroku.com/articles/heroku-cli
```

### Шаг 2: Создание приложения

```bash
cd backend
heroku login
heroku create parko-backend
```

### Шаг 3: Настройка buildpack

```bash
heroku buildpacks:set heroku/python
```

### Шаг 4: Переменные окружения

```bash
heroku config:set DJANGO_SECRET_KEY="<random-string>"
heroku config:set DJANGO_SETTINGS_MODULE=config.settings.prod
heroku config:set DEBUG=False

heroku config:set POSTGRES_DB=postgres
heroku config:set POSTGRES_USER=postgres
heroku config:set POSTGRES_PASSWORD=NwC1e3oj09s4nrLs
heroku config:set POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
heroku config:set POSTGRES_PORT=5432

heroku config:set ALLOWED_HOSTS=<ваш-domain>.herokuapp.com
heroku config:set CORS_ALLOWED_ORIGINS=https://<ваш-domain>.herokuapp.com
```

### Шаг 5: Деплой

```bash
git subtree push --prefix backend heroku main
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

---

## 🔧 Локальная разработка (SQLite)

Для локальной разработки используйте SQLite:

```bash
cd backend
python manage.py runserver
```

**Backend:** http://127.0.0.1:8000/admin/
**Frontend:** http://localhost:5173

---

## 📊 Проверка подключения к Supabase

После деплоя проверьте:

1. ** Django Admin:** `https://<ваш-domain>/admin/`
2. **API Docs:** `https://<ваш-domain>/api/docs/`
3. **Supabase Dashboard:** https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct

В Supabase Dashboard:
- **Table Editor** — данные должны быть видны
- **Logs** — запросы от Django

---

## 🔐 Безопасность

### Для production убедитесь:

- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` — случайная строка 50+ символов
- [ ] `ALLOWED_HOSTS` — только ваши домены
- [ ] HTTPS включен
- [ ] CORS настроен правильно
- [ ] `.env` НЕ закоммичен в Git

---

## 📁 Файлы для деплоя

### backend/requirements.txt
Уже содержит все необходимые зависимости:
- `psycopg2-binary` — PostgreSQL драйвер
- `gunicorn` — WSGI сервер (для production)

### backend/config/settings/prod.py
Уже настроен для production:
- PostgreSQL база данных
- Безопасные настройки
- CORS конфигурация

---

## 🆘 Troubleshooting

### Ошибка: "Database connection refused"
- Проверьте credentials в переменных окружения
- Убедитесь, что Supabase проект активен

### Ошибка: "CORS policy"
- Добавьте frontend domain в `CORS_ALLOWED_ORIGINS`
- Проверьте `ALLOWED_HOSTS`

### Ошибка: "Static files not found"
```bash
python manage.py collectstatic --noinput
```

### Frontend не видит backend
- Установите `VITE_API_URL` в frontend переменных
- Проверьте CORS настройки

---

## ✅ Чеклист успешного деплоя

- [ ] Backend развернут на хостинге
- [ ] Миграции применены
- [ ] Суперпользователь создан
- [ ] Django admin доступен
- [ ] API endpoints работают
- [ ] Frontend подключен к backend
- [ ] Данные видны в Supabase Dashboard

---

## 📞 Поддержка

- **Supabase Dashboard:** https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct
- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **Django Docs:** https://docs.djangoproject.com

---

**Ваша база данных уже готова в Supabase! Просто разверните backend на хостинге для подключения.**

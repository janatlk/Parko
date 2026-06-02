# AGENTS.md — Parko Fleet Management SaaS

> Этот файл предназначен для AI-агентов, работающих с проектом. Здесь описана архитектура, технологический стек, правила разработки и ключевые соглашения.

---

## 1. Обзор проекта

**Parko** — SaaS-платформа для управления автопарком предприятий с поддержкой множества компаний (multi-tenant). Система позволяет вести учёт транспортных средств, расхода топлива, технического обслуживания, страховок, осмотров, шин и аккумуляторов. Поддерживается генерация отчётов (CSV, XLSX, PDF, JSON), email-рассылка, дашборд с аналитикой и AI-ассистент на базе Groq (LLaMA).

- **Backend:** Django 4.2 + Django REST Framework, JWT-аутентификация
- **Frontend:** React 19 + TypeScript + Vite + Mantine UI
- **База данных:** SQLite (локальная разработка) / PostgreSQL через Supabase (продакшен)
- **AI:** Groq API (`llama-3.1-8b-instant`) с tool calling для CRUD-операций
- **Языки интерфейса:** Русский (основной), English, Кыргызча

---

## 2. Технологический стек

### Backend (`backend/`)

| Компонент | Версия / Библиотека |
|-----------|---------------------|
| Python | 3.11+ |
| Django | >=4.2, <5.0 |
| DRF | >=3.14, <4.0 |
| Auth | `djangorestframework-simplejwt` (access 60 мин, refresh 1 день) |
| Документация API | `drf-spectacular` + Swagger UI (`/api/docs/`) |
| Фильтрация | `django-filter` |
| CORS | `django-cors-headers` |
| БД (prod) | PostgreSQL через `psycopg2-binary`, SSL-режим |
| Кэш | `django.core.cache.backends.db.DatabaseCache` (5 минут) |
| Email | SendGrid / Mailgun / SMTP |
| AI | `groq>=0.4.0` |
| Отчёты | `openpyxl`, `reportlab`, `Pillow` |

### Frontend (`frontend/`)

| Компонент | Версия / Библиотека |
|-----------|---------------------|
| React | ^19.2.3 |
| TypeScript | ~5.9.3 (strict mode) |
| Сборка | Vite ^5.4.11 |
| UI | Mantine v8 (`@mantine/core`, `@mantine/dates`, `@mantine/modals`, `@mantine/notifications`) |
| Иконки | `@tabler/icons-react` |
| Серверный стейт | `@tanstack/react-query` ^5.90.12 |
| HTTP-клиент | `axios` ^1.13.2 |
| Роутинг | `react-router-dom` ^7.11.0 |
| i18n | `i18next` + `react-i18next` (RU, EN, KY) |
| Графики | `recharts` ^3.8.0 |
| Markdown | `react-markdown` + `rehype-raw` |
| Даты | `dayjs` |

---

## 3. Структура проекта

```
Parko/
├── backend/                  # Django backend
│   ├── config/               # Настройки проекта
│   │   ├── settings/
│   │   │   ├── base.py       # Базовые настройки
│   │   │   ├── dev.py        # Разработка (SQLite/PostgreSQL авто-переключение)
│   │   │   └── prod.py       # Продакшен (только PostgreSQL)
│   │   ├── urls.py           # Корневой роутер (/api/v1/)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/             # Пользователи, JWT-аутентификация, демо-сессии
│   ├── companies/            # Модель Company (корень мультиарендности)
│   ├── fleet/                # Основные сущности: Car, Fuel, Spare, Tires, Accumulator, Insurance, Inspection, CarPhoto
│   ├── reports/              # Генерация отчётов, экспорт, email-рассылка
│   ├── dashboard/            # Аналитика и виджеты дашборда
│   ├── feedback/             # Публичная форма обратной связи
│   ├── ai/                   # AI-ассистент (чат, streaming SSE, tool calling)
│   ├── core/                 # Общая инфраструктура: permissions, pagination, renderers, exceptions, mixins, viewsets
│   ├── api/                  # Legacy/info endpoints
│   ├── users/                # Management commands (create_demo_data, create_demo_user)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── app/              # Инициализация, провайдеры, роутинг
│   │   ├── pages/            # Страницы приложения
│   │   ├── widgets/          # Сложные UI-блоки (AppLayout и т.д.)
│   │   ├── features/         # Фичи: auth, cars, dashboard, fuel, reports, ai, theme, и т.д.
│   │   ├── entities/         # Типы доменных сущностей: auth, car, company, fleet, user
│   │   └── shared/           # Инфраструктура: api, theme, ui, utils, constants, i18n, lib
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   └── .prettierrc
├── .agents/                  # Инструкции для AI-агентов по направлениям
└── README_SETUP.md           # Подробная инструкция по запуску и входу
```

### Архитектура frontend

Frontend построен по мотивам **Feature-Sliced Design (FSD)**:

- **`app/`** — точка входа, провайдеры (AuthProvider, ThemeProvider), BrowserRouter
- **`pages/`** — роут-уровневые компоненты
- **`widgets/`** — крупные переиспользуемые блоки (layout, навигация)
- **`features/`** — доменные фичи с API, хуками и UI-компонентами
- **`entities/`** — типы доменных сущностей
- **`shared/`** — переиспользуемая инфраструктура

**Path aliases** (Vite + TypeScript):
- `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`

---

## 4. Команды сборки и запуска

### Backend

```bash
cd backend

# Установка зависимостей
pip install -r requirements.txt

# Миграции
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Запуск сервера разработки
python manage.py runserver

# Демо-данные
python manage.py create_demo_data
```

**Dev-сервер:** `http://127.0.0.1:8000`
**Django Admin:** `http://127.0.0.1:8000/admin/`
**API Docs (Swagger):** `http://127.0.0.1:8000/api/docs/`

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка продакшена
npm run build

# Линтинг
npm run lint

# Форматирование
npm run format
npm run check-format
```

**Dev-сервер:** `http://localhost:5173`

### Docker (backend only)

```bash
cd backend
docker-compose up --build
```

Поднимает PostgreSQL 16 и Django (`runserver` на порту 8000). **Внимание:** Dockerfile использует `runserver`, а не Gunicorn — это конфигурация для разработки.

---

## 5. Переключение базы данных

По умолчанию backend работает на **SQLite** (`backend/db.sqlite3`). Для переключения на **PostgreSQL/Supabase**:

1. Открыть `backend/.env`
2. Раскомментировать `POSTGRES_HOST` и `POSTGRES_PORT`
3. Перезапустить сервер

Или использовать скрипт:

```bash
cd backend
python setup_supabase.py
```

Продакшен-настройки (`config/settings/prod.py`) работают ТОЛЬКО с PostgreSQL.

---

## 6. Стиль кода и соглашения

### Backend

- **PEP 8**, snake_case для переменных/функций, PascalCase для классов
- **ВСЕГДА** добавлять `company` ForeignKey для мультиарендной изоляции
- **ВСЕГДА** наследовать ViewSets от `CompanyScopedModelViewSet` (из `core/viewsets.py`)
- **ВСЕГДА** использовать `select_related` / `prefetch_related` в queryset
- **ВСЕГДА** добавлять фильтры, поиск (`search_fields`) и сортировку (`ordering_fields`)
- Ответы API оборачиваются в единый формат через `StandardJSONRenderer`:
  ```json
  { "status": "success|error", "data": {...}, "message": "...", "errors": {...} }
  ```
- Docstrings и комментарии — на **русском языке**

### Frontend

- **Только TypeScript** (никаких `.js` файлов)
- **Prettier:** `semi: false`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`
- **ESLint:** TypeScript + React Hooks + React Refresh
- **ВСЕГДА** использовать компоненты Mantine
- **ВСЕГДА** добавлять переводы на 3 языка (RU, EN, KY) в `shared/i18n/index.ts`
- **ВСЕГДА** использовать TanStack Query для серверного состояния
- **ВСЕГДА** обрабатывать состояния loading, error и empty
- Для денежных значений использовать `formatPrice(value, currency)`
- Тёмная тема реализована через CSS-переменные и `darkStyles.css` — **не хардкодить цвета**

---

## 7. Тестирование

### Текущее состояние

**Backend:** файлы `tests.py` во всех приложениях существуют, но являются пустыми заглушками (Django-шаблон). Реальных тестов нет.

**Frontend:** тестовый фреймворк не установлен. Нет Jest, Vitest, Playwright или Cypress.

### Как писать тесты

**Backend (Django):**
- Использовать `APITestCase` из DRF
- Тестировать изоляцию по компаниям (company isolation)
- Тестировать права доступа (роли: COMPANY_ADMIN, DISPATCHER, MECHANIC, DRIVER, ACCOUNTANT, GUEST)
- Мокать внешние вызовы (Groq, email-сервисы)

**Frontend (React):**
- Рекомендуется Vitest + React Testing Library
- Тестировать рендеринг, взаимодействия, состояния загрузки/ошибок
- Мокать API-вызовы через MSW или моки TanStack Query

---

## 8. Модель доступа и безопасность

### Роли пользователей (`accounts.User.role`)

| Роль | Описание |
|------|----------|
| `COMPANY_ADMIN` | Полный доступ к данным компании |
| `DISPATCHER` | Управление транспортом и маршрутами |
| `MECHANIC` | Доступ к ТО и запчастям |
| `DRIVER` | Ограниченный доступ (свои данные) |
| `ACCOUNTANT` | Доступ к отчётам и финансам |
| `GUEST` | Только чтение (read-only) |

### Ключевые правила безопасности

- `DEBUG=False` в продакшене
- `SECRET_KEY` — сильный, уникальный, в `.env`
- `ALLOWED_HOSTS` настроен строго
- CORS в разработке разрешён для `localhost:5173`, в продакшене — только из env
- PostgreSQL подключение через SSL (`sslmode=require`)
- JWT-токены с blacklist (`rest_framework_simplejwt.token_blacklist`)
- AI tool calling проверяет `user.role == COMPANY_ADMIN` перед выполнением операций
- `.env` файл НЕ коммитится в git

### Демо-режим

- Изолированные демо-сессии через Django Cache (не через БД)
- TTL: 2 часа, лимит: 100 одновременных сессий
- JWT-токены для демо генерируются кастомно (без записи в User)

---

## 9. Деплоймент

### Локальная разработка

```bash
# Terminal 1
cd backend && python manage.py runserver

# Terminal 2
cd frontend && npm run dev
```

### Продакшен-хостинг

Документированы варианты развёртывания:
- **Railway**
- **Render**
- **Heroku**

Для продакшена:
1. Переключиться на PostgreSQL (Supabase или собственный)
2. Установить `DEBUG=False`
3. Настроить `ALLOWED_HOSTS` и CORS
4. Использовать Gunicorn + Nginx (вместо `runserver`)
5. Собрать frontend (`npm run build`) и раздать статику через Nginx

### Деплой на Render (ручный)

⚠️ **Auto-deploy на Render сломан.** В логах сборки: *"It looks like we don't have access to your repo, but we'll try to clone it anyway."* Пуши в GitHub НЕ триггерят автоматический деплой.

**Порядок действий:**

1. Закоммитить и запушить изменения в `main`:
   ```bash
   git add .
   git commit -m "описание изменений"
   git push origin main
   ```

2. Открыть [dashboard.render.com](https://dashboard.render.com)

3. Найти сервис **Parko** → открыть его

4. Нажать кнопку **Manual Deploy** → выбрать **"Deploy latest commit"**

5. Дождаться окончания сборки (статус станет **Live**)

6. Проверить деплой:
   ```bash
   curl -s https://parko-9ae8.onrender.com | grep -o 'index-[A-Za-z0-9]*\.js'
   ```

**Если auto-deploy нужно починить:**
- Settings → Build & Deploy → отключить и снова включить "Auto-Deploy"
- Либо переподключить GitHub-репозиторий в настройках сервиса

### Проверка работоспособности

```bash
# Проверка логина
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Проверка БД
cd backend
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
print(f'Users: {User.objects.count()}')
"
```

### Учётные данные для разработки

| Пользователь | Пароль | Роль |
|-------------|--------|------|
| `admin` | `admin123` | COMPANY_ADMIN |
| `dispatcher` | `parko123` | DISPATCHER |
| `mechanic` | `parko123` | MECHANIC |
| `driver1` | `parko123` | DRIVER |
| `accountant` | `parko123` | ACCOUNTANT |

---

## 10. Ключевые архитектурные паттерны

### Backend

1. **Мультиарендность (Multi-tenant):** каждая модель с данными компании имеет `company` FK. `CompanyFilterMixin` автоматически фильтрует queryset по `request.user.company_id`.

2. **Стандартизированные ответы:** `StandardJSONRenderer` оборачивает ВСЕ ответы API в единый envelope. HTTP-клиент frontend ожидаает этот формат.

3. **AI Assistant с Tool Calling:**
   - Системный промпт + контекст компании + история чата → LLM
   - Реестр инструментов (`ai/tools.py`): 12 функций для CRUD над fleet-данными
   - Streaming через SSE (`/api/v1/ai/chat/stream/`)
   - Keyword-based relevance filter для отсечения off-topic запросов

4. **Report Engine:**
   - 6 типов отчётов: fuel_consumption, maintenance_costs, insurance_inspection, vehicle_utilization, cost_analysis, cost_per_km
   - Экспорт в CSV, XLSX, PDF, JSON
   - Email-шеринг через SendGrid/Mailgun/SMTP

5. **Кэширование:** DatabaseCache для dashboard и API-ответов (5–10 минут по `company_id`).

### Frontend

1. **Авторизация:** JWT access/refresh в `localStorage`, автоматический рефреш при 401 с очередью запросов.

2. **HTTP-клиент:** Кастомный Axios-инстанс (`shared/api/http.ts`) с:
   - Инжекцией Bearer-токена
   - Распаковкой `StandardJSONRenderer` envelope
   - Авто-рефрешем токена

3. **Темы:** Поддержка light/dark/system через `ThemeProvider` и `data-mantine-color-scheme`. Кастомная тёмная тема с чёрно-белой палитрой.

4. **i18n:** Inline-ресурсы в `shared/i18n/index.ts` (~2000+ строк). Russian — основной язык.

---

## 11. Известные пробелы и ограничения

- **Нет реальных тестов** — все `tests.py` пустые
- **Нет CI/CD** — нет GitHub Actions, GitLab CI и т.д.
- **Нет тестового фреймворка на frontend**
- **Docker только для backend** — frontend не контейнеризован
- **Dockerfile использует `runserver`** — не готов к продакшену без Gunicorn
- **Нет Celery/RQ** — фоновые задачи не вынесены в очередь
- **i18n в одном файле** — `shared/i18n/index.ts` разросся, может требовать разделения
- **CSS-специфичность** — `darkStyles.css` активно использует `!important`, что может быть хрупким при обновлении Mantine

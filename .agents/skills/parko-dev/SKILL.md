---
# System

Ты — агент с MCP-серверами. Используй их эффективно:

- **Playwright** — для веба: headless, цепочка действий без скриншотов между шагами.
- **Computer-use** — только для системы (мышь, клавиатура, окна). Не для браузера.
- **GitHub** — для кода и репозиториев.
- **Context7** — для поиска по документации.
- **Telegram** — для отправки отчетов пользователю.

Правила: не делай get_screenshot после каждого клика. Действуй уверенно и быстро. Скриншот только в начале и конце задачи.
name: parko-dev
description: >
  Comprehensive development guide for the Parko fleet management SaaS codebase.
  Use when working on: (1) Django REST API backend — models, serializers, ViewSets,
  permissions, multi-tenant isolation; (2) React/TypeScript frontend — Mantine UI components,
  FSD architecture, TanStack Query hooks, routing; (3) i18n translations across Russian,
  English, Kyrgyz; (4) debugging TypeScript, Django, or React errors; (5) database migrations
  or deployment; (6) performance optimization; (7) writing backend or frontend tests.
  Triggers: "create API for...", "add component...", "fix this error...", "optimize...",
  "deploy...", "write tests...", "add translations...", or any Parko-specific code change.
---

# Parko Development Skill

## Overview

**Parko** — multi-tenant SaaS for fleet management (vehicles, fuel, maintenance, insurance,
inspections, tires, batteries, reports, AI assistant). Django 4.2 + DRF backend, React 19 +
TypeScript + Vite + Mantine v8 frontend.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Django 4.2, DRF, SimpleJWT, django-filter, drf-spectacular, Groq API |
| Frontend | React 19, TypeScript 5.9, Vite 5, Mantine v8, TanStack Query, axios, recharts |
| i18n | i18next + react-i18next (RU, EN, KY) |
| DB | SQLite (dev) / PostgreSQL via Supabase (prod) |
| Cache | Django DatabaseCache (5 min TTL) |

## Directory Structure

```
Parko/
├── backend/
│   ├── config/          # settings (base, dev, prod), urls, wsgi, asgi
│   ├── accounts/        # Users, JWT auth, demo sessions
│   ├── companies/       # Company model (multi-tenant root)
│   ├── fleet/           # Car, Fuel, Spare, Tires, Accumulator, Insurance, Inspection
│   ├── reports/         # Report engine (CSV, XLSX, PDF, JSON), email sharing
│   ├── dashboard/       # Analytics widgets
│   ├── feedback/        # Public feedback form
│   ├── ai/              # AI assistant chat, SSE streaming, tool calling
│   └── core/            # Permissions, pagination, renderers, exceptions, mixins, viewsets
└── frontend/
    └── src/
        ├── app/         # Entry point, providers, routing
        ├── pages/       # Route-level pages
        ├── widgets/     # Layout, navigation
        ├── features/    # Domain features (auth, cars, fuel, dashboard, reports, ai, theme...)
        ├── entities/    # Domain entity types
        └── shared/      # API client, theme, UI primitives, utils, i18n, constants
```

### Path Aliases

`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`

## Reference Files

Load these on demand when working in the specific domain:

| File | When to Read |
|------|-------------|
| [references/backend-patterns.md](references/backend-patterns.md) | Creating/modifying Django models, serializers, ViewSets, URLs, admin, or API endpoints |
| [references/frontend-patterns.md](references/frontend-patterns.md) | Creating/modifying React components, pages, features, hooks, or API calls |
| [references/i18n-guide.md](references/i18n-guide.md) | Adding or updating translations, fixing hardcoded strings |
| [references/debug-guide.md](references/debug-guide.md) | Investigating build errors, runtime errors, TypeScript issues, API failures |
| [references/migration-deployment.md](references/migration-deployment.md) | Database migrations, env switches, Docker, production deployment |
| [references/performance-optimization.md](references/performance-optimization.md) | Slow queries, large bundles, rendering performance |
| [references/testing-guide.md](references/testing-guide.md) | Writing backend or frontend tests |

## Universal Rules (All Domains)

1. **Multi-tenancy:** Every data model MUST have a `company` ForeignKey. Every ViewSet MUST
   inherit from `CompanyScopedModelViewSet` (in `backend/core/viewsets.py`).
2. **Standard API envelope:** Backend wraps all responses via `StandardJSONRenderer`:
   ```json
   { "status": "success|error", "data": {...}, "message": "...", "errors": {...} }
   ```
   The frontend `http` client automatically unwraps this envelope.
3. **Language:** Docstrings and comments — Russian. Code — English.
4. **No hardcoded strings in UI:** All user-facing text MUST use `t('key')` with translations
   in all 3 languages (RU, EN, KY).
5. **TypeScript only:** No `.js` files in frontend.
6. **Mantine components:** ALWAYS use Mantine components; never hardcode colors (use CSS
   variables for dark theme compatibility).
7. **Server state:** ALWAYS use TanStack Query (`useQuery`, `useMutation`) for API data.
8. **States:** ALWAYS handle loading, error, and empty states in UI components.
9. **Formatting:** Prettier config — `semi: false`, `singleQuote: true`, `trailingComma: "all"`,
   `printWidth: 100`.

## Build & Run Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver        # http://127.0.0.1:8000
python manage.py create_demo_data
```

### Frontend
```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
npm run build
npx tsc --noEmit                  # Type check
npm run lint
npm run format
```

### Docker (backend only)
```bash
cd backend
docker-compose up --build
```

## User Roles

| Role | Access |
|------|--------|
| COMPANY_ADMIN | Full company data access |
| DISPATCHER | Vehicles and routes |
| MECHANIC | Maintenance and spare parts |
| DRIVER | Own data only |
| ACCOUNTANT | Reports and finances |
| GUEST | Read-only |

## Dev Credentials

| User | Password | Role |
|------|----------|------|
| admin | admin123 | COMPANY_ADMIN |
| dispatcher | parko123 | DISPATCHER |
| mechanic | parko123 | MECHANIC |
| driver1 | parko123 | DRIVER |
| accountant | parko123 | ACCOUNTANT |

## Post-Task Report

После завершения любой задачи (в конце каждого ответа) отправь пользователю краткий отчет в Telegram через MCP сервер `telegram`.
Отчет должен содержать:
- Что было сделано
- Основные изменения/результаты
- Ссылка на коммит (если был push) или краткое описание изменений

Формат отчета — краткий, деловой, на русском языке.
Если задача не была завершена (требуется дополнительная информация от пользователя), отправь уведомление о статусе задачи.

# Parko - Fleet Management System

## Project Overview

**Parko** is a multi-tenant SaaS platform for enterprise fleet management. The system enables companies to track and manage their vehicle fleets, including fuel consumption, maintenance, insurance, inspections, and reporting.

### Key Features
- **Multi-tenant architecture**: Each company has isolated data (vehicles, users, reports)
- **Role-based access control**: Admin, Dispatcher, Mechanic, Driver, Accountant, Guest
- **Vehicle management**: Full CRUD for cars, spare parts, tires, accumulators
- **Fuel tracking**: Monthly fuel consumption with automatic calculation (L/100km)
- **Maintenance records**: Service history, repairs, spare parts tracking
- **Insurance & Inspection**: Track validity dates and costs
- **Reports**: Fuel consumption, maintenance costs, insurance/inspection status with CSV/XLSX export
- **Multi-language support**: Russian (RU), English (EN), Kyrgyz (KY)
- **AI Assistant** (planned): Natural language queries and report generation

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, Django 4.2+, Django REST Framework 3.16+ |
| **Frontend** | React 19, TypeScript, Mantine UI, React Router v7 |
| **Database** | PostgreSQL 16 (prod), SQLite (dev) |
| **Authentication** | JWT (SimpleJWT) |
| **State Management** | TanStack Query (React Query) |
| **Charts** | Recharts |
| **Containerization** | Docker, Docker Compose |

---

## Project Structure

```
Parko/
├── backend/                 # Django REST API
│   ├── accounts/           # User authentication, roles, JWT
│   ├── companies/          # Company/tenant management
│   ├── config/             # Django settings (base.py, dev.py, prod.py)
│   ├── core/               # Shared utilities, mixins, base classes
│   ├── fleet/              # Vehicle & related models (Car, Fuel, Spare, etc.)
│   ├── reports/            # Report generation & export
│   ├── dashboard/          # Dashboard analytics
│   ├── api/                # Legacy/info endpoints
│   ├── users/              # User management
│   ├── manage.py           # Django management script
│   ├── requirements.txt    # Python dependencies
│   ├── docker-compose.yml  # Docker services (web + db)
│   └── .env.example        # Environment variables template
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── app/           # App configuration, routing
│   │   ├── entities/      # Domain entities
│   │   ├── features/      # Feature modules (auth, etc.)
│   │   ├── pages/         # Page components
│   │   ├── shared/        # Shared components, utilities
│   │   ├── widgets/       # Layout widgets
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Node dependencies
│   ├── tsconfig.json      # TypeScript config
│   └── vite.config.ts     # Vite bundler config
│
├── TZ.md                   # Technical specification (detailed requirements)
├── Tasks.md                # Backend task checklist
├── frontTasks.md           # Frontend task checklist
└── README.md               # Project overview (Russian)
```

---

## Building and Running

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   # Copy .env.example to .env and adjust values
   copy .env.example .env  # Windows
   cp .env.example .env    # Linux/Mac
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server:**
   ```bash
   python manage.py runserver
   ```

   API will be available at `http://127.0.0.1:8000/`
   - API docs (Swagger): `http://127.0.0.1:8000/api/docs/`
   - Django admin: `http://127.0.0.1:8000/admin/`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:5173/` (Vite default)

### Docker (Optional)

Run both backend and PostgreSQL using Docker Compose:

```bash
cd backend
docker-compose up --build
```

---

## API Endpoints

Base URL: `/api/v1/`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login/` | JWT login |
| `POST /auth/refresh/` | Refresh token |
| `POST /auth/logout/` | Logout |
| `GET/POST /users/` | User management (Company Admin) |
| `GET/POST /cars/` | Vehicle CRUD |
| `GET/POST /cars/{id}/photos/` | Car photos |
| `GET/POST /cars/{id}/spares/` | Spare parts |
| `GET/POST /cars/{id}/fuel/` | Fuel records |
| `GET/POST /cars/{id}/insurances/` | Insurance records |
| `GET/POST /cars/{id}/inspections/` | Inspection records |
| `GET /reports/fuel-consumption/` | Fuel consumption report |
| `GET /reports/maintenance-costs/` | Maintenance costs report |
| `GET /reports/insurance-inspection/` | Insurance/inspection report |
| `GET /dashboard/` | Dashboard analytics |

---

## Development Conventions

### Backend (Django)

- **Code style**: Follow PEP 8, use `black` or similar formatter
- **Models**: All business models must have `company` FK for multi-tenant isolation
- **Views**: Use `ModelViewSet` with custom permission classes
- **Permissions**: 
  - `IsCompanyAdmin` – full access within company
  - `IsCompanyStaff` – role-based modification rights
  - `IsCompanyGuestReadOnly` – read-only access
- **Filters**: Use `django-filter` for query parameters
- **Serializers**: Separate serializers for list/detail/create operations
- **Error handling**: Use custom exception handler in `core.exceptions`

### Frontend (React + TypeScript)

- **Code style**: ESLint + Prettier (configured in project)
- **Component structure**: Feature-based organization (`pages/`, `features/`, `entities/`)
- **State management**: TanStack Query for server state, no global client state needed for MVP
- **Routing**: Protected routes via `<ProtectedRoute>` wrapper
- **Styling**: Mantine UI components with consistent theme
- **i18n**: `react-i18next` with keys in format `module.page.element`
- **API calls**: Axios with automatic JWT token injection

### Git Workflow

- Main branch: `main` (or `master`)
- Feature branches: `feature/<name>`
- Bug fixes: `fix/<name>`
- Commit messages: Conventional Commits format recommended

---

## Key Architecture Decisions

### Multi-tenant Design
- **Strategy**: Database-level isolation via `company` FK on all business models
- **Enforcement**: Custom permission classes and viewset mixins auto-filter by `request.user.company`
- **Models requiring `company` FK**: `User`, `Car`, and all related entities (`Fuel`, `Spare`, `Insurance`, etc.)

### Authentication Flow
1. User submits credentials to `/api/v1/auth/login/`
2. Server returns `access` (60 min) and `refresh` (1 day) tokens
3. Frontend stores tokens and includes `access` in `Authorization: Bearer` header
4. On 401, frontend can attempt token refresh or redirect to login

### Data Models (Key Entities)

| Model | Description | Key Fields |
|-------|-------------|------------|
| `Company` | Tenant organization | `name`, `slug`, `default_language`, `default_currency` |
| `User` | Custom user model | `username`, `company`, `role`, `language`, `region` |
| `Car` | Vehicle | `company`, `numplate`, `vin`, `brand`, `driver`, `status` |
| `Fuel` | Monthly fuel record | `car`, `year`, `month`, `liters`, `mileage`, `consumption` (auto) |
| `Spare` | Spare part/repair | `car`, `title`, `part_price`, `job_price`, `installed_at` |
| `Insurance` | Insurance policy | `car`, `type`, `number`, `start_date`, `end_date`, `cost` |
| `Inspection` | Technical inspection | `car`, `number`, `inspected_at`, `cost` |

---

## Testing
Always run both backend and frontend after completing the task to ensure it runs
### Backend
```bash
# Run Django tests
python manage.py test

# Run specific app tests
python manage.py test fleet
```

### Frontend
```bash
# Run ESLint
npm run lint

# Run Prettier check
npm run check-format

# Run tests (if configured)
npm test
```

---

## Deployment Notes

### Backend (Production)
- Use `config.settings.prod.py` with PostgreSQL, secure `SECRET_KEY`, `DEBUG=False`
- Run behind Nginx reverse proxy
- Use Gunicorn/Uvicorn as WSGI/ASGI server
- Set proper `ALLOWED_HOSTS` and CORS origins

### Frontend (Production)
- Build static files: `npm run build`
- Serve via Nginx or CDN
- Configure API base URL for production backend

---

## Documentation Files

| File | Description |
|------|-------------|
| `TZ.md` | Detailed technical specification (requirements, architecture, roles) |
| `Tasks.md` | Backend development task checklist with progress tracking |
| `frontTasks.md` | Frontend development tasks |
| `DASHBOARD_IMPLEMENTATION.md` | Dashboard feature documentation |
| `REPORTS_IMPLEMENTATION.md` | Reports feature documentation |
| `usability_test_parko.md` | Usability testing plan |
| `competitors_comparison.txt` | Competitive analysis |
| `filesforai.txt` | Legacy model definitions (reference for AI assistant) |

---

## Future Enhancements (Post-MVP)

- **AI Assistant**: Natural language queries, automated report generation, data manipulation via chat
- **GPS/Telematics integration**: Real-time vehicle tracking
- **1C Integration**: Accounting system sync
- **Fuel card integration**: Automatic fuel data import
- **Push notifications**: Expiring insurance/inspection alerts
- **PDF export**: Additional report format
- **Advanced RBAC**: Fine-grained permissions beyond roles

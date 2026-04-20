# Parko Project Overview

**Parko** is a SaaS fleet management system (Enterprise Resource Planning) designed for companies to track vehicles, fuel consumption, maintenance, insurance, and inspections. It includes an integrated AI assistant for natural language interaction with fleet data.

## 🛠 Tech Stack

### Backend
- **Framework:** Django 4.2+ (Django REST Framework)
- **Database:** PostgreSQL (with Supabase compatibility) / SQLite for local development
- **Authentication:** JWT (SimpleJWT)
- **AI Integration:** Groq API (using Llama-3 models)
- **Reports:** ReportLab (PDF), OpenPyXL (Excel)
- **Containerization:** Docker & Docker Compose

### Frontend
- **Framework:** React 19 (Vite, TypeScript)
- **UI Components:** Mantine UI v8, Tabler Icons
- **Data Fetching:** TanStack Query (React Query) v5
- **Routing:** React Router v7
- **Internationalization:** i18next (supports RU, EN, KY)
- **Charts:** Recharts

## 📁 Project Structure

```text
C:\Parko\
├── backend/            # Django application
│   ├── accounts/       # User profiles, roles (Admin, Dispatcher, Mechanic, Accountant, Guest)
│   ├── ai/             # AI Assistant logic (Groq API, tool calling, streaming)
│   ├── companies/      # Multi-tenant company isolation
│   ├── config/         # Project settings (base, dev, prod)
│   ├── core/           # Common utilities, base models, permissions
│   ├── fleet/          # Core models: Car, Insurance, Inspection, Fuel, Spares, Tires, Accumulator
│   └── reports/        # PDF and Excel generation logic
├── frontend/           # React application
│   ├── src/
│   │   ├── api/        # Axios instances and API services
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # View components (Dashboard, Fleet, AI Chat, etc.)
│   │   └── i18n/       # Localization files
└── .agents/            # Specialized agent instructions for backend, frontend, i18n, etc.
```

## 🚀 Building and Running

### Prerequisites
- Python 3.11+
- Node.js 22+
- PostgreSQL (optional, SQLite by default)

### Backend Setup
1. Navigate to `backend/`
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment:
   - Copy `.env.example` to `.env` and fill in `DJANGO_SECRET_KEY` and `AI_API_KEY`.
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## 🤖 AI Assistant (Parko AI)

The AI assistant is a key feature that allows users to:
- Ask about fleet status ("How many active cars do we have?")
- Generate summaries ("Show fuel consumption for last month.")
- Manage data ("Add a new maintenance record for car `B 123 AA`")
- Get alerts ("Which insurances are expiring soon?")

It uses a **tool-calling** mechanism (`backend/ai/tools.py`) to interact with the database safely, ensuring strict company isolation.

## 📏 Development Conventions

- **Surgical Updates:** Use targeted `replace` calls for code changes.
- **Localization:** All user-facing strings in the frontend must use `t()` from `react-i18next`. Backend error messages should be translatable or use standardized codes.
- **Type Safety:** Maintain strict TypeScript types in the frontend and use Django type hinting where possible.
- **SaaS Isolation:** Every model query *must* filter by `company` to prevent data leakage between tenants.
- **Testing:** Verify changes by running `python manage.py test` (backend) or checking frontend UI behavior.

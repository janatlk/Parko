# 🚀 Supabase Implementation Guide for Parko

## ✅ Completed Setup

The Parko backend has been configured to support both SQLite (local development) and PostgreSQL (Supabase). This guide provides step-by-step instructions for migrating to Supabase.

---

## 📋 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Configure `.env` file
- [ ] Run migrations
- [ ] Import data (optional)
- [ ] Verify Django admin
- [ ] Test API endpoints

---

## Step 1: Create Supabase Project

### 1.1 Sign Up & Create Project

1. Visit [supabase.com](https://supabase.com)
2. Click **Start your project** or **Sign Up**
3. Sign in with GitHub or create account via email
4. Click **New Project**
5. Fill in:
   - **Organization**: Your organization name
   - **Project name**: `parko` (or your preferred name)
   - **Database Password**: ⚠️ **Save this password!** (minimum 6 characters)
   - **Region**: Choose closest region (e.g., `Frankfurt (eu-central-1)` for Europe)
6. Click **Create new project**

⏱️ Wait 2-5 minutes for project setup

### 1.2 Get Database Credentials

1. In left sidebar, click **Settings** (⚙️ icon)
2. Go to **Database** section
3. Find **Connection string**
4. Select **URI** tab
5. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

Extract these values:
- `POSTGRES_HOST`: `db.xxxxx.supabase.co` (without `postgresql://` and port)
- `POSTGRES_PASSWORD`: Your password from project creation
- `POSTGRES_DB`: `postgres`
- `POSTGRES_USER`: `postgres`
- `POSTGRES_PORT`: `5432`

---

## Step 2: Configure Backend

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Update `.env` File

The `.env` file is already created. Update these values:

```env
# Django
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DJANGO_SETTINGS_MODULE=config.settings.dev

# Supabase Database Configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_SUPABASE_PASSWORD_HERE
POSTGRES_HOST=db.YOUR_PROJECT_ID.supabase.co
POSTGRES_PORT=5432

# Hosts
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@parko.com
```

⚠️ **Important**: 
- Replace `YOUR_SUPABASE_PASSWORD_HERE` with actual password
- Replace `YOUR_PROJECT_ID` with your Supabase project ID
- Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` for production

---

## Step 3: Backup Existing Data (SQLite)

If you have existing data in SQLite:

```bash
cd backend
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude auth.permission \
    --exclude contenttypes \
    --format json \
    --indent 2 \
    -o backup_sqlite.json
```

✅ **Result**: `backup_sqlite.json` file with all your data

---

## Step 4: Run Migrations on Supabase

Apply Django migrations to Supabase PostgreSQL:

```bash
cd backend
python manage.py migrate
```

**Expected output:**
```
Operations to perform:
  Apply all migrations: accounts, admin, auth, companies, fleet, reports
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
```

---

## Step 5: Import Data to Supabase

### Option A: Using loaddata (Recommended)

```bash
cd backend
python manage.py loaddata backup_sqlite.json
```

### Option B: Using Migration Script

```bash
cd backend
python migrate_to_supabase.py
```

### Option C: Create Test Data

If starting fresh:

```bash
cd backend
python create_test_data.py
```

This creates:
- 1 Company
- 5 Users (admin, dispatcher, mechanic, driver, accountant)
- 5 Cars
- 9 Fuel records
- 2 Insurances
- 2 Inspections
- 6 Spare parts records

**Default credentials:**
- Username: `admin`
- Password: `parko123`

---

## Step 6: Verify Setup

### 6.1 Test Database Connection

```bash
cd backend
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()
print(f"Total users: {User.objects.count()}")
print(f"Database: {User.objects.db}")
```

**Expected:** User count > 0, Database: `default`

### 6.2 Create Superuser (if needed)

```bash
python manage.py createsuperuser
```

Enter:
- Username: `admin`
- Email: `admin@parko.com`
- Password: (your secure password)

### 6.3 Test Django Admin

1. Start development server:
   ```bash
   python manage.py runserver
   ```

2. Open browser: `http://127.0.0.1:8000/admin/`

3. Login with superuser credentials

4. Verify you can see:
   - ✅ Users
   - ✅ Companies
   - ✅ Cars
   - ✅ Fuel records
   - ✅ Insurances
   - ✅ Inspections
   - ✅ Spare parts

### 6.4 Test API Endpoints

1. Open Swagger docs: `http://127.0.0.1:8000/api/docs/`

2. Test these endpoints:
   - `GET /api/v1/cars/` - List all cars
   - `GET /api/v1/users/` - List all users
   - `GET /api/v1/dashboard/` - Dashboard analytics
   - `POST /api/v1/auth/login/` - User login

---

## Step 7: Run Tests

```bash
cd backend
python manage.py test
```

**Note**: Currently no tests exist in the project. Tests will be added in future updates.

---

## 🔧 Configuration Files Modified

### 1. `backend/.env`
- Added Supabase database credentials
- Configured for easy switch between SQLite and PostgreSQL

### 2. `backend/config/settings/dev.py`
- Updated DATABASES to support both SQLite and PostgreSQL
- Auto-detects based on `POSTGRES_HOST` presence
- Added connection pooling settings for production

### 3. `backend/.env.example`
- Updated with Supabase configuration template
- Added comments for guidance

### 4. `backend/fleet/admin.py`
- Added admin registration for Fuel, Insurance, Inspection models

---

## 🛠️ Troubleshooting

### Error: "could not translate host name"

**Cause:** Invalid `POSTGRES_HOST`

**Solution:**
- Ensure HOST is formatted as: `db.xxxxx.supabase.co`
- Do NOT include `postgresql://` or port number

### Error: "password authentication failed"

**Cause:** Wrong Supabase password

**Solution:**
1. Check password in `backend/.env`
2. In Supabase Dashboard: **Settings > Database > Reset Password**
3. Update `.env` and restart server

### Error: "database is locked"

**Cause:** SQLite write lock during migration

**Solution:**
```bash
# Kill all Python processes
taskkill /F /IM python.exe  # Windows

# Delete SQLite file
del db.sqlite3  # Windows
```

### Error: "relation already exists"

**Cause:** Migrations already applied

**Solution:**
```bash
python manage.py migrate --fake-initial
```

---

## 📊 Supabase Dashboard Features

### Monitor Your Database

1. **Dashboard > Database**: View DB usage, queries, connections
2. **Settings > Database**: Connection limits, database size
3. **Logs**: SQL logs and errors
4. **Table Editor**: View and edit data directly

### Connection Pooling (Production)

For production environments:

1. Go to **Settings > Database > Connection Pooling**
2. Enable **Transaction Mode**
3. Copy pooler connection string
4. Update `.env`:
   ```env
   POSTGRES_HOST=aws-0-region.pooler.supabase.co
   POSTGRES_PORT=5432
   ```

### Automatic Backups

Supabase automatically backs up your data daily. Manual backup:

```bash
# Export all data
python manage.py dumpdata --format json --indent 2 -o backup.json

# Export specific model
python manage.py dumpdata fleet.Car --format json --indent 2 -o cars_backup.json
```

---

## 🌐 Production Deployment

### Environment Variables for Production

```env
DJANGO_SECRET_KEY=<long-random-string>
DJANGO_SETTINGS_MODULE=config.settings.prod

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_HOST=db.your-project-id.supabase.co
POSTGRES_PORT=5432

ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com

DEBUG=False
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Security Checklist

- [ ] `DEBUG = False`
- [ ] Strong `SECRET_KEY`
- [ ] Proper `ALLOWED_HOSTS`
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Database password secured

---

## 📁 Files Created for Supabase

| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables (Supabase config) |
| `backend/migrate_to_supabase.py` | Migration helper script |
| `backend/create_test_data.py` | Test data generator |
| `backend/backup_sqlite.json` | SQLite data backup |
| `SUPABASE_MIGRATION_GUIDE.md` | Detailed migration guide (Russian) |
| `SUPABASE_IMPLEMENTATION.md` | This file (English) |

---

## 🔄 Rollback to SQLite

If you need to switch back to SQLite:

1. Edit `backend/.env`:
   ```env
   # Comment out PostgreSQL settings
   # POSTGRES_DB=postgres
   # POSTGRES_USER=postgres
   # POSTGRES_PASSWORD=...
   # POSTGRES_HOST=...
   ```

2. Apply migrations to SQLite:
   ```bash
   python manage.py migrate
   ```

3. Import data from backup:
   ```bash
   python manage.py loaddata backup_sqlite.json
   ```

---

## 📞 Support & Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Django Docs**: [docs.djangoproject.com](https://docs.djangoproject.com)
- **Parko Documentation**: `TZ.md`, `README.md`, `SUPABASE_MIGRATION_GUIDE.md`

---

## ✅ Verification Checklist

After completing migration, verify:

- [ ] Supabase project created
- [ ] `.env` configured with correct credentials
- [ ] Migrations applied successfully
- [ ] Data imported (if applicable)
- [ ] Django admin accessible at `/admin/`
- [ ] All models visible in admin
- [ ] API endpoints responding
- [ ] Frontend can connect to backend
- [ ] Database shows data in Supabase Dashboard

---

**🎉 Congratulations!** Parko is now running on Supabase PostgreSQL!

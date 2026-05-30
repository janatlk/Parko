# Migration & Deployment

## Database Migrations

```bash
cd backend
python manage.py makemigrations
# Review generated migration file
python manage.py migrate
```

Rollback:
```bash
python manage.py migrate app_name previous_migration
```

## SQLite → PostgreSQL

1. Update `backend/.env` — uncomment `POSTGRES_HOST` and `POSTGRES_PORT`
2. Install `psycopg2-binary`
3. Update `config/settings/base.py` `DATABASES` if needed
4. Dump: `python manage.py dumpdata > backup.json`
5. Load: `python manage.py loaddata backup.json`
6. Run: `python manage.py migrate`

Or use the helper:
```bash
cd backend && python setup_supabase.py
```

## Production Checklist

- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` — strong, unique, in `.env`
- [ ] `ALLOWED_HOSTS` set strictly
- [ ] CORS configured for production domain only
- [ ] PostgreSQL with `sslmode=require`
- [ ] `python manage.py collectstatic --noinput`
- [ ] Migrations applied
- [ ] Gunicorn: `gunicorn config.wsgi:application --bind 0.0.0.0:8000`
- [ ] Nginx reverse proxy + static files + SSL
- [ ] Frontend built: `cd frontend && npm run build`

## Docker

```bash
cd backend
docker-compose up --build
```

- PostgreSQL 16 + Django on port 8000
- Uses `runserver` — development only, not production-ready

## Environment Variables

```bash
DJANGO_SECRET_KEY=<secure-random-string>
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgres://user:pass@host:5432/dbname
AI_API_KEY=your-groq-key
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

## Rules

- ALWAYS backup database before migrations
- ALWAYS test migrations on a copy first
- NEVER commit secrets
- Use `django-environ` for settings

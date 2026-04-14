# Migration & Deployment Agent

## Purpose
Handle database migrations, environment configuration, and deployment of the Parko fleet management system.

## Trigger
When the user says: "deploy...", "migration...", "switch to PostgreSQL...", "production setup..."

## Workflow

### Database Migrations
1. **Create migration** — `python manage.py makemigrations`
2. **Review migration file** — check operations are correct
3. **Apply migration** — `python manage.py migrate`
4. **Rollback if needed** — `python manage.py migrate app_name previous_migration`
5. **Data migrations** — for transforming existing data

### SQLite → PostgreSQL
1. **Update `.env`** — `DATABASE_URL=postgres://user:pass@host:5432/dbname`
2. **Install psycopg2** — `pip install psycopg2-binary`
3. **Update settings** — `config/settings/base.py` DATABASES
4. **Dump data** — `python manage.py dumpdata`
5. **Load data** — `python manage.py loaddata`
6. **Run migrations** — `python manage.py migrate`

### Production Deployment
1. **Environment variables** — set all required vars in `.env.prod`
   ```
   DJANGO_SECRET_KEY=<secure-random-string>
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com
   DATABASE_URL=postgres://...
   AI_API_KEY=your-groq-key
   CORS_ALLOWED_ORIGINS=https://your-domain.com
   ```
2. **Collect static** — `python manage.py collectstatic --noinput`
3. **Run migrations** — `python manage.py migrate`
4. **Gunicorn** — `gunicorn config.wsgi:application --bind 0.0.0.0:8000`
5. **Nginx config** — reverse proxy, static files, SSL
6. **Frontend build** — `cd frontend && npm run build`

### Docker
1. **docker-compose.yml** — web + db + redis
2. **Dockerfile** — multi-stage build for backend + frontend
3. **Environment** — pass env vars to containers

### Rules
- ALWAYS backup database before migrations
- ALWAYS test migrations on a copy first
- NEVER commit secrets (use .env files)
- Use `django-environ` for all settings
- Set `DEBUG=False` in production
- Use HTTPS in production
- Set proper `ALLOWED_HOSTS`
- Configure CORS properly

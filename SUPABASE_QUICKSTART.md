# 🎯 Краткая инструкция по миграции на Supabase

## Быстрый старт (5 минут)

### 1. Создать проект Supabase

1. Перейти на [supabase.com](https://supabase.com)
2. Нажать **New Project**
3. Заполнить:
   - Project name: `parko`
   - Database Password: **запомнить!**
   - Region: ближайший к вам
4. Подождать 2-5 минут

### 2. Получить credentials

1. **Settings > Database > Connection string**
2. Копировать URI: `postgresql://postgres:[PASS]@db.xxx.supabase.co:5432/postgres`
3. Извлечь:
   - `POSTGRES_HOST`: `db.xxx.supabase.co`
   - `POSTGRES_PASSWORD`: ваш пароль
   - `POSTGRES_DB`: `postgres`
   - `POSTGRES_USER`: `postgres`

### 3. Настроить .env

Открыть `backend/.env` и заполнить:

```env
POSTGRES_PASSWORD=ВАШ_ПАРОЛЬ
POSTGRES_HOST=db.ВАШ_PROJECT_ID.supabase.co
```

### 4. Применить миграции

```bash
cd backend
python manage.py migrate
```

### 5. Создать тестовые данные (опционально)

```bash
python create_test_data.py
```

Будет создано:
- 5 пользователей (пароль: `parko123`)
- 5 автомобилей
- 9 записей топлива
- 2 страховки
- 2 техосмотра
- 6 запчастей

### 6. Проверить Django Admin

```bash
python manage.py runserver
```

Открыть: `http://127.0.0.1:8000/admin/`

Логин: `admin`, Пароль: `parko123`

---

## 📁 Созданные файлы

| Файл | Описание |
|------|----------|
| `backend/.env` | Конфигурация Supabase |
| `backend/migrate_to_supabase.py` | Скрипт миграции |
| `backend/create_test_data.py` | Генератор тестовых данных |
| `backend/backup_sqlite.json` | Резервная копия SQLite |
| `SUPABASE_MIGRATION_GUIDE.md` | Подробная инструкция (RU) |
| `SUPABASE_IMPLEMENTATION.md` | Implementation guide (EN) |
| `SUPABASE_QUICKSTART.md` | Этот файл |

---

## 🔧 Изменения в коде

### `backend/config/settings/dev.py`

Автоматическое переключение между SQLite и PostgreSQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql' if env.str('POSTGRES_HOST', default='') else 'django.db.backends.sqlite3',
        # ...
    }
}
```

### `backend/fleet/admin.py`

Добавлены модели в admin:
- `FuelAdmin`
- `InsuranceAdmin`
- `InspectionAdmin`

---

## ✅ Проверка

```bash
# Проверка подключения
python manage.py check

# Проверка данных
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(f'Users: {User.objects.count()}')"
```

---

## 🐛 Частые ошибки

### "could not translate host name"
- Проверьте `POSTGRES_HOST` в `.env`
- Формат: `db.xxx.supabase.co` (без `postgresql://`)

### "password authentication failed"
- Проверьте пароль в `.env`
- Сбросьте в Supabase: **Settings > Database > Reset Password**

### "relation already exists"
```bash
python manage.py migrate --fake-initial
```

---

## 📊 Мониторинг в Supabase Dashboard

- **Dashboard > Database**: использование БД, запросы
- **Settings > Database**: лимиты, размер БД
- **Logs**: SQL логи и ошибки
- **Table Editor**: просмотр данных

---

## 🔄 Откат на SQLite

1. Закомментировать `POSTGRES_HOST` в `.env`
2. `python manage.py migrate`
3. `python manage.py loaddata backup_sqlite.json`

---

## 📞 Поддержка

- Документация Supabase: [supabase.com/docs](https://supabase.com/docs)
- Parko Docs: `TZ.md`, `README.md`
- Подробная инструкция: `SUPABASE_MIGRATION_GUIDE.md`

---

**✅ Готово!** Parko работает на Supabase PostgreSQL!

# 🚀 Parko - Настройка Supabase и вход в систему

## ✅ Быстрое решение проблемы с логином

### Проблема решена! 

Логин теперь работает. Используйте:
- **Username:** `admin`
- **Password:** `admin123`

---

## 📋 Два режима работы

### Режим 1: SQLite (локальная разработка) ✅

**По умолчанию включено.** Все данные хранятся в `backend/db.sqlite3`.

**Преимущества:**
- Работает без интернета
- Быстрая разработка
- Не нужно настраивать подключение

**Запуск:**
```bash
cd backend
python manage.py runserver
```

**Логин:** `admin` / `admin123`

---

### Режим 2: Supabase PostgreSQL (продакшен)

**Требуется подключение к интернету.** Данные в облаке Supabase.

**Преимущества:**
- Облачное хранение
- Доступ с любого сервера
- Автоматические бэкапы
- Масштабируемость

**Настройка:**

1. **Откройте `backend/.env`**

2. **Раскомментируйте строки** (удалите `# `):
   ```env
   # Было:
   # POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
   # POSTGRES_PORT=5432
   
   # Стало:
   POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
   POSTGRES_PORT=5432
   ```

3. **Примените миграции:**
   ```bash
   cd backend
   python manage.py migrate
   ```

4. **Создайте суперпользователя:**
   ```bash
   python manage.py createsuperuser
   ```
   - Username: `admin`
   - Email: `admin@parko.com`
   - Password: `admin123`

5. **Перезапустите сервер** (Ctrl+C, затем `python manage.py runserver`)

---

## 🔄 Переключение между режимами

### Автоматический скрипт

```bash
cd backend
python setup_supabase.py
```

Скрипт предложит:
- Включить Supabase
- Или выключить (остаться на SQLite)

### Вручную

**Включить Supabase:**
- Откройте `backend/.env`
- Удалите `# ` перед `POSTGRES_HOST` и `POSTGRES_PORT`
- Перезапустите сервер

**Выключить Supabase:**
- Откройте `backend/.env`
- Добавьте `# ` перед `POSTGRES_HOST` и `POSTGRES_PORT`
- Перезапустите сервер

---

## 🔐 Учётные данные

### Для входа в систему (Login page)

| Пользователь | Пароль | Роль |
|-------------|--------|------|
| `admin` | `admin123` | COMPANY_ADMIN |
| `dispatcher` | `parko123` | dispatcher |
| `mechanic` | `parko123` | mechanic |
| `driver1` | `parko123` | driver |
| `accountant` | `parko123` | accountant |

### Django Admin

- **URL:** http://127.0.0.1:8000/admin/
- **Username:** `admin`
- **Password:** `admin123`

### Supabase Dashboard

- **URL:** https://supabase.com/dashboard/project/vulnzaoagtxzpayyjjct
- **Login:** Ваш email при регистрации
- **Password:** `NwC1e3oj09s4nrLs` (или который вы установили)

---

## 🎯 Проверка работы

### 1. Проверка логина

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Ожидаемый ответ:**
```json
{
  "data": {
    "refresh": "eyJhbGc...",
    "access": "eyJhbGc...",
    "user": {
      "username": "admin",
      "role": "COMPANY_ADMIN"
    }
  },
  "status": "success"
}
```

### 2. Проверка подключения к БД

```bash
cd backend
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
print(f'Users: {User.objects.count()}')
print(f'Database: {User.objects.db}')
"
```

**Ожидаемый ответ:**
```
Users: 5
Database: default
```

### 3. Проверка формы обратной связи

```bash
curl -X POST http://127.0.0.1:8000/api/v1/feedback/ \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Тест\",\"email\":\"test@test.com\",\"message\":\"Проверка\"}"
```

**Ожидаемый ответ:**
```json
{
  "data": {
    "message": "Сообщение успешно отправлено",
    "id": 1
  },
  "status": "success"
}
```

---

## 🐛 Решение проблем

### "Не найдено активной учетной записи"

**Причина:** Неверный пароль или пользователь не активен

**Решение:**
```bash
cd backend
python manage.py shell

# Сброс пароля для admin
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.filter(username='admin').first()
admin.set_password('admin123')
admin.save()
```

### "Connection timed out" (Supabase)

**Причина:** Брандмауэр блокирует порт 5432

**Решение 1:** Использовать SQLite (для разработки)
```env
# POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co
# POSTGRES_PORT=5432
```

**Решение 2:** Использовать Connection Pooler
```env
POSTGRES_HOST=aws-0-<REGION>.pooler.supabase.co
POSTGRES_PORT=6543
```

### "could not translate host name"

**Причина:** DNS не резолвит хост

**Решение:** Использовать IP адрес
```bash
nslookup db.vulnzaoagtxzpayyjjct.supabase.co
# Скопируйте IP (например, 104.18.38.10)
```

```env
POSTGRES_HOST=104.18.38.10
```

---

## 📁 Файлы для настройки

| Файл | Описание |
|------|----------|
| `backend/.env` | Главный конфиг (тут настраивается БД) |
| `backend/setup_supabase.py` | Скрипт переключения БД |
| `backend/manage.py` | Django management (миграции, createsuperuser) |
| `SUPABASE_SETUP_INSTRUCTION.md` | Подробная инструкция |

---

## 🎨 Лендинг

- **URL:** http://localhost:5173/
- **Дизайн:** OLED Minimalist (чёрный фон, белые акценты)
- **Форма обратной связи:** Работает, сохраняет в БД

**Секции лендинга:**
1. Hero (главный экран с CTA)
2. Features (4 карточки)
3. Benefits (4 преимущества)
4. About (3 карточки с фото)
5. Pricing (3 тарифа)
6. Contact (форма + контакты)
7. Footer

---

## ✅ Чек-лист запуска

### Для локальной разработки (SQLite):

- [ ] `cd backend`
- [ ] `python manage.py runserver`
- [ ] Открыть http://localhost:5173/
- [ ] Логин: `admin` / `admin123`

### Для продакшена (Supabase):

- [ ] Раскомментировать `POSTGRES_HOST` в `.env`
- [ ] `python manage.py migrate`
- [ ] `python manage.py createsuperuser`
- [ ] `python manage.py runserver`
- [ ] Проверить в Supabase Dashboard

---

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте `.env` файл
2. Запустите `python setup_supabase.py`
3. Посмотрите `SUPABASE_SETUP_INSTRUCTION.md`
4. Проверьте логи Django

---

**🎉 Всё готово к работе!**

# Backend (Django REST Framework)

## Установка

1. Установите виртуальное окружение (рекомендуется) и активируйте его.
2. Установите зависимости:

```bash
pip install -r requirements.txt
```

3. Выполните миграции базы данных:

```bash
python manage.py migrate
```

4. Запустите сервер разработки:

```bash
python manage.py runserver
```

## Базовый endpoint

После запуска сервера базовый endpoint будет доступен по адресу:

`http://127.0.0.1:8000/api/info/`

Пример ответа:

```json
{
  "name": "Parko API",
  "version": "1.0.0",
  "description": "Базовый API на Django REST Framework.",
  "author": "Developer"
}
```

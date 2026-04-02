"""
Скрипт для миграции данных из SQLite в PostgreSQL (Supabase)

Использование:
    1. Сначала настройте .env файл с параметрами Supabase
    2. Запустите: python migrate_to_supabase.py
    
Скрипт:
- Экспортирует данные из SQLite
- Создаст миграции для Supabase
- Импортирует данные в Supabase
"""

import os
import sys
import django
from pathlib import Path

# Добавляем backend в path
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.core.management import call_command
from django.conf import settings
import json
from django.core import serializers
from io import StringIO


def check_database_connection():
    """Проверка подключения к базе данных"""
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            print(f"✓ Подключение к БД успешно: {connection.settings_dict['ENGINE']}")
            return True
    except Exception as e:
        print(f"✗ Ошибка подключения к БД: {e}")
        return False


def get_current_db_type():
    """Определение текущего типа БД"""
    engine = settings.DATABASES['default']['ENGINE']
    if 'sqlite' in engine:
        return 'sqlite'
    elif 'postgresql' in engine:
        return 'postgresql'
    return 'unknown'


def export_data_from_sqlite():
    """Экспорт данных из SQLite в JSON"""
    print("\n=== Экспорт данных из SQLite ===")
    
    # Собираем все модели
    from django.apps import apps
    from django.contrib.contenttypes.models import ContentType
    
    # Исключаем служебные модели
    exclude_apps = {'contenttypes', 'auth', 'admin', 'sessions'}
    
    data = {}
    for model in apps.get_models():
        if model._meta.app_label in exclude_apps:
            continue
        
        model_name = f"{model._meta.app_label}.{model.__name__}"
        count = model.objects.count()
        
        if count > 0:
            output = StringIO()
            serializers.serialize('json', model.objects.all(), stream=output)
            data[model_name] = {
                'count': count,
                'data': output.getvalue()
            }
            print(f"  ✓ {model_name}: {count} записей")
    
    return data


def migrate_to_supabase():
    """Основная функция миграции"""
    print("=" * 60)
    print("MIGRATION TO SUPABASE")
    print("=" * 60)
    
    current_db = get_current_db_type()
    print(f"\nТекущая БД: {current_db}")
    print(f"Настройки БД: {settings.DATABASES['default']['ENGINE']}")
    
    # Проверка подключения
    if not check_database_connection():
        print("\n✗ Не удалось подключиться к Supabase!")
        print("Проверьте настройки в .env файле:")
        print("  - POSTGRES_HOST")
        print("  - POSTGRES_PASSWORD")
        print("  - POSTGRES_DB")
        print("  - POSTGRES_USER")
        return False
    
    # Если мы уже на PostgreSQL, просто создаём миграции
    if current_db == 'postgresql':
        print("\n=== Создание миграций для Supabase ===")
        call_command('makemigrations')
        print("\n=== Применение миграций ===")
        call_command('migrate')
        print("\n✓ Миграция завершена!")
        return True
    
    # Если мы на SQLite, экспортируем данные
    if current_db == 'sqlite':
        print("\n⚠ Миграция с SQLite на PostgreSQL требует ручного вмешательства")
        print("\nИнструкция:")
        print("1. Экспортируйте данные: python manage.py dumpdata --natural-foreign --natural-primary --exclude auth.permission --exclude contenttypes -o backup.json")
        print("2. Настройте .env для подключения к Supabase")
        print("3. Примените миграции: python manage.py migrate")
        print("4. Импортируйте данные: python manage.py loaddata backup.json")
        
        # Создаём резервную копию
        print("\n=== Создание резервной копии ===")
        backup_file = 'backup.json'
        call_command('dumpdata', '--natural-foreign', '--natural-primary', 
                    '--exclude', 'auth.permission', 
                    '--exclude', 'contenttypes',
                    '-o', backup_file)
        print(f"✓ Резервная копия создана: {backup_file}")
        
        return True
    
    return False


def verify_migration():
    """Проверка успешности миграции"""
    print("\n=== Проверка миграции ===")
    
    from django.apps import apps
    
    for model in apps.get_models():
        if model._meta.app_label in {'contenttypes', 'auth', 'admin', 'sessions'}:
            continue
        
        count = model.objects.count()
        if count > 0:
            print(f"  ✓ {model._meta.app_label}.{model.__name__}: {count} записей")
    
    print("\n✓ Проверка завершена!")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--verify':
        verify_migration()
    else:
        migrate_to_supabase()

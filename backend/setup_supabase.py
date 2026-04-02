#!/usr/bin/env python
"""
Скрипт для быстрой настройки подключения к Supabase

Использование:
    python setup_supabase.py
    
Скрипт:
1. Проверит текущее подключение
2. Предложит включить Supabase
3. Применит миграции
4. Создаст суперпользователя
"""

import os
import sys
from pathlib import Path

# Добавляем backend в path
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

import django
django.setup()

from django.core.management import call_command
from django.conf import settings


def print_header(text):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def check_current_db():
    """Проверка текущей базы данных"""
    engine = settings.DATABASES['default']['ENGINE']
    host = settings.DATABASES['default'].get('HOST', '')
    
    if 'postgresql' in engine and host:
        return 'supabase'
    elif 'sqlite' in engine:
        return 'sqlite'
    else:
        return 'unknown'


def read_env_file():
    """Чтение .env файла"""
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        return None
    
    with open(env_path, 'r', encoding='utf-8') as f:
        return f.read()


def update_env_file(enable_supabase):
    """Обновление .env файла"""
    env_path = Path(__file__).parent / '.env'
    content = read_env_file()
    
    if not content:
        print("❌ .env файл не найден!")
        return False
    
    if enable_supabase:
        # Раскомментировать строки
        content = content.replace(
            '# POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co',
            'POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co'
        )
        content = content.replace(
            '# POSTGRES_PORT=5432',
            'POSTGRES_PORT=5432'
        )
        print("✅ Supabase подключение ВКЛЮЧЕНО")
    else:
        # Закомментировать строки
        content = content.replace(
            'POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co',
            '# POSTGRES_HOST=db.vulnzaoagtxzpayyjjct.supabase.co'
        )
        content = content.replace(
            'POSTGRES_PORT=5432',
            '# POSTGRES_PORT=5432'
        )
        print("✅ Supabase подключение ВЫКЛЮЧЕНО (используется SQLite)")
    
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True


def main():
    print_header("SUPABASE SETUP SCRIPT")
    
    current_db = check_current_db()
    print(f"Текущая БД: {current_db.upper()}")
    
    if current_db == 'sqlite':
        print("\n📌 Сейчас используется локальная SQLite база данных.")
        print("\nХотите подключить Supabase PostgreSQL?")
        print("  1 - Да, подключить Supabase")
        print("  2 - Нет, оставить SQLite")
        
        choice = input("\nВаш выбор (1/2): ").strip()
        
        if choice == '1':
            if not update_env_file(True):
                print("❌ Ошибка обновления .env файла!")
                return
            
            print("\n✅ .env файл обновлён!")
            print("\n⚠️  Теперь выполните команды вручную:")
            print("   1. Перезапустите сервер (Ctrl+C, затем python manage.py runserver)")
            print("   2. Примените миграции: python manage.py migrate")
            print("   3. Создайте суперпользователя: python manage.py createsuperuser")
            
        else:
            print("\n✅ Оставлена SQLite база данных")
            print("   Для работы просто запустите: python manage.py runserver")
    
    elif current_db == 'supabase':
        print("\n✅ Supabase уже подключен!")
        
        # Проверка подключения
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            print("✅ Подключение к Supabase работает!")
        except Exception as e:
            print(f"❌ Ошибка подключения к Supabase: {e}")
            print("\nПопробуйте:")
            print("  1. Проверьте интернет-соединение")
            print("  2. Проверьте правильность POSTGRES_HOST в .env")
            print("  3. Используйте Connection Pooler (порт 6543)")
        
        print("\n📌 Для переключения на SQLite:")
        print("   Запустите этот скрипт ещё раз и выберите вариант 2")
    
    else:
        print("❌ Неизвестная конфигурация БД")
        print("Проверьте настройки в .env файле")
    
    print_header("SETUP COMPLETE")


if __name__ == '__main__':
    main()

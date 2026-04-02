#!/usr/bin/env python
"""
Скрипт для создания компании и привязки пользователей
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

import django
django.setup()

from django.contrib.auth import get_user_model
from companies.models import Company

User = get_user_model()

print("=" * 60)
print("FIX: Создание компании и привязка пользователей")
print("=" * 60)

# Создаём компанию
company, created = Company.objects.get_or_create(
    slug='default-company',
    defaults={'name': 'Default Company'}
)
print(f"\n✅ Компания: {company.name} (создана: {created})")

# Привязываем admin к компании
admin = User.objects.filter(username='admin').first()
if admin:
    admin.company = company
    admin.save(update_fields=['company'])
    print(f"✅ Пользователь {admin.username} привязан к компании")
else:
    print("❌ Пользователь admin не найден")

# Привязываем всех пользователей без компании
count = 0
for user in User.objects.filter(company__isnull=True):
    user.company = company
    user.save(update_fields=['company'])
    print(f"✅ Updated: {user.username}")
    count += 1

print(f"\n📊 Итого обновлено: {count} пользователей")
print("=" * 60)
print("✅ FIX завершён! Теперь API должен работать.")
print("=" * 60)

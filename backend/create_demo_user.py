from django.contrib.auth import get_user_model
from companies.models import Company

User = get_user_model()

# Create or get demo company
company, created = Company.objects.get_or_create(
    name='Demo Company',
    defaults={'inn': '1234567890'}
)
print(f"Company: {company.name} ({'created' if created else 'exists'})")

# Check if demo user exists
demo = User.objects.filter(username='demo').first()

if demo:
    # Update existing user
    demo.set_password('demo')
    demo.email = 'demo@parko.demo'
    demo.company = company
    demo.language = 'ru'
    demo.role = 'admin'
    demo.save()
    print(f"✅ Updated demo user: {demo.username}")
else:
    # Create new demo user
    demo = User.objects.create_user(
        username='demo',
        password='demo',
        email='demo@parko.demo',
        company=company,
        language='ru',
        role='admin'
    )
    print(f"✅ Created demo user: {demo.username}")

print(f"Demo credentials: username=demo, password=demo")
print(f"Company: {demo.company.name}")
print(f"Role: {demo.role}")

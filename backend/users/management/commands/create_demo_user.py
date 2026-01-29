"""Create or reset demo user for testing"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from companies.models import Company


class Command(BaseCommand):
    help = 'Create or reset demo user with demo/demo credentials'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Check if demo user exists
        demo = User.objects.filter(username='demo').first()
        
        if not demo:
            # Create demo company first
            company, created = Company.objects.get_or_create(
                name='Demo Company',
                defaults={'inn': '1234567890'}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created demo company: {company.name}'))
            
            # Create demo user
            demo = User.objects.create_user(
                username='demo',
                password='demo',
                email='demo@parko.demo',
                company=company,
                language='ru',
                role='admin'  # Give admin role for full access
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Created demo user: {demo.username}'))
        else:
            # Reset password
            demo.set_password('demo')
            demo.language = 'ru'
            demo.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Reset password for demo user: {demo.username}'))
        
        self.stdout.write(self.style.SUCCESS(f'Demo user company: {demo.company.name}'))
        self.stdout.write(self.style.SUCCESS('Demo credentials: username=demo, password=demo'))

from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager

# Create your models here.


class LanguageChoices(models.TextChoices):
    RU = "ru", "Русский"
    EN = "en", "English"
    KY = "ky", "Кыргызча"


class ThemeChoices(models.TextChoices):
    LIGHT = "light", "Light"
    DARK = "dark", "Dark"
    SYSTEM = "system", "System (auto)"


class RegionChoices(models.TextChoices):
    UNKNOWN = "unknown", "Unknown"
    BISHKEK = "bishkek", "Бишкек"
    OSH = "osh", "Ош"
    JALAL_ABAD = "jalal_abad", "Джалал-Абад"
    NARYN = "naryn", "Нарын"
    TALAS = "talas", "Талас"
    CHUY = "chuy", "Чуйская область"
    ISSYK_KUL = "issyk_kul", "Иссык-Кульская область"
    BATKEN = "batken", "Баткен"
    MOSCOW = "moscow", "Москва"
    ALMATY = "almaty", "Алматы"
    OTHER = "other", "Другой"


class UserRole(models.TextChoices):
    COMPANY_ADMIN = "COMPANY_ADMIN", "Company admin"
    DISPATCHER = "DISPATCHER", "Dispatcher"
    MECHANIC = "MECHANIC", "Mechanic"
    DRIVER = "DRIVER", "Driver"
    ACCOUNTANT = "ACCOUNTANT", "Accountant"
    GUEST = "GUEST", "Guest"


class UserManager(DjangoUserManager):
    def for_company(self, company):
        return self.get_queryset().filter(company=company)


class User(AbstractUser):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
    )
    region = models.CharField(
        max_length=50,
        choices=RegionChoices.choices,
        default=RegionChoices.UNKNOWN,
        blank=True,
    )
    role = models.CharField(
        max_length=32,
        choices=UserRole.choices,
        default=UserRole.COMPANY_ADMIN,
    )
    language = models.CharField(
        max_length=2,
        choices=LanguageChoices.choices,
        default=LanguageChoices.RU,
    )
    theme = models.CharField(
        max_length=10,
        choices=ThemeChoices.choices,
        default=ThemeChoices.SYSTEM,
        help_text='Theme preference for UI'
    )
    currency = models.CharField(
        max_length=3,
        choices=[
            ('KGS', 'Киргизский сом (KGS)'),
            ('USD', 'Доллар США (USD)'),
            ('EUR', 'Евро (EUR)'),
            ('RUB', 'Российский рубль (RUB)'),
        ],
        default='KGS',
        help_text='Валюта для отображения цен'
    )
    email_api_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='Email service API key (SendGrid, Mailgun, etc.)'
    )
    email_service = models.CharField(
        max_length=50,
        choices=[
            ('sendgrid', 'SendGrid'),
            ('mailgun', 'Mailgun'),
            ('smtp', 'SMTP'),
        ],
        default='sendgrid',
        help_text='Email service provider'
    )

    objects = UserManager()


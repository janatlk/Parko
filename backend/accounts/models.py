from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager

# Create your models here.


class LanguageChoices(models.TextChoices):
    RU = "ru", "Русский"
    EN = "en", "English"
    KY = "ky", "Кыргызча"


class RegionChoices(models.TextChoices):
    UNKNOWN = "unknown", "Unknown"


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

    objects = UserManager()


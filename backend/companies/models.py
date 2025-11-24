from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Company(models.Model):
    """
    Модель компании (арендатора) для multi-tenant архитектуры.
    """
    
    CURRENCY_CHOICES = [
        ('KGS', 'Киргизский сом'),
        ('USD', 'Доллар США'),
        ('EUR', 'Евро'),
        ('RUB', 'Российский рубль'),
    ]
    
    LANGUAGE_CHOICES = [
        ('ru', 'Русский'),
        ('en', 'English'),
        ('ky', 'Кыргызча'),
    ]
    
    name = models.CharField(
        max_length=255,
        verbose_name='Название компании',
        help_text='Полное название компании'
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        verbose_name='Слаг',
        help_text='Уникальный идентификатор компании для URL'
    )
    country = models.CharField(
        max_length=100,
        default='Кыргызстан',
        verbose_name='Страна',
        help_text='Страна регистрации компании'
    )
    timezone = models.CharField(
        max_length=50,
        default='Asia/Bishkek',
        verbose_name='Часовой пояс',
        help_text='Часовой пояс компании'
    )
    default_language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='ru',
        verbose_name='Язык по умолчанию',
        help_text='Язык интерфейса по умолчанию для компании'
    )
    default_currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='KGS',
        verbose_name='Валюта по умолчанию',
        help_text='Валюта для финансовых операций'
    )
    
    # Реквизиты компании (опционально)
    legal_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Юридическое название',
        help_text='Полное юридическое название компании'
    )
    inn = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='ИНН',
        help_text='Идентификационный номер налогоплательщика'
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Юридический адрес',
        help_text='Полный юридический адрес компании'
    )
    phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Телефон',
        help_text='Контактный телефон компании'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email',
        help_text='Контактный email компании'
    )
    
    # Служебные поля
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_companies',
        verbose_name='Создано пользователем',
        help_text='Администратор, создавший компанию'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна',
        help_text='Активна ли компания в системе'
    )
    
    class Meta:
        verbose_name = 'Компания'
        verbose_name_plural = 'Компании'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """
        Автоматическая генерация slug при создании, если не указан.
        """
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

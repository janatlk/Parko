from django.contrib import admin

# Register your models here.

from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'slug',
        'country',
        'default_language',
        'default_currency',
        'is_active',
        'created_at',
    )
    list_filter = (
        'is_active',
        'country',
        'default_language',
        'default_currency',
    )
    search_fields = (
        'name',
        'slug',
        'legal_name',
        'inn',
        'email',
        'phone',
    )
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)

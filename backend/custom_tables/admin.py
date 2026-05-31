from django.contrib import admin

from .models import CustomTable, CustomRecord


@admin.register(CustomTable)
class CustomTableAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'icon', 'created_at']
    list_filter = ['company']
    search_fields = ['name', 'description']


@admin.register(CustomRecord)
class CustomRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'table', 'car', 'created_at']
    list_filter = ['table__company', 'table']
    search_fields = ['data']

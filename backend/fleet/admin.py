from django.contrib import admin

# Register your models here.

from .models import Accumulator, Car, CarPhoto, Spare, Tires


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'company',
        'brand',
        'title',
        'numplate',
        'status',
        'driver',
        'commissioned_at',
    )
    list_filter = ('status', 'brand', 'region', 'type')
    search_fields = ('numplate', 'vin', 'driver', 'title', 'drivers_phone', 'fuel_card')
    ordering = ('-id',)


@admin.register(CarPhoto)
class CarPhotoAdmin(admin.ModelAdmin):
    list_display = ('id', 'car', 'uploaded_at', 'comment')
    search_fields = ('car__numplate', 'car__vin', 'car__driver', 'comment')
    ordering = ('-uploaded_at',)


@admin.register(Spare)
class SpareAdmin(admin.ModelAdmin):
    list_display = ('id', 'car', 'title', 'part_price', 'job_price', 'installed_at')
    list_filter = ('installed_at',)
    search_fields = ('title', 'description', 'job_description', 'car__numplate', 'car__vin')
    ordering = ('-installed_at', '-id')


@admin.register(Tires)
class TiresAdmin(admin.ModelAdmin):
    list_display = ('id', 'car', 'model', 'size', 'price', 'installed_at', 'expires_at')
    list_filter = ('installed_at', 'expires_at')
    search_fields = ('model', 'size', 'car__numplate', 'car__vin')
    ordering = ('-installed_at', '-id')


@admin.register(Accumulator)
class AccumulatorAdmin(admin.ModelAdmin):
    list_display = ('id', 'car', 'model', 'serial_number', 'capacity', 'price', 'installed_at', 'expires_at')
    list_filter = ('installed_at', 'expires_at')
    search_fields = ('model', 'serial_number', 'capacity', 'car__numplate', 'car__vin')
    ordering = ('-installed_at', '-id')

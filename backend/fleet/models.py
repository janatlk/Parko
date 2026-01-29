from django.db import models
from django.db.models import Q
from django.utils import timezone


class CarStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'


class Car(models.Model):
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='cars',
    )
    region = models.CharField(max_length=100)
    brand = models.CharField(max_length=100)
    title = models.CharField(max_length=100)
    numplate = models.CharField(max_length=20)
    year = models.PositiveIntegerField(null=True, blank=True)
    vin = models.CharField(max_length=50, null=True, blank=True)
    fueltype = models.CharField(max_length=50)
    type = models.CharField(max_length=50)
    driver = models.CharField(max_length=150, default='-', blank=True)
    drivers_phone = models.CharField(max_length=50, null=True, blank=True)
    fuel_card = models.CharField(max_length=80, default='-', blank=True)
    status = models.CharField(
        max_length=20,
        choices=CarStatus.choices,
        default=CarStatus.ACTIVE,
    )
    commissioned_at = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['company', 'numplate'], name='uq_car_company_numplate'),
            models.UniqueConstraint(
                fields=['company', 'vin'],
                condition=Q(vin__isnull=False) & ~Q(vin=''),
                name='uq_car_company_vin',
            ),
        ]
        indexes = [
            models.Index(fields=['company', 'numplate']),
            models.Index(fields=['company', 'brand']),
            models.Index(fields=['company', 'status']),
        ]

    def __str__(self):
        return f"{self.brand} {self.title} [{self.numplate}]"

    @staticmethod
    def _normalize_driver(value: str) -> str:
        value = (value or '').strip()
        if not value or value == '-':
            return '-'
        parts = [p for p in value.replace('\t', ' ').split(' ') if p]
        return ' '.join([p.capitalize() for p in parts])

    def save(self, *args, **kwargs):
        if self.numplate:
            self.numplate = self.numplate.strip().upper()
        self.driver = self._normalize_driver(self.driver)
        if self.commissioned_at is None:
            self.commissioned_at = timezone.localdate()
        super().save(*args, **kwargs)


class Insurance(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='insurances',
    )
    insurance_type = models.CharField(max_length=50, default='OSAGO')
    number = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    cost = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-end_date', '-id']
        indexes = [
            models.Index(fields=['car', 'end_date']),
        ]

    def __str__(self):
        return f"Insurance {self.number} car_id={self.car_id}"


class Inspection(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='inspections',
    )
    number = models.CharField(max_length=100)
    inspected_at = models.DateField()
    cost = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-inspected_at', '-id']
        indexes = [
            models.Index(fields=['car', 'inspected_at']),
        ]

    def __str__(self):
        return f"Inspection {self.number} car_id={self.car_id}"


class CarPhoto(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='photos',
    )
    image = models.ImageField(upload_to='car_photos/')
    comment = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"CarPhoto#{self.pk} car_id={self.car_id}"


class Spare(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='spares',
    )
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    part_price = models.PositiveIntegerField(default=0)
    job_description = models.CharField(max_length=255, blank=True)
    job_price = models.PositiveIntegerField(default=0)
    installed_at = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-installed_at', '-id']
        indexes = [
            models.Index(fields=['car', 'installed_at']),
        ]

    def __str__(self):
        return f"{self.title} (car_id={self.car_id})"


class Tires(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='tires',
    )
    model = models.CharField(max_length=120)
    size = models.CharField(max_length=50)
    price = models.PositiveIntegerField(default=0)
    photo = models.ImageField(upload_to='tire_photos/', blank=True, null=True)
    installed_at = models.DateField()
    expires_at = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-installed_at', '-id']
        indexes = [
            models.Index(fields=['car', 'installed_at']),
        ]

    def __str__(self):
        return f"{self.model} {self.size} (car_id={self.car_id})"


class Accumulator(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='accumulators',
    )
    model = models.CharField(max_length=120)
    serial_number = models.CharField(max_length=120, blank=True)
    capacity = models.CharField(max_length=50, blank=True)
    price = models.PositiveIntegerField(default=0)
    installed_at = models.DateField()
    expires_at = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to='accumulator_photos/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-installed_at', '-id']
        indexes = [
            models.Index(fields=['car', 'installed_at']),
        ]

    def __str__(self):
        return f"{self.model} {self.serial_number} (car_id={self.car_id})"


class Fuel(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='fuel_records',
    )
    year = models.PositiveIntegerField()
    month = models.PositiveSmallIntegerField()
    liters = models.PositiveIntegerField(default=0)
    total_cost = models.PositiveIntegerField(default=0)
    monthly_mileage = models.PositiveIntegerField(default=0)
    consumption = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    month_name = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['car', 'year', 'month'], name='uq_fuel_car_year_month'),
        ]
        indexes = [
            models.Index(fields=['car', 'year', 'month']),
        ]

    def __str__(self):
        return f"Fuel {self.year}-{self.month:02d} car_id={self.car_id}"

    @staticmethod
    def _month_name(month: int) -> str:
        names = {
            1: 'January',
            2: 'February',
            3: 'March',
            4: 'April',
            5: 'May',
            6: 'June',
            7: 'July',
            8: 'August',
            9: 'September',
            10: 'October',
            11: 'November',
            12: 'December',
        }
        return names.get(month, '')

    def save(self, *args, **kwargs):
        month = int(self.month or 0)
        self.month_name = self._month_name(month)

        mileage = int(self.monthly_mileage or 0)
        liters = int(self.liters or 0)
        if mileage > 0:
            self.consumption = round((liters / mileage) * 100, 2)
        else:
            self.consumption = 0

        super().save(*args, **kwargs)

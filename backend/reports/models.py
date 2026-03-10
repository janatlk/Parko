from django.db import models
from companies.models import Company


class SavedReport(models.Model):
    """Model for storing saved reports with filters and summary data"""

    REPORT_TYPES = [
        ('fuel_consumption', 'Fuel Consumption'),
        ('maintenance_costs', 'Maintenance Costs'),
        ('insurance_inspection', 'Insurance & Inspection'),
        ('vehicle_utilization', 'Vehicle Utilization'),
        ('cost_analysis', 'Cost Analysis'),
        ('custom', 'Custom Report'),
    ]

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='saved_reports'
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reports'
    )
    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    from_date = models.DateField()
    to_date = models.DateField()
    car_ids = models.JSONField(
        null=True,
        blank=True,
        help_text='List of car IDs or null for all'
    )
    filters = models.JSONField(default=dict, blank=True, help_text='Additional filters')
    summary = models.JSONField(default=dict, help_text='Report summary data')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', '-created_at']),
            models.Index(fields=['company', 'report_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.report_type})"


class ReportTemplate(models.Model):
    """Model for reusable report templates with default settings"""

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='report_templates'
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_templates'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50)
    default_from_date = models.CharField(
        max_length=20,
        default='first_day_of_month',
        help_text='first_day_of_month, first_day_of_year, custom'
    )
    default_to_date = models.CharField(
        max_length=20,
        default='last_day_of_month',
        help_text='last_day_of_month, today, custom'
    )
    default_car_ids = models.JSONField(null=True, blank=True)
    default_filters = models.JSONField(default=dict, blank=True)
    show_charts = models.BooleanField(default=True)
    chart_types = models.JSONField(
        default=list,
        help_text='Preferred chart types: ["bar", "line", "pie"]'
    )
    show_totals = models.BooleanField(default=True)
    is_public = models.BooleanField(
        default=False,
        help_text='Available to all users in company'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['company', 'report_type']),
        ]

    def __str__(self):
        return self.name


class ExportLog(models.Model):
    """Model for tracking report exports for audit and analytics"""

    EXPORT_FORMATS = [
        ('csv', 'CSV'),
        ('xlsx', 'Excel (XLSX)'),
        ('pdf', 'PDF'),
        ('json', 'JSON'),
    ]

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='export_logs'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='export_logs'
    )
    report_type = models.CharField(max_length=50)
    export_format = models.CharField(max_length=10, choices=EXPORT_FORMATS)
    record_count = models.IntegerField(default=0, help_text='Number of records exported')
    file_size = models.IntegerField(null=True, blank=True, help_text='File size in bytes')
    filters = models.JSONField(default=dict, blank=True, help_text='Filters applied to the report')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['report_type']),
        ]

    def __str__(self):
        return f"{self.report_type} ({self.export_format}) - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

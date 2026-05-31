from django.db import models
from django.core.exceptions import ValidationError


class CustomTable(models.Model):
    """
    Пользовательская таблица (конструктор) для компании.
    schema хранит описание колонок: {"columns": [{"name": "...", "type": "...", "required": true}]}
    """
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='custom_tables',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, blank=True, default='table')
    schema = models.JSONField(
        default=dict,
        help_text='{"columns": [{"name": "str", "type": "text|number|price|date|select|checkbox|file", "required": bool, "options": ["..."]}]}',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        constraints = [
            models.UniqueConstraint(fields=['company', 'name'], name='uq_customtable_company_name'),
        ]

    def clean(self):
        super().clean()
        if not isinstance(self.schema, dict):
            raise ValidationError({'schema': 'Schema must be a JSON object.'})
        columns = self.schema.get('columns', [])
        if not isinstance(columns, list):
            raise ValidationError({'schema': 'Schema must contain a "columns" array.'})
        valid_types = {'text', 'number', 'price', 'date', 'select', 'checkbox', 'file'}
        for idx, col in enumerate(columns):
            if not isinstance(col, dict):
                raise ValidationError({'schema': f'Column {idx} must be an object.'})
            if 'name' not in col or not col['name']:
                raise ValidationError({'schema': f'Column {idx} must have a "name".'})
            col_type = col.get('type', '')
            if col_type not in valid_types:
                raise ValidationError({'schema': f'Column {idx} has invalid type "{col_type}". Valid: {valid_types}'})

    def __str__(self):
        return self.name


class CustomRecord(models.Model):
    """
    Запись в пользовательской таблице.
    data — JSONB с ключами по именам колонок.
    car — опциональная связь с ТС.
    """
    table = models.ForeignKey(
        CustomTable,
        on_delete=models.CASCADE,
        related_name='records',
    )
    car = models.ForeignKey(
        'fleet.Car',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='custom_records',
    )
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def clean(self):
        super().clean()
        if not isinstance(self.data, dict):
            raise ValidationError({'data': 'Data must be a JSON object.'})

    def __str__(self):
        return f'#{self.id} in {self.table.name}'

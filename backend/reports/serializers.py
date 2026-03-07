from rest_framework import serializers
from .models import SavedReport, ReportTemplate


class SavedReportSerializer(serializers.ModelSerializer):
    """Serializer for SavedReport model"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = SavedReport
        fields = [
            'id', 'name', 'report_type', 'from_date', 'to_date',
            'car_ids', 'filters', 'summary', 'created_by', 'created_by_name',
            'company', 'company_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'created_by', 'summary']


class SavedReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing saved reports"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = SavedReport
        fields = [
            'id', 'name', 'report_type', 'from_date', 'to_date',
            'summary', 'created_by_name', 'created_at'
        ]


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ReportTemplate model"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'report_type',
            'default_from_date', 'default_to_date', 'default_car_ids', 'default_filters',
            'show_charts', 'chart_types', 'show_totals', 'is_public',
            'created_by', 'created_by_name', 'company', 'company_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'created_by']


class ReportGenerateRequestSerializer(serializers.Serializer):
    """Serializer for report generation request"""
    report_type = serializers.ChoiceField(choices=[
        ('fuel_consumption', 'Fuel Consumption'),
        ('maintenance_costs', 'Maintenance Costs'),
        ('insurance_inspection', 'Insurance & Inspection'),
        ('vehicle_utilization', 'Vehicle Utilization'),
        ('cost_analysis', 'Cost Analysis'),
        ('custom', 'Custom Report'),
    ])
    from_date = serializers.DateField()
    to_date = serializers.DateField()
    car_ids = serializers.ListField(child=serializers.IntegerField(), allow_null=True, required=False)
    filters = serializers.DictField(required=False, default=dict)
    export_format = serializers.ChoiceField(
        choices=['json', 'csv', 'xlsx', 'pdf'],
        default='json',
        required=False
    )
    include_charts = serializers.BooleanField(default=True, required=False)
    save_report = serializers.BooleanField(default=False, required=False)
    report_name = serializers.CharField(max_length=255, required=False, allow_blank=True)


class ReportChartSerializer(serializers.Serializer):
    """Serializer for chart data in reports"""
    type = serializers.ChoiceField(choices=['bar', 'line', 'pie', 'doughnut', 'area'])
    title = serializers.CharField()
    data = serializers.ListField()
    options = serializers.DictField(required=False)

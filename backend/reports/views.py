from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from datetime import datetime

from core.permissions import IsCompanyStaff

from .services import get_maintenance_costs_report
from .services_additional import get_fuel_consumption_report, get_insurance_inspection_report
from .exporters import (
    export_to_csv,
    export_to_xlsx,
    prepare_maintenance_costs_for_export,
    prepare_fuel_consumption_for_export,
    prepare_insurance_inspection_for_export,
)
from .models import SavedReport, ReportTemplate
from .serializers import (
    SavedReportSerializer,
    SavedReportListSerializer,
    ReportTemplateSerializer,
    ReportGenerateRequestSerializer,
)
from .report_generator import ReportGenerator


class MaintenanceCostsReportView(APIView):
    permission_classes = [IsCompanyStaff]
    
    def get(self, request):
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        car_id_raw = request.query_params.get('car')
        car_id = int(car_id_raw) if car_id_raw else None
        export_format = request.query_params.get('export')  # csv, xlsx

        data = get_maintenance_costs_report(
            company_id=request.user.company_id,
            from_date=date_from,
            to_date=date_to,
            car_id=car_id,
        )
        
        # Экспорт данных
        if export_format in ['csv', 'xlsx']:
            export_data = prepare_maintenance_costs_for_export(data)
            filename_base = f"maintenance_costs_{request.user.company.slug}"
            
            if date_from:
                filename_base += f"_from_{date_from}"
            if date_to:
                filename_base += f"_to_{date_to}"
            
            if export_format == 'csv':
                return export_to_csv(export_data, f"{filename_base}.csv")
            elif export_format == 'xlsx':
                return export_to_xlsx(export_data, f"{filename_base}.xlsx", sheet_name="Затраты на ТО")
        
        return Response(data)


class FuelConsumptionReportView(APIView):
    permission_classes = [IsCompanyStaff]
    
    def get(self, request):
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        car_id_raw = request.query_params.get('car')
        car_id = int(car_id_raw) if car_id_raw else None
        export_format = request.query_params.get('export')

        data = get_fuel_consumption_report(
            company_id=request.user.company_id,
            from_date=date_from,
            to_date=date_to,
            car_id=car_id,
        )
        
        if export_format in ['csv', 'xlsx']:
            export_data = prepare_fuel_consumption_for_export(data)
            filename_base = f"fuel_consumption_{request.user.company.slug}"
            
            if date_from:
                filename_base += f"_from_{date_from}"
            if date_to:
                filename_base += f"_to_{date_to}"
            
            if export_format == 'csv':
                return export_to_csv(export_data, f"{filename_base}.csv")
            elif export_format == 'xlsx':
                return export_to_xlsx(export_data, f"{filename_base}.xlsx", sheet_name="Расход топлива")
        
        return Response(data)


class InsuranceInspectionReportView(APIView):
    permission_classes = [IsCompanyStaff]
    
    def get(self, request):
        status_filter = request.query_params.get('status')  # active, expiring_soon, expired
        car_id_raw = request.query_params.get('car')
        car_id = int(car_id_raw) if car_id_raw else None
        export_format = request.query_params.get('export')

        data = get_insurance_inspection_report(
            company_id=request.user.company_id,
            status_filter=status_filter,
            car_id=car_id,
        )

        if export_format in ['csv', 'xlsx']:
            export_data = prepare_insurance_inspection_for_export(data)
            filename_base = f"insurance_inspection_{request.user.company.slug}"

            if status_filter:
                filename_base += f"_{status_filter}"

            if export_format == 'csv':
                return export_to_csv(export_data, f"{filename_base}.csv")
            elif export_format == 'xlsx':
                return export_to_xlsx(export_data, f"{filename_base}.xlsx", sheet_name="Страховки и ТО")

        return Response(data)


class SavedReportViewSet(ModelViewSet):
    """ViewSet for managing saved reports"""
    permission_classes = [IsCompanyStaff]
    
    def get_queryset(self):
        return SavedReport.objects.filter(
            company=self.request.user.company
        ).select_related('created_by', 'company')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SavedReportListSerializer
        return SavedReportSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user
        )
    
    def perform_destroy(self, instance):
        instance.delete()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'status': 'success', 'message': 'Report deleted successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export saved report in specified format"""
        report = self.get_object()
        export_format = request.query_params.get('format', 'json')

        # Regenerate report data
        try:
            report_data = ReportGenerator.generate(
                report_type=report.report_type,
                from_date=report.from_date,
                to_date=report.to_date,
                company=report.company,
                car_ids=report.car_ids,
                filters=report.filters,
                include_charts=True
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if export_format == 'csv':
            return export_to_csv(report_data.get('data', []), f"report_{report.id}.csv")
        elif export_format == 'xlsx':
            return export_to_xlsx(report_data.get('data', []), f"report_{report.id}.xlsx", sheet_name="Report")
        else:
            return Response(report_data)

    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        """Get full report data for a saved report"""
        report = self.get_object()
        logger = __import__('logging').getLogger(__name__)
        logger.info(f"Getting data for saved report: {report.id}")

        # Regenerate report data
        try:
            report_data = ReportGenerator.generate(
                report_type=report.report_type,
                from_date=report.from_date,
                to_date=report.to_date,
                company=report.company,
                car_ids=report.car_ids,
                filters=report.filters,
                include_charts=True
            )
            logger.info(f"Report data keys: {list(report_data.keys()) if isinstance(report_data, dict) else 'Not a dict'}")
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Return report_data directly - StandardJSONRenderer will wrap it
        return Response(report_data)


class ReportTemplateViewSet(ModelViewSet):
    """ViewSet for managing report templates"""
    permission_classes = [IsCompanyStaff]
    serializer_class = ReportTemplateSerializer
    
    def get_queryset(self):
        return ReportTemplate.objects.filter(
            company=self.request.user.company
        ).select_related('created_by', 'company')
    
    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user
        )

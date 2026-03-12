from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from datetime import datetime

from core.permissions import IsCompanyStaff

from .services import get_maintenance_costs_report
from .services_additional import get_fuel_consumption_report, get_insurance_inspection_report


class ReportTypesView(APIView):
    """Get available report types"""
    permission_classes = [IsCompanyStaff]

    def get(self, request):
        """Return list of available report types"""
        return Response({
            'types': [
                {'value': 'fuel_consumption', 'label': 'Fuel Consumption'},
                {'value': 'maintenance_costs', 'label': 'Maintenance Costs'},
                {'value': 'insurance_inspection', 'label': 'Insurance & Inspection'},
                {'value': 'vehicle_utilization', 'label': 'Vehicle Utilization'},
                {'value': 'cost_analysis', 'label': 'Cost Analysis'},
            ]
        })
from .exporters import (
    export_to_csv,
    export_to_xlsx,
    export_to_pdf,
    export_to_json,
    prepare_maintenance_costs_for_export,
    prepare_fuel_consumption_for_export,
    prepare_insurance_inspection_for_export,
)
from .models import SavedReport, ReportTemplate, ExportLog
from .serializers import (
    SavedReportSerializer,
    SavedReportListSerializer,
    ReportTemplateSerializer,
    ReportGenerateRequestSerializer,
    ExportLogSerializer,
)
from .report_generator import ReportGenerator


class MaintenanceCostsReportView(APIView):
    permission_classes = [IsCompanyStaff]

    def get(self, request):
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        car_id_raw = request.query_params.get('car')
        car_id = int(car_id_raw) if car_id_raw else None
        export_format = request.query_params.get('export')  # csv, xlsx, pdf, json

        data = get_maintenance_costs_report(
            company_id=request.user.company_id,
            from_date=date_from,
            to_date=date_to,
            car_id=car_id,
        )

        # Экспорт данных
        if export_format in ['csv', 'xlsx', 'pdf', 'json']:
            export_data = prepare_maintenance_costs_for_export(data)
            filename_base = f"maintenance_costs_{request.user.company.slug}"

            if date_from:
                filename_base += f"_from_{date_from}"
            if date_to:
                filename_base += f"_to_{date_to}"

            if export_format == 'csv':
                # Log export
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='maintenance_costs',
                    export_format='csv',
                    record_count=len(export_data),
                )
                return export_to_csv(export_data, f"{filename_base}.csv")
            elif export_format == 'xlsx':
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='maintenance_costs',
                    export_format='xlsx',
                    record_count=len(export_data),
                )
                return export_to_xlsx(export_data, f"{filename_base}.xlsx", sheet_name="Затраты на ТО")
            elif export_format == 'pdf':
                header_info = {
                    'Period': f"{date_from or 'All time'} - {date_to or 'Present'}",
                    'Generated': datetime.now().strftime('%Y-%m-%d %H:%M'),
                }
                if car_id:
                    header_info['Vehicle ID'] = str(car_id)
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='maintenance_costs',
                    export_format='pdf',
                    record_count=len(export_data),
                )
                return export_to_pdf(
                    export_data,
                    f"{filename_base}.pdf",
                    title="Maintenance Costs Report",
                    company_name=request.user.company.name,
                    header_info=header_info
                )
            elif export_format == 'json':
                metadata = {
                    'report_type': 'maintenance_costs',
                    'from_date': date_from,
                    'to_date': date_to,
                    'company': request.user.company.name,
                }
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='maintenance_costs',
                    export_format='json',
                    record_count=len(export_data),
                )
                return export_to_json(export_data, f"{filename_base}.json", metadata=metadata)

        return Response(data)


class FuelConsumptionReportView(APIView):
    permission_classes = [IsCompanyStaff]

    def get(self, request):
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        car_id_raw = request.query_params.get('car')
        car_id = int(car_id_raw) if car_id_raw else None
        export_format = request.query_params.get('export')  # csv, xlsx, pdf, json

        data = get_fuel_consumption_report(
            company_id=request.user.company_id,
            from_date=date_from,
            to_date=date_to,
            car_id=car_id,
        )

        if export_format in ['csv', 'xlsx', 'pdf', 'json']:
            export_data = prepare_fuel_consumption_for_export(data)
            filename_base = f"fuel_consumption_{request.user.company.slug}"

            if date_from:
                filename_base += f"_from_{date_from}"
            if date_to:
                filename_base += f"_to_{date_to}"

            if export_format == 'csv':
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='fuel_consumption',
                    export_format='csv',
                    record_count=len(export_data),
                )
                return export_to_csv(export_data, f"{filename_base}.csv")
            elif export_format == 'xlsx':
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='fuel_consumption',
                    export_format='xlsx',
                    record_count=len(export_data),
                )
                return export_to_xlsx(export_data, f"{filename_base}.xlsx", sheet_name="Расход топлива")
            elif export_format == 'pdf':
                header_info = {
                    'Period': f"{date_from or 'All time'} - {date_to or 'Present'}",
                    'Generated': datetime.now().strftime('%Y-%m-%d %H:%M'),
                }
                if car_id:
                    header_info['Vehicle ID'] = str(car_id)
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='fuel_consumption',
                    export_format='pdf',
                    record_count=len(export_data),
                )
                return export_to_pdf(
                    export_data,
                    f"{filename_base}.pdf",
                    title="Fuel Consumption Report",
                    company_name=request.user.company.name,
                    header_info=header_info
                )
            elif export_format == 'json':
                metadata = {
                    'report_type': 'fuel_consumption',
                    'from_date': date_from,
                    'to_date': date_to,
                    'company': request.user.company.name,
                }
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='fuel_consumption',
                    export_format='json',
                    record_count=len(export_data),
                )
                return export_to_json(export_data, f"{filename_base}.json", metadata=metadata)

        return Response(data)


class InsuranceInspectionReportView(APIView):
    permission_classes = [IsCompanyStaff]

    def get(self, request):
        status_filter = request.query_params.get('status')  # active, expiring_soon, expired
        car_id_raw = request.query_params.get('car')
        car_id = int(car_id_raw) if car_id_raw else None
        export_format = request.query_params.get('export')  # csv, xlsx, pdf, json

        data = get_insurance_inspection_report(
            company_id=request.user.company_id,
            status_filter=status_filter,
            car_id=car_id,
        )

        if export_format in ['csv', 'xlsx', 'pdf', 'json']:
            export_data = prepare_insurance_inspection_for_export(data)
            filename_base = f"insurance_inspection_{request.user.company.slug}"

            if status_filter:
                filename_base += f"_{status_filter}"

            if export_format == 'csv':
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='insurance_inspection',
                    export_format='csv',
                    record_count=len(export_data),
                )
                return export_to_csv(export_data, f"{filename_base}.csv")
            elif export_format == 'xlsx':
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='insurance_inspection',
                    export_format='xlsx',
                    record_count=len(export_data),
                )
                return export_to_xlsx(export_data, f"{filename_base}.xlsx", sheet_name="Страховки и ТО")
            elif export_format == 'pdf':
                header_info = {
                    'Status Filter': status_filter or 'All',
                    'Generated': datetime.now().strftime('%Y-%m-%d %H:%M'),
                }
                if car_id:
                    header_info['Vehicle ID'] = str(car_id)
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='insurance_inspection',
                    export_format='pdf',
                    record_count=len(export_data),
                )
                return export_to_pdf(
                    export_data,
                    f"{filename_base}.pdf",
                    title="Insurance & Inspection Report",
                    company_name=request.user.company.name,
                    header_info=header_info
                )
            elif export_format == 'json':
                metadata = {
                    'report_type': 'insurance_inspection',
                    'status_filter': status_filter,
                    'company': request.user.company.name,
                }
                ExportLog.objects.create(
                    company=request.user.company,
                    user=request.user,
                    report_type='insurance_inspection',
                    export_format='json',
                    record_count=len(export_data),
                )
                return export_to_json(export_data, f"{filename_base}.json", metadata=metadata)

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
        """Export saved report in specified format (csv, xlsx, pdf, json)"""
        report = self.get_object()
        export_format = request.query_params.get('format', 'json')
        logger = __import__('logging').getLogger(__name__)

        # Regenerate report data
        try:
            report_data = ReportGenerator.generate(
                report_type=report.report_type,
                from_date=report.from_date,
                to_date=report.to_date,
                company=report.company,
                car_ids=report.car_ids,
                filters=report.filters or {},
                include_charts=True
            )
        except ValueError as e:
            logger.error(f"ValueError generating report: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error generating report: {e}")
            logger.exception("Full traceback:")
            return Response({'error': f'Report generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Get preparator function
        try:
            preparator = get_export_preparator(report.report_type)
            if preparator:
                export_data = preparator(report_data)
            else:
                export_data = report_data.get('data', [])
        except Exception as e:
            logger.error(f"Error preparing export data: {e}")
            logger.exception("Full traceback:")
            export_data = report_data.get('data', [])

        filename_base = f"report_{report.report_type}_{report.id}"

        if export_format == 'csv':
            ExportLog.objects.create(
                company=report.company,
                user=request.user,
                report_type=report.report_type,
                export_format='csv',
                record_count=len(export_data),
            )
            return export_to_csv(export_data, f"{filename_base}.csv")
        elif export_format == 'xlsx':
            ExportLog.objects.create(
                company=report.company,
                user=request.user,
                report_type=report.report_type,
                export_format='xlsx',
                record_count=len(export_data),
            )
            return export_to_xlsx(export_data, f"{filename_base}.xlsx", sheet_name="Report")
        elif export_format == 'pdf':
            header_info = {
                'Period': f"{report.from_date} - {report.to_date}",
                'Generated': datetime.now().strftime('%Y-%m-%d %H:%M'),
            }
            ExportLog.objects.create(
                company=report.company,
                user=request.user,
                report_type=report.report_type,
                export_format='pdf',
                record_count=len(export_data),
            )
            return export_to_pdf(
                export_data,
                f"{filename_base}.pdf",
                title=report.name,
                company_name=report.company.name,
                header_info=header_info
            )
        elif export_format == 'json':
            metadata = {
                'report_type': report.report_type,
                'report_name': report.name,
                'from_date': str(report.from_date),
                'to_date': str(report.to_date),
            }
            ExportLog.objects.create(
                company=report.company,
                user=request.user,
                report_type=report.report_type,
                export_format='json',
                record_count=len(export_data),
            )
            return export_to_json(export_data, f"{filename_base}.json", metadata=metadata)
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
                filters=report.filters or {},
                include_charts=True
            )
            logger.info(f"Report data keys: {list(report_data.keys()) if isinstance(report_data, dict) else 'Not a dict'}")
        except ValueError as e:
            logger.error(f"ValueError generating report: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error generating report: {e}")
            logger.exception("Full traceback:")
            return Response({'error': f'Report generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


class ExportLogViewSet(ModelViewSet):
    """ViewSet for viewing export history"""
    permission_classes = [IsCompanyStaff]
    serializer_class = ExportLogSerializer

    def get_queryset(self):
        return ExportLog.objects.filter(
            company=self.request.user.company
        ).select_related('user', 'company').order_by('-created_at')

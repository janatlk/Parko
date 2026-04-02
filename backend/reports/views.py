from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework import serializers
from datetime import datetime

from core.permissions import IsCompanyStaff

from .services import get_maintenance_costs_report
from .services_additional import get_fuel_consumption_report, get_insurance_inspection_report
from .services_cost_per_km import get_cost_per_km_report
from .services_email import send_report_email
from .exporters import (
    export_to_csv,
    export_to_xlsx,
    export_to_pdf,
    get_export_preparator,
)
from .report_generator import ReportGenerator


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


class EmailSettingsView(APIView):
    """Get and update user's email settings"""
    permission_classes = [IsCompanyStaff]
    
    def get(self, request):
        """Get user's email settings"""
        user = request.user
        return Response({
            'email_api_key': user.email_api_key,  # Masked in production
            'email_service': user.email_service,
            'user_email': user.email,
        })
    
    def post(self, request):
        """Save user's email API key and service"""
        user = request.user
        email_api_key = request.data.get('email_api_key')
        email_service = request.data.get('email_service', 'sendgrid')
        
        if not email_api_key:
            return Response(
                {'error': 'email_api_key is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if email_service not in ['sendgrid', 'mailgun', 'smtp']:
            return Response(
                {'error': 'Invalid email_service. Choose from: sendgrid, mailgun, smtp'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.email_api_key = email_api_key
        user.email_service = email_service
        user.save()
        
        return Response({
            'success': True,
            'message': 'Email settings saved successfully'
        })


class ShareReportEmailView(APIView):
    """Share report via email"""
    permission_classes = [IsCompanyStaff]
    
    def post(self, request):
        """
        Share report via email
        
        Request body:
        {
            "report_type": "fuel_consumption",
            "from_date": "2026-01-01",
            "to_date": "2026-01-31",
            "recipient_email": "user@example.com",
            "format": "xlsx"
        }
        """
        logger = __import__('logging').getLogger(__name__)
        logger.info("=" * 60)
        logger.info("SHARE REPORT EMAIL VIEW - REQUEST RECEIVED")
        logger.info("=" * 60)
        logger.info(f"User: {request.user.username} (ID: {request.user.id})")
        logger.info(f"User email: {request.user.email}")
        logger.info(f"User company: {request.user.company}")
        logger.info(f"Request data: {request.data}")
        
        user = request.user
        
        # Validate user has email API key
        if not user.email_api_key:
            logger.error("ERROR: User has no email_api_key configured")
            logger.error(f"User email_service: {user.email_service}")
            return Response(
                {'error': 'Email API key not configured. Please save your API key first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"User has API key: {len(user.email_api_key) > 0}")
        logger.info(f"Email service: {user.email_service}")
        
        # Validate required fields
        report_type = request.data.get('report_type')
        from_date_str = request.data.get('from_date')
        to_date_str = request.data.get('to_date')
        recipient_email = request.data.get('recipient_email')
        export_format = request.data.get('format', 'xlsx')
        
        logger.info(f"Report type: {report_type}")
        logger.info(f"Date range: {from_date_str} to {to_date_str}")
        logger.info(f"Recipient: {recipient_email}")
        logger.info(f"Export format: {export_format}")
        
        if not all([report_type, from_date_str, to_date_str, recipient_email]):
            logger.error("ERROR: Missing required fields")
            return Response(
                {'error': 'Missing required fields: report_type, from_date, to_date, recipient_email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse dates
        try:
            from datetime import date
            from_date = date.fromisoformat(from_date_str)
            to_date = date.fromisoformat(to_date_str)
            logger.info(f"Parsed dates: from={from_date}, to={to_date}")
        except ValueError as e:
            logger.error(f"ERROR: Invalid date format: {e}")
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate report
        try:
            logger.info("Generating report...")
            report_data = ReportGenerator.generate(
                report_type=report_type,
                from_date=from_date,
                to_date=to_date,
                company=user.company,
                car_ids=None,
                filters={},
                include_charts=False  # Don't include charts for email attachment
            )
            logger.info(f"Report generated successfully. Data keys: {list(report_data.keys())}")
        except Exception as e:
            logger.error(f"ERROR generating report: {e}")
            logger.exception("Full traceback:")
            return Response(
                {'error': f'Report generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Prepare data for export
        preparator = get_export_preparator(report_type)
        if preparator:
            logger.info(f"Using preparator: {preparator.__name__}")
            export_data = preparator(report_data)
            logger.info(f"Export data rows: {len(export_data)}")
        else:
            logger.warning(f"No preparator found for {report_type}, using raw data")
            export_data = report_data.get('data', [])
        
        # Export to file
        from io import BytesIO
        from .exporters import export_to_xlsx, export_to_csv, export_to_pdf
        
        buffer = BytesIO()
        filename = f"report_{report_type}_{from_date_str}_to_{to_date_str}"
        
        try:
            logger.info(f"Exporting to {export_format.upper()}...")
            if export_format == 'xlsx':
                response = export_to_xlsx(export_data, f"{filename}.xlsx")
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                logger.info("Exported to XLSX")
            elif export_format == 'csv':
                response = export_to_csv(export_data, f"{filename}.csv")
                content_type = 'text/csv'
                logger.info("Exported to CSV")
            elif export_format == 'pdf':
                response = export_to_pdf(export_data, f"{filename}.pdf")
                content_type = 'application/pdf'
                logger.info("Exported to PDF")
            else:
                logger.error(f"Unsupported format: {export_format}")
                return Response(
                    {'error': f'Unsupported format: {export_format}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get file content
            buffer.write(response.content)
            buffer.seek(0)
            logger.info(f"File size: {len(buffer.getvalue())} bytes")
            
        except Exception as e:
            logger.error(f"ERROR exporting report: {e}")
            logger.exception("Full traceback:")
            return Response(
                {'error': f'Export failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Send email
        logger.info("Calling send_report_email...")
        success = send_report_email(
            recipient_email=recipient_email,
            report_file=buffer,
            report_name=f"{filename}.{export_format}",
            sender_email=user.email,
            api_key=user.email_api_key,
            service=user.email_service,
            subject=f'Report: {report_type.replace("_", " ").title()}',
        )
        
        logger.info(f"Email send result: {'SUCCESS' if success else 'FAILED'}")
        logger.info("=" * 60)
        logger.info("SHARE REPORT EMAIL VIEW - COMPLETED")
        logger.info("=" * 60)
        
        if success:
            return Response({
                'success': True,
                'message': f'Report sent to {recipient_email}'
            })
        else:
            error_message = 'Failed to send email. '
            if user.email_service == 'smtp':
                error_message += 'For SMTP: Check your email password (use app-specific password for Gmail) and ensure SMTP is enabled.'
            elif user.email_service == 'sendgrid':
                error_message += 'For SendGrid: Check your API key is valid.'
            elif user.email_service == 'mailgun':
                error_message += 'For Mailgun: Check your API key and domain configuration.'
            return Response(
                {'error': error_message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CostPerKmReportView(APIView):
    """Cost Per Kilometer Report"""
    permission_classes = [IsCompanyStaff]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        vehicle_ids_str = request.query_params.get('vehicle_ids')
        vehicle_type = request.query_params.get('vehicle_type')
        region = request.query_params.get('region')
        export_format = request.query_params.get('export')  # csv, xlsx, json

        # Parse vehicle_ids
        vehicle_ids = None
        if vehicle_ids_str:
            try:
                vehicle_ids = [int(x.strip()) for x in vehicle_ids_str.split(',')]
            except ValueError:
                return Response(
                    {'error': 'Invalid vehicle_ids format. Use comma-separated integers'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Generate report
        data = get_cost_per_km_report(
            company_id=request.user.company_id,
            start_date=start_date,
            end_date=end_date,
            vehicle_ids=vehicle_ids,
            vehicle_type=vehicle_type,
            region=region,
        )

        # Export
        if export_format in ['csv', 'xlsx', 'json']:
            from io import BytesIO
            from .exporters import export_to_xlsx, export_to_csv

            # Prepare data for export
            export_rows = []
            for vehicle in data['by_vehicle']:
                export_rows.append({
                    'Vehicle': f"{vehicle['brand']} {vehicle['model']} ({vehicle['numplate']})",
                    'Fuel Cost': vehicle['fuel_cost'],
                    'Maintenance Cost': vehicle['maintenance_cost'],
                    'Insurance Cost': vehicle['insurance_cost'],
                    'Inspection Cost': vehicle['inspection_cost'],
                    'Total Cost': vehicle['total_cost'],
                    'Total Distance (km)': vehicle['total_distance'],
                    'Cost per km': vehicle['cost_per_km'],
                    'Fuel Cost per km': vehicle['fuel_cost_per_km'],
                    'Maintenance Cost per km': vehicle['maintenance_cost_per_km'],
                })

            filename_base = f"cost_per_km_{request.user.company.slug}"
            if start_date:
                filename_base += f"_{start_date}"
            if end_date:
                filename_base += f"_{end_date}"

            if export_format == 'xlsx':
                response = export_to_xlsx(export_rows, f"{filename_base}.xlsx")
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            elif export_format == 'csv':
                response = export_to_csv(export_rows, f"{filename_base}.csv")
                content_type = 'text/csv'
            else:  # json
                from rest_framework.response import Response as DRFResponse
                return DRFResponse(data)

            return Response(
                response.content,
                content_type=content_type,
                headers={
                    'Content-Disposition': f'attachment; filename="{filename_base}.{export_format}"'
                }
            )

        return Response(data)

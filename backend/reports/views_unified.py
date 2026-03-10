# Backend unified reports API implementation

import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime
import traceback

from core.permissions import IsCompanyStaff
from .report_generator import ReportGenerator
from .exporters import (
    export_to_csv,
    export_to_xlsx,
    export_to_pdf,
    export_to_json,
    get_export_preparator,
)
from .models import ExportLog

logger = logging.getLogger(__name__)


class GenerateReportView(APIView):
    permission_classes = [IsCompanyStaff]

    def post(self, request):
        """
        Generate flexible reports with various filters

        Request body:
        {
            "report_type": "fuel_consumption" | "maintenance_costs" | "insurance_inspection" | "vehicle_utilization" | "cost_analysis",
            "from_date": "2026-01-01",
            "to_date": "2026-01-31",
            "car_ids": [1, 2, 3] | null,  # null means all cars
            "filters": {},  # additional filters based on report type
            "export_format": "json" | "csv" | "xlsx"
        }
        """
        logger.info(f"GenerateReportView POST request received from user: {request.user}")
        
        report_type = request.data.get('report_type')
        from_date_str = request.data.get('from_date')
        to_date_str = request.data.get('to_date')
        car_ids = request.data.get('car_ids')  # None or list of IDs
        filters = request.data.get('filters', {})
        export_format = request.data.get('export_format', 'json')
        
        logger.info(f"Report params: type={report_type}, from={from_date_str}, to={to_date_str}, car_ids={car_ids}")

        # Validate required fields
        if not report_type or not from_date_str or not to_date_str:
            logger.error("Missing required fields")
            return Response(
                {'error': 'report_type, from_date, and to_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse dates
        try:
            from_date = datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.strptime(to_date_str, '%Y-%m-%d').date()
        except ValueError as e:
            logger.error(f"Invalid date format: {e}")
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's company for filtering
        company = request.user.company
        logger.info(f"User company: {company.id if company else 'None'} - {company.name if company else 'None'}")
        
        if not company:
            logger.error(f"User {request.user} has no company")
            return Response(
                {'error': 'User does not belong to a company'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate report
        try:
            logger.info(f"Generating report: {report_type}")
            logger.info(f"Params: from_date={from_date}, to_date={to_date}, car_ids={car_ids}")
            report_data = ReportGenerator.generate(
                report_type=report_type,
                from_date=from_date,
                to_date=to_date,
                company=company,
                car_ids=car_ids,
                filters=filters,
                include_charts=True
            )
            logger.info(f"Report generated successfully")
            logger.info(f"Report data type: {type(report_data)}")
            logger.info(f"Report data keys: {list(report_data.keys()) if isinstance(report_data, dict) else 'Not a dict'}")
            logger.info(f"Charts count: {len(report_data.get('charts', []))}")
            logger.info(f"Data items count: {len(report_data.get('data', []))}")
        except Exception as e:
            logger.error(f"Error during report generation: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Report generation failed: {str(e)}', 'type': type(e).__name__},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Handle export format
        try:
            # Prepare data for export based on format
            export_filename = f"report_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            if export_format == 'csv':
                logger.info("Exporting to CSV")
                # Get preparator function for this report type
                preparator = get_export_preparator(report_type)
                if preparator:
                    export_data = preparator(report_data)
                else:
                    export_data = report_data.get('data', [])
                
                response = export_to_csv(export_data, f"{export_filename}.csv")
                # Log export
                ExportLog.objects.create(
                    company=company,
                    user=request.user,
                    report_type=report_type,
                    export_format='csv',
                    record_count=len(export_data),
                    filters=filters
                )
                return response
                
            elif export_format == 'xlsx':
                logger.info("Exporting to XLSX")
                preparator = get_export_preparator(report_type)
                if preparator:
                    export_data = preparator(report_data)
                else:
                    export_data = report_data.get('data', [])
                
                response = export_to_xlsx(export_data, f"{export_filename}.xlsx", sheet_name=report_type)
                # Log export
                ExportLog.objects.create(
                    company=company,
                    user=request.user,
                    report_type=report_type,
                    export_format='xlsx',
                    record_count=len(export_data),
                    filters=filters
                )
                return response
                
            elif export_format == 'pdf':
                logger.info("Exporting to PDF")
                preparator = get_export_preparator(report_type)
                if preparator:
                    export_data = preparator(report_data)
                else:
                    export_data = report_data.get('data', [])
                
                # Prepare header info
                header_info = {
                    'Period': f"{from_date} - {to_date}",
                    'Generated': datetime.now().strftime('%Y-%m-%d %H:%M'),
                }
                if car_ids:
                    header_info['Vehicles'] = f"{len(car_ids)} selected"
                else:
                    header_info['Vehicles'] = 'All vehicles'
                
                response = export_to_pdf(
                    export_data,
                    f"{export_filename}.pdf",
                    title=report_type.replace('_', ' ').title(),
                    company_name=company.name,
                    header_info=header_info
                )
                # Log export
                ExportLog.objects.create(
                    company=company,
                    user=request.user,
                    report_type=report_type,
                    export_format='pdf',
                    record_count=len(export_data),
                    filters=filters
                )
                return response
                
            elif export_format == 'json':
                logger.info("Exporting to JSON")
                metadata = {
                    'report_type': report_type,
                    'from_date': str(from_date),
                    'to_date': str(to_date),
                    'company': company.name,
                    'generated_at': datetime.now().isoformat(),
                }
                
                response = export_to_json(
                    report_data.get('data', []),
                    f"{export_filename}.json",
                    metadata=metadata
                )
                # Log export
                ExportLog.objects.create(
                    company=company,
                    user=request.user,
                    report_type=report_type,
                    export_format='json',
                    record_count=len(report_data.get('data', [])),
                    filters=filters
                )
                return response
            else:
                # JSON format - return report_data directly
                logger.info("Returning JSON response (default)")
                logger.info(f"Response data keys: {list(report_data.keys())}")
                return Response(report_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error during export: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Export error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

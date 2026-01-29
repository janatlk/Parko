# Backend unified reports API implementation

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime

from core.permissions import IsCompanyStaff
from .report_generator import ReportGenerator
from .exporters import export_to_csv, export_to_xlsx


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
        report_type = request.data.get('report_type')
        from_date_str = request.data.get('from_date')
        to_date_str = request.data.get('to_date')
        car_ids = request.data.get('car_ids')  # None or list of IDs
        filters = request.data.get('filters', {})
        export_format = request.data.get('export_format', 'json')

        # Validate required fields
        if not report_type or not from_date_str or not to_date_str:
            return Response(
                {'error': 'report_type, from_date, and to_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse dates
        try:
            from_date = datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.strptime(to_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's company for filtering
        company = request.user.company

        # Generate report
        try:
            report_data = ReportGenerator.generate(
                report_type=report_type,
                from_date=from_date,
                to_date=to_date,
                company=company,
                car_ids=car_ids,
                filters=filters
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle export format
        if export_format == 'csv':
            return export_to_csv(report_data['data'], f'report_{report_type}')
        elif export_format == 'xlsx':
            return export_to_xlsx(report_data['data'], f'report_{report_type}')
        else:
            # JSON format
            return Response(report_data, status=status.HTTP_200_OK)

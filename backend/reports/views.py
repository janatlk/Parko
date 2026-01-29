from rest_framework.response import Response
from rest_framework.views import APIView

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

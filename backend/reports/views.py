from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsCompanyStaff

from .services import get_maintenance_costs_report


class MaintenanceCostsReportView(APIView):
    def get(self, request):
        IsCompanyStaff().has_permission(request, self) or self.permission_denied(request)

        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        car_id_raw = request.query_params.get('car')
        car_id = int(car_id_raw) if car_id_raw else None

        data = get_maintenance_costs_report(
            company_id=request.user.company_id,
            from_date=date_from,
            to_date=date_to,
            car_id=car_id,
        )
        return Response(data)

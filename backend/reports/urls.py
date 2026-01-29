from django.urls import path

from .views import (
    FuelConsumptionReportView,
    InsuranceInspectionReportView,
    MaintenanceCostsReportView,
)
from .views_unified import GenerateReportView

urlpatterns = [
    path('maintenance-costs/', MaintenanceCostsReportView.as_view(), name='maintenance-costs'),
    path('fuel-consumption/', FuelConsumptionReportView.as_view(), name='fuel-consumption'),
    path('insurance-inspection/', InsuranceInspectionReportView.as_view(), name='insurance-inspection'),
    path('generate/', GenerateReportView.as_view(), name='generate-report'),
]

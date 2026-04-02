from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FuelConsumptionReportView,
    InsuranceInspectionReportView,
    MaintenanceCostsReportView,
    CostPerKmReportView,
    ReportTypesView,
    EmailSettingsView,
    ShareReportEmailView,
)
from .views_unified import GenerateReportView
from .views import SavedReportViewSet, ReportTemplateViewSet, ExportLogViewSet

router = DefaultRouter()
router.register(r'saved', SavedReportViewSet, basename='saved-report')
router.register(r'templates', ReportTemplateViewSet, basename='report-template')
router.register(r'export-log', ExportLogViewSet, basename='export-log')

urlpatterns = [
    path('types/', ReportTypesView.as_view(), name='report-types'),
    path('maintenance-costs/', MaintenanceCostsReportView.as_view(), name='maintenance-costs'),
    path('fuel-consumption/', FuelConsumptionReportView.as_view(), name='fuel-consumption'),
    path('insurance-inspection/', InsuranceInspectionReportView.as_view(), name='insurance-inspection'),
    path('cost-per-km/', CostPerKmReportView.as_view(), name='cost-per-km'),
    path('generate/', GenerateReportView.as_view(), name='generate-report'),
    path('share-email/', ShareReportEmailView.as_view(), name='share-report-email'),
    path('email-settings/', EmailSettingsView.as_view(), name='email-settings'),
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FuelConsumptionReportView,
    InsuranceInspectionReportView,
    MaintenanceCostsReportView,
)
from .views_unified import GenerateReportView
from .views import SavedReportViewSet, ReportTemplateViewSet

router = DefaultRouter()
router.register(r'saved', SavedReportViewSet, basename='saved-report')
router.register(r'templates', ReportTemplateViewSet, basename='report-template')

urlpatterns = [
    path('maintenance-costs/', MaintenanceCostsReportView.as_view(), name='maintenance-costs'),
    path('fuel-consumption/', FuelConsumptionReportView.as_view(), name='fuel-consumption'),
    path('insurance-inspection/', InsuranceInspectionReportView.as_view(), name='insurance-inspection'),
    path('generate/', GenerateReportView.as_view(), name='generate-report'),
    path('', include(router.urls)),
]

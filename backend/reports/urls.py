from django.urls import path

from .views import MaintenanceCostsReportView


urlpatterns = [
    path('reports/maintenance-costs/', MaintenanceCostsReportView.as_view(), name='reports-maintenance-costs'),
]

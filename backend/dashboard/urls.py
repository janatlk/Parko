from django.urls import path

from .views import (
    DashboardStatsView,
    DashboardExpiringView,
    DashboardRecentFuelView,
    DashboardFuelByMonthView,
    DashboardActivityFeedView,
    DashboardCostByMonthView,
    DashboardVehicleConsumptionView,
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('expiring/', DashboardExpiringView.as_view(), name='dashboard-expiring'),
    path('recent-fuel/', DashboardRecentFuelView.as_view(), name='dashboard-recent-fuel'),
    path('fuel-by-month/', DashboardFuelByMonthView.as_view(), name='dashboard-fuel-by-month'),
    path('activity-feed/', DashboardActivityFeedView.as_view(), name='dashboard-activity-feed'),
    path('cost-by-month/', DashboardCostByMonthView.as_view(), name='dashboard-cost-by-month'),
    path('vehicle-consumption/', DashboardVehicleConsumptionView.as_view(), name='dashboard-vehicle-consumption'),
]

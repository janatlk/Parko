from django.urls import path

from .views import (
    DashboardStatsView,
    DashboardExpiringView,
    DashboardRecentFuelView,
    DashboardFuelByMonthView,
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('expiring/', DashboardExpiringView.as_view(), name='dashboard-expiring'),
    path('recent-fuel/', DashboardRecentFuelView.as_view(), name='dashboard-recent-fuel'),
    path('fuel-by-month/', DashboardFuelByMonthView.as_view(), name='dashboard-fuel-by-month'),
]

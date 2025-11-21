from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),
    
    # API URLs
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("companies.urls")),
    path("api/v1/", include("fleet.urls")),
    path("api/v1/", include("reports.urls")),
    
    # API Schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

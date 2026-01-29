from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),
    
    # API URLs
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("core.urls")),
    path("api/v1/", include("companies.urls")),
    path("api/v1/", include("fleet.urls")),
    path("api/v1/", include("reports.urls")),

    # Legacy/info endpoints
    path("api/", include("api.urls")),
    
    # API Schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

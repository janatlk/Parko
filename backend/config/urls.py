from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, HttpResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from pathlib import Path


def serve_react(request, path=''):
    """Serve React frontend index.html for all non-API routes."""
    index_path = Path(settings.STATIC_ROOT) / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'))
    return HttpResponse(
        "Frontend not built. Run npm run build and collectstatic.",
        status=500
    )


urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # API URLs
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("core.urls")),
    path("api/v1/", include("companies.urls")),
    path("api/v1/", include("fleet.urls")),
    path("api/v1/", include("reports.urls")),
    path("api/v1/dashboard/", include("dashboard.urls")),
    path("api/v1/", include("feedback.urls")),
    path("api/v1/ai/", include("ai.urls")),
    path("api/v1/custom-tables/", include("custom_tables.urls")),

    # Legacy/info endpoints
    path("api/", include("api.urls")),

    # API Schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

# Media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# React frontend catch-all (must be last)
urlpatterns += [
    re_path(r'^(?P<path>.*)$', serve_react),
]

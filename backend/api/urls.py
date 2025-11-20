from django.urls import path

from .views import ProjectInfoView


urlpatterns = [
    path("info/", ProjectInfoView.as_view(), name="project-info"),
]

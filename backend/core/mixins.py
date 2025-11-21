from rest_framework import mixins

class CompanyFilterMixin:
    """
    Миксин для фильтрации объектов по компании текущего пользователя
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset.filter(company=self.request.user.company)
        return queryset.none()

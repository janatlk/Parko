from rest_framework import mixins

class CompanyFilterMixin:
    """
    Миксин для фильтрации объектов по компании текущего пользователя
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and user.company_id is not None:
            model = getattr(queryset, 'model', None)
            if model is None:
                return queryset

            field_names = {f.name for f in model._meta.get_fields()}
            if 'company' in field_names:
                return queryset.filter(company_id=user.company_id)
            if 'car' in field_names:
                return queryset.filter(car__company_id=user.company_id)

            return queryset
        return queryset.none()

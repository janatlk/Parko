from rest_framework import permissions

class IsCompanyAdmin(permissions.BasePermission):
    """
    Разрешает доступ только администраторам компании
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'COMPANY_ADMIN'

class IsCompanyStaff(permissions.BasePermission):
    """
    Разрешает доступ сотрудникам компании (не гостям)
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role != 'GUEST'

class IsCompanyMember(permissions.BasePermission):
    """
    Базовое разрешение для всех пользователей компании
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'company')

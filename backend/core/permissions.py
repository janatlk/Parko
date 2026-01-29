from rest_framework import permissions

from accounts.models import UserRole

class IsCompanyAdmin(permissions.BasePermission):
    """
    Разрешает доступ только администраторам компании
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.company_id is not None
            and request.user.role == UserRole.COMPANY_ADMIN
        )

class IsCompanyStaff(permissions.BasePermission):
    """
    Разрешает доступ сотрудникам компании (не гостям)
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.company_id is not None
            and request.user.role != UserRole.GUEST
        )


class IsCompanyAdminOrDispatcher(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.company_id is not None
            and request.user.role in (UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
        )


class IsCompanyGuestReadOnly(permissions.BasePermission):
    """Read-only доступ для гостей компании."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.company_id is not None
            and request.user.role == UserRole.GUEST
            and request.method in permissions.SAFE_METHODS
        )

class IsCompanyMember(permissions.BasePermission):
    """
    Базовое разрешение для всех пользователей компании
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.company_id is not None

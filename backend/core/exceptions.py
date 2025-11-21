from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Кастомный обработчик исключений для стандартизации ответов с ошибками
    """
    if isinstance(exc, DjangoValidationError):
        exc = APIException(detail={
            'message': 'Ошибка валидации',
            'errors': exc.message_dict
        })
        exc.status_code = status.HTTP_400_BAD_REQUEST

    response = exception_handler(exc, context)
    
    if response is not None:
        # Стандартизируем формат ответа
        response.data = {
            'status': 'error',
            'message': str(exc.detail) if hasattr(exc, 'detail') else str(exc),
            'errors': response.data if isinstance(response.data, dict) else None
        }
    
    return response

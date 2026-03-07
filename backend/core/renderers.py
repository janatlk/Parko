from rest_framework.renderers import JSONRenderer
from rest_framework.utils.serializer_helpers import ReturnList, ReturnDict
import logging
import json
from datetime import date, datetime
from decimal import Decimal

logger = logging.getLogger(__name__)


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for Django model data"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, set):
            return list(obj)
        return super().default(obj)


class StandardJSONRenderer(JSONRenderer):
    """
    Стандартизированный JSON-рендерер.
    Оборачивает ответы в единый формат:
    {
        "status": "success" | "error",
        "data": {...} | [...],
        "message": "Описание ошибки" (опционально),
        "errors": {...} (опционально, для ошибок валидации)
    }
    """
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response')
        
        # For 204 No Content (DELETE), return empty response
        if response and response.status_code == 204:
            return b''
        
        # Handle empty data
        if data is None or data == b'' or data == {}:
            # Return success response with empty data
            rendered_data = {'status': 'success', 'data': None, 'message': 'Deleted successfully'}
            return json.dumps(
                rendered_data,
                cls=CustomJSONEncoder,
                ensure_ascii=False
            ).encode('utf-8')

        # Определяем статус ответа
        status = 'success' if response and response.status_code < 400 else 'error'

        # Подготавливаем структуру ответа
        if status == 'success':
            if isinstance(data, (ReturnList, list)):
                rendered_data = {'data': data}
            elif isinstance(data, (ReturnDict, dict)):
                rendered_data = {'data': data}
            else:
                rendered_data = {'data': data}
        else:
            rendered_data = {
                'message': data.get('detail', 'Произошла ошибка') if isinstance(data, dict) else str(data),
                'errors': data if isinstance(data, dict) else None
            }

        rendered_data['status'] = status

        # Use custom encoder for JSON serialization
        return json.dumps(
            rendered_data,
            cls=CustomJSONEncoder,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(',', ':')
        ).encode('utf-8')

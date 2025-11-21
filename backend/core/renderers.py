from rest_framework.renderers import JSONRenderer
from rest_framework.utils.serializer_helpers import ReturnList, ReturnDict

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
        
        # Определяем статус ответа
        status = 'success' if response and response.status_code < 400 else 'error'
        
        # Подготавливаем структуру ответа
        if status == 'success':
            if isinstance(data, (ReturnList, list)):
                rendered_data = {'data': data}
            elif isinstance(data, (ReturnDict, dict)):
                rendered_data = {'data': data}
            else:
                rendered_data = {'data': None}
        else:
            rendered_data = {
                'message': data.get('detail', 'Произошла ошибка'),
                'errors': data if isinstance(data, dict) else None
            }
            
        rendered_data['status'] = status
        
        return super().render(rendered_data, accepted_media_type, renderer_context)

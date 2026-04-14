"""
AI Chat Streaming View — Server-Sent Events (SSE) for Chain of Thought.
Streams AI thoughts and responses in real-time.
"""
import json
import logging
import time
from django.http import StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsCompanyMember
from ai.models import AIChatMessage, RoleChoices
from ai.services import ask_ai_streaming

logger = logging.getLogger(__name__)


def sse_format(data: dict) -> str:
    """Format data as SSE event."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCompanyMember])
def ai_chat_stream(request):
    """
    Stream AI response with Chain of Thought.
    POST /api/v1/ai/chat/stream/
    Body: {"message": "..."}
    
    Returns SSE stream with events:
    - type: "thought" — AI thinking process
    - type: "content" — final response content
    - type: "action" — action payload (if any)
    - type: "done" — stream completed
    - type: "error" — error occurred
    """
    user = request.user
    message_text = request.data.get('message', '').strip()
    
    if not message_text:
        return StreamingHttpResponse(
            [sse_format({"type": "error", "message": "Empty message"})],
            content_type='text/event-stream',
        )
    
    # Save user message
    AIChatMessage.objects.create(
        company=user.company,
        user=user,
        role=RoleChoices.USER,
        content=message_text,
    )
    
    def event_stream():
        try:
            for event in ask_ai_streaming(user, message_text):
                yield sse_format(event)
                # Small delay to prevent overwhelming the client
                time.sleep(0.01)
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield sse_format({"type": "error", "message": str(e)})
        
        yield sse_format({"type": "done"})
    
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream',
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
    return response

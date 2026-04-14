from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from core.permissions import IsCompanyMember
from ai.models import AIChatMessage, RoleChoices
from ai.serializers import (
    AIChatRequestSerializer,
    AIChatResponseSerializer,
    AIChatMessageSerializer,
    AIExecuteRequestSerializer,
)
from ai.services import ask_ai, ask_ai_with_action
from ai.tools import TOOL_REGISTRY


class AIChatView(APIView):
    """
    AI чат-ассистент для управления автопарком.
    POST /api/v1/ai/chat/ — отправить сообщение и получить ответ.
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def post(self, request):
        serializer = AIChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message_text = serializer.validated_data['message']
        user = request.user
        company = user.company

        # Save user message
        AIChatMessage.objects.create(
            company=company,
            user=user,
            role=RoleChoices.USER,
            content=message_text,
        )

        # Get AI response
        response_text = ask_ai(user, message_text)

        # Save assistant message
        AIChatMessage.objects.create(
            company=company,
            user=user,
            role=RoleChoices.ASSISTANT,
            content=response_text,
        )

        # Get recent conversation history
        conversation = AIChatMessage.objects.filter(
            company=company,
            user=user,
        ).order_by('-created_at')[:20]

        conversation_serializer = AIChatMessageSerializer(
            list(reversed(conversation)),
            many=True,
        )

        return Response({
            'response': response_text,
            'conversation': conversation_serializer.data,
        }, status=status.HTTP_200_OK)


class AIConversationView(APIView):
    """
    Получить историю переписки пользователя с AI.
    GET /api/v1/ai/conversation/?limit=20
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request):
        user = request.user
        company = user.company
        limit = int(request.query_params.get('limit', 20))

        messages = AIChatMessage.objects.filter(
            company=company,
            user=user,
        ).order_by('-created_at')[:limit]

        serializer = AIChatMessageSerializer(
            list(reversed(messages)),
            many=True,
        )

        return Response({
            'conversation': serializer.data,
        }, status=status.HTTP_200_OK)


class AIExecuteView(APIView):
    """
    Execute an AI-suggested action after user confirmation.
    POST /api/v1/ai/execute/
    Body: {"action": "tool_add_car", "params": {"brand": "BMW", ...}, "description": "..."}
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def post(self, request):
        serializer = AIExecuteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_name = serializer.validated_data['action']
        action_params = serializer.validated_data['params']
        description = request.data.get('description', '')
        user = request.user
        company = user.company

        # Validate that the action is a known tool
        if action_name not in TOOL_REGISTRY:
            return Response(
                {'error': f'Unknown action: {action_name}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save user's confirmation as a message
        if description:
            AIChatMessage.objects.create(
                company=company,
                user=user,
                role=RoleChoices.USER,
                content=f"[Action confirmed] {description}",
            )

        # Execute the action
        result_text = ask_ai_with_action(user, '', action_name, action_params)

        # Save assistant message with the result
        AIChatMessage.objects.create(
            company=company,
            user=user,
            role=RoleChoices.ASSISTANT,
            content=result_text,
        )

        return Response({
            'success': True,
            'action': action_name,
            'result': result_text,
        }, status=status.HTTP_200_OK)


class AIClearChatView(APIView):
    """
    Clear AI chat history for the current user.
    DELETE /api/v1/ai/messages/
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def delete(self, request):
        user = request.user
        company = user.company

        AIChatMessage.objects.filter(company=company, user=user).delete()

        return Response({'success': True}, status=status.HTTP_200_OK)

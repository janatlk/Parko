import random

from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from core.permissions import IsCompanyMember
from ai.models import AIConversation, AIChatMessage, RoleChoices
from ai.serializers import (
    AIChatRequestSerializer,
    AIChatResponseSerializer,
    AIChatMessageSerializer,
    AIExecuteRequestSerializer,
    AIConversationListSerializer,
    AIConversationDetailSerializer,
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
        conversation_id = serializer.validated_data.get('conversation_id')
        user = request.user
        company = user.company

        # Get or create conversation
        if conversation_id:
            conversation = AIConversation.objects.filter(
                id=conversation_id,
                company=company,
                user=user,
            ).first()
            if not conversation:
                return Response(
                    {'error': 'Conversation not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            # Create new conversation
            conversation = AIConversation.objects.create(
                company=company,
                user=user,
                title=message_text[:100] if len(message_text) > 100 else message_text,
            )

        # Save user message
        AIChatMessage.objects.create(
            conversation=conversation,
            company=company,
            user=user,
            role=RoleChoices.USER,
            content=message_text,
        )

        # Get AI response
        response_text = ask_ai(user, message_text, conversation=conversation)

        # Save AI response
        AIChatMessage.objects.create(
            conversation=conversation,
            company=company,
            user=user,
            role=RoleChoices.ASSISTANT,
            content=response_text,
        )

        # Update conversation title if it's still "New Chat"
        if conversation.title == 'New Chat':
            conversation.title = message_text[:100] if len(message_text) > 100 else message_text
            conversation.save(update_fields=['title', 'updated_at'])
        else:
            # Just update the updated_at
            conversation.save(update_fields=['updated_at'])

        # Get conversation history (last 20 messages)
        messages = AIChatMessage.objects.filter(
            conversation=conversation,
        ).order_by('-created_at')[:20]

        message_serializer = AIChatMessageSerializer(
            list(reversed(messages)),
            many=True,
        )

        return Response({
            'response': response_text,
            'conversation': message_serializer.data,
            'conversation_id': conversation.id,
            'conversation_title': conversation.title,
        }, status=status.HTTP_200_OK)


class AIConversationView(APIView):
    """
    Получить список сессий (разговоров) пользователя.
    GET /api/v1/ai/conversations/ — список всех разговоров
    GET /api/v1/ai/conversations/{id}/ — конкретный разговор с сообщениями
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request, conversation_id=None):
        user = request.user
        company = user.company

        if conversation_id:
            # Get specific conversation with messages
            conversation = AIConversation.objects.filter(
                id=conversation_id,
                company=company,
                user=user,
            ).first()

            if not conversation:
                return Response(
                    {'error': 'Conversation not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            messages = AIChatMessage.objects.filter(
                conversation=conversation,
            ).order_by('created_at')

            message_serializer = AIChatMessageSerializer(messages, many=True)

            return Response({
                'id': conversation.id,
                'title': conversation.title,
                'created_at': conversation.created_at,
                'updated_at': conversation.updated_at,
                'messages': message_serializer.data,
            })
        else:
            # List all conversations
            conversations = AIConversation.objects.filter(
                company=company,
                user=user,
            ).order_by('-updated_at')

            conversation_list = []
            for conv in conversations:
                message_count = AIChatMessage.objects.filter(conversation=conv).count()
                conversation_list.append({
                    'id': conv.id,
                    'title': conv.title,
                    'created_at': conv.created_at,
                    'updated_at': conv.updated_at,
                    'message_count': message_count,
                })

            return Response({
                'conversations': conversation_list,
            })


class AIExecuteView(APIView):
    """
    Execute an AI-suggested action after user confirmation.
    POST /api/v1/ai/execute/
    Body: {"action": "tool_add_car", "params": {...}, "conversation_id": 123}
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def post(self, request):
        serializer = AIExecuteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_name = serializer.validated_data['action']
        action_params = serializer.validated_data['params']
        conversation_id = serializer.validated_data['conversation_id']
        user = request.user
        company = user.company

        # Get conversation
        conversation = AIConversation.objects.filter(
            id=conversation_id,
            company=company,
            user=user,
        ).first()

        if not conversation:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate that the action is a known tool
        if action_name not in TOOL_REGISTRY:
            return Response(
                {'error': f'Unknown action: {action_name}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Execute the action
        result_text = ask_ai_with_action(user, '', action_name, action_params)

        # Save the result as an assistant message in the conversation
        AIChatMessage.objects.create(
            conversation=conversation,
            company=company,
            user=user,
            role=RoleChoices.ASSISTANT,
            content=result_text,
        )

        # Update conversation timestamp
        conversation.save(update_fields=['updated_at'])

        return Response({
            'success': True,
            'action': action_name,
            'result': result_text,
            'conversation_id': conversation.id,
        }, status=status.HTTP_200_OK)


class AIClearChatView(APIView):
    """
    Clear AI chat history.
    DELETE /api/v1/ai/messages/?conversation_id=123 — clear specific conversation
    DELETE /api/v1/ai/messages/ — clear all conversations for user
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def delete(self, request):
        user = request.user
        company = user.company
        conversation_id = request.query_params.get('conversation_id')

        if conversation_id:
            # Clear specific conversation
            conversation = AIConversation.objects.filter(
                id=conversation_id,
                company=company,
                user=user,
            ).first()

            if not conversation:
                return Response(
                    {'error': 'Conversation not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Delete messages and conversation
            AIChatMessage.objects.filter(conversation=conversation).delete()
            conversation.delete()
        else:
            # Clear all conversations and messages for user
            conversations = AIConversation.objects.filter(company=company, user=user)
            AIChatMessage.objects.filter(company=company, user=user).delete()
            conversations.delete()

        return Response({'success': True}, status=status.HTTP_200_OK)


class AIDeleteConversationView(APIView):
    """
    Delete a specific conversation.
    DELETE /api/v1/ai/conversations/{id}/
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def delete(self, request, conversation_id):
        user = request.user
        company = user.company

        conversation = AIConversation.objects.filter(
            id=conversation_id,
            company=company,
            user=user,
        ).first()

        if not conversation:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Delete messages and conversation
        AIChatMessage.objects.filter(conversation=conversation).delete()
        conversation.delete()

        return Response({'success': True}, status=status.HTTP_200_OK)


class AISuggestionsView(APIView):
    """
    Generate dynamic chat suggestions based on the user's company data.
    GET /api/v1/ai/suggestions/
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request):
        from fleet.models import Car, Fuel, Insurance, Inspection, Spare

        company = request.user.company
        now = timezone.now()
        suggestions = []

        # --- Data-driven suggestions ---
        cars = list(Car.objects.filter(company=company).values('id', 'brand', 'title', 'numplate', 'status')[:20])
        total_cars = len(cars)

        # 1. Fleet overview
        if total_cars > 0:
            suggestions.append({
                'text': f'Покажи все {total_cars} автомобилей',
                'icon': '🚗',
                'category': 'fleet',
            })

        # 2. Fuel suggestion for a specific car
        if cars:
            car = random.choice(cars)
            suggestions.append({
                'text': f'Покажи расход топлива для {car["brand"]} {car["title"]} `{car["numplate"]}`',
                'icon': '⛽',
                'category': 'fuel',
            })

        # 3. Expiring insurance check
        expiring_soon = Insurance.objects.filter(
            car__company=company,
            end_date__gte=now.date(),
            end_date__lte=now.date() + timedelta(days=30),
        ).count()
        if expiring_soon > 0:
            suggestions.append({
                'text': f'Какие страховки истекают в ближайший месяц? ({expiring_soon} шт.)',
                'icon': '📋',
                'category': 'insurance',
            })
        else:
            suggestions.append({
                'text': 'Покажи статус страховок',
                'icon': '📋',
                'category': 'insurance',
            })

        # 4. Fuel analytics
        current_month = now.month
        current_year = now.year
        fuel_this_month = Fuel.objects.filter(
            car__company=company,
            month=current_month,
            year=current_year,
        ).aggregate(total=Sum('liters'))['total']
        if fuel_this_month:
            suggestions.append({
                'text': f'Анализ расходов на топливо за {now.strftime("%B %Y")}',
                'icon': '📊',
                'category': 'analytics',
            })
        else:
            suggestions.append({
                'text': 'Покажи расходы на топливо за последние месяцы',
                'icon': '📊',
                'category': 'analytics',
            })

        # 5. Add fuel for a specific car
        if cars:
            car = random.choice(cars)
            suggestions.append({
                'text': f'Добавь топливо для {car["brand"]} {car["title"]} `{car["numplate"]}`',
                'icon': '➕',
                'category': 'action',
            })

        # 6. Maintenance
        maintenance_count = Spare.objects.filter(car__company=company).count()
        if maintenance_count > 0:
            suggestions.append({
                'text': 'Покажи все расходы на ТО и запчасти',
                'icon': '🔧',
                'category': 'maintenance',
            })

        # Shuffle and pick top 4
        random.shuffle(suggestions)
        suggestions = suggestions[:4]

        return Response({'suggestions': suggestions})

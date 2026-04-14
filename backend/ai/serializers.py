from rest_framework import serializers


class AIChatRequestSerializer(serializers.Serializer):
    """Serializer for AI chat request."""
    message = serializers.CharField(
        max_length=4000,
        required=True,
        help_text='Сообщение пользователя для AI-ассистента',
    )


class AIExecuteRequestSerializer(serializers.Serializer):
    """Serializer for executing AI-suggested actions."""
    action = serializers.CharField(
        required=True,
        help_text='Tool function name (e.g., "tool_add_car")',
    )
    params = serializers.DictField(
        required=True,
        help_text='Parameters for the tool function',
    )


class AIChatMessageSerializer(serializers.Serializer):
    """Serializer for a single chat message in conversation history."""
    role = serializers.CharField()
    content = serializers.CharField()
    created_at = serializers.DateTimeField()


class AIChatResponseSerializer(serializers.Serializer):
    """Serializer for AI chat response."""
    response = serializers.CharField(help_text='Ответ AI-ассистента')
    conversation = AIChatMessageSerializer(many=True, help_text='История сообщений')
    action = serializers.CharField(
        required=False,
        allow_null=True,
        help_text='Action name if an action was executed',
    )
    action_result = serializers.CharField(
        required=False,
        allow_null=True,
        help_text='Result of the executed action',
    )

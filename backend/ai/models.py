from django.db import models


class RoleChoices(models.TextChoices):
    USER = 'user', 'User'
    ASSISTANT = 'assistant', 'Assistant'


class AIConversation(models.Model):
    """
    Хранение сессий (разговоров) с AI-ассистентом.
    Каждая сессия привязана к компании и пользователю.
    """

    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='ai_conversations',
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='ai_conversations',
    )
    title = models.CharField(
        max_length=200,
        default='New Chat',
        help_text='Auto-generated from first user message',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['company', 'user', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class AIChatMessage(models.Model):
    """
    Хранение сообщений чата с AI-ассистентом.
    Каждая запись привязана к сессии (разговору).
    """

    conversation = models.ForeignKey(
        'ai.AIConversation',
        on_delete=models.CASCADE,
        related_name='messages',
        null=True,
        blank=True,
        help_text='Сессия разговора (None для legacy сообщений)',
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='ai_messages',
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='ai_messages',
    )
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', '-created_at']),
            models.Index(fields=['company', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."

from django.db import models


class RoleChoices(models.TextChoices):
    USER = 'user', 'User'
    ASSISTANT = 'assistant', 'Assistant'


class AIChatMessage(models.Model):
    """
    Хранение сообщений чата с AI-ассистентом.
    Каждая запись привязана к компании для изоляции данных.
    """

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
            models.Index(fields=['company', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."

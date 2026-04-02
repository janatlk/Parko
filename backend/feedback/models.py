from django.db import models


class Feedback(models.Model):
    """Модель для формы обратной связи на лендинге"""
    
    name = models.CharField(max_length=100, blank=True, verbose_name='Имя')
    email = models.EmailField(blank=True, verbose_name='Email')
    message = models.TextField(verbose_name='Сообщение')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP адрес')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Обратная связь'
        verbose_name_plural = 'Обратная связь'

    def __str__(self):
        return f'Feedback from {self.name or "Anonymous"} - {self.created_at.strftime("%Y-%m-%d")}'

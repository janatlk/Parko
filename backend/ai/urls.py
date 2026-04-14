from django.urls import path

from ai.views import (
    AIChatView,
    AIConversationView,
    AIExecuteView,
    AIClearChatView,
    AIDeleteConversationView,
)

urlpatterns = [
    path('chat/', AIChatView.as_view(), name='ai-chat'),
    path('conversations/', AIConversationView.as_view(), name='ai-conversations-list'),
    path('conversations/<int:conversation_id>/', AIConversationView.as_view(), name='ai-conversation-detail'),
    path('execute/', AIExecuteView.as_view(), name='ai-execute'),
    path('messages/', AIClearChatView.as_view(), name='ai-clear'),
    path('conversations/<int:conversation_id>/delete/', AIDeleteConversationView.as_view(), name='ai-delete-conversation'),
]

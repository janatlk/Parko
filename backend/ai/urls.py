from django.urls import path

from ai.views import AIChatView, AIConversationView, AIExecuteView, AIClearChatView

urlpatterns = [
    path('chat/', AIChatView.as_view(), name='ai-chat'),
    path('conversation/', AIConversationView.as_view(), name='ai-conversation'),
    path('execute/', AIExecuteView.as_view(), name='ai-execute'),
    path('messages/', AIClearChatView.as_view(), name='ai-clear'),
]

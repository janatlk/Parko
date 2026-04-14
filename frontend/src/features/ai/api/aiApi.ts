import { http } from '@shared/api/http'

export type AIMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
  timestamp?: string
}

export type AIConversationSummary = {
  id: number
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export type AIConversationDetail = {
  id: number
  title: string
  created_at: string
  updated_at: string
  messages: AIMessage[]
}

export type AIResponse = {
  response: string
  conversation: AIMessage[]
  conversation_id: number
  conversation_title: string
}

export type AIErrorResponse = {
  error: string
  detail?: string
}

export async function sendAIMessage(
  message: string,
  conversationId?: number | null,
): Promise<AIResponse> {
  const { data } = await http.post<AIResponse>('ai/chat/', {
    message,
    conversation_id: conversationId,
  })
  return data
}

export async function getAIConversations(): Promise<AIConversationSummary[]> {
  const { data } = await http.get<{ conversations: AIConversationSummary[] }>('ai/conversations/')
  return data.conversations || []
}

export async function getAIConversation(conversationId: number): Promise<AIConversationDetail> {
  const { data } = await http.get<AIConversationDetail>(`ai/conversations/${conversationId}/`)
  return data
}

export async function deleteConversation(conversationId: number): Promise<void> {
  await http.delete(`ai/conversations/${conversationId}/delete/`)
}

export async function clearAllChats(conversationId?: number): Promise<void> {
  const url = conversationId
    ? `ai/messages/?conversation_id=${conversationId}`
    : 'ai/messages/'
  await http.delete(url)
}

export async function executeAIAction(
  action: string,
  params: Record<string, unknown>,
  conversationId: number,
): Promise<{ response: string; success: boolean; result?: string; conversation_id: number }> {
  const { data } = await http.post('ai/execute/', {
    action,
    params,
    conversation_id: conversationId,
  })
  return data
}

import { http } from '@shared/api/http'

export type AIMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
  timestamp?: string
}

export type AIResponse = {
  response: string
  conversation: AIMessage[]
}

export type AIErrorResponse = {
  error: string
  detail?: string
}

export async function sendAIMessage(message: string): Promise<AIResponse> {
  const { data } = await http.post<AIResponse>('ai/chat/', { message })
  return data
}

export async function getAIConversation(): Promise<AIMessage[]> {
  const { data } = await http.get<{ conversation: AIMessage[] }>('ai/conversation/')
  return data.conversation || []
}

export async function executeAIAction(action: string, params: Record<string, unknown>): Promise<{ response: string; success: boolean; result?: string }> {
  const { data } = await http.post('ai/execute/', { action, params })
  return data
}

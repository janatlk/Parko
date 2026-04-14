import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AIMessage, AIConversationSummary, AIResponse } from '../api/aiApi'
import {
  executeAIAction,
  getAIConversation,
  getAIConversations,
  sendAIMessage,
  deleteConversation,
} from '../api/aiApi'

const aiKeys = {
  all: ['ai'] as const,
  conversations: () => [...aiKeys.all, 'conversations'] as const,
  conversation: (id?: number) => [...aiKeys.all, 'conversation', id] as const,
}

export function useAIConversations() {
  return useQuery<AIConversationSummary[]>({
    queryKey: aiKeys.conversations(),
    queryFn: getAIConversations,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAIConversation(conversationId?: number) {
  return useQuery<AIMessage[]>({
    queryKey: aiKeys.conversation(conversationId),
    queryFn: () => getAIConversation(conversationId!).then((data) => data.messages),
    staleTime: 1000 * 60 * 5,
    enabled: !!conversationId,
  })
}

export function useSendAIMessage() {
  const qc = useQueryClient()
  return useMutation<AIResponse, unknown, { message: string; conversationId?: number | null }>({
    mutationFn: ({ message, conversationId }) => sendAIMessage(message, conversationId),
    onSuccess: async (data) => {
      // Invalidate conversations list to show new conversation
      await qc.invalidateQueries({ queryKey: aiKeys.conversations() })
      // Invalidate specific conversation
      if (data.conversation_id) {
        await qc.invalidateQueries({ queryKey: aiKeys.conversation(data.conversation_id) })
      }
    },
  })
}

export function useExecuteAIAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      action,
      params,
      conversationId,
    }: {
      action: string
      params: Record<string, unknown>
      conversationId: number
    }) => executeAIAction(action, params, conversationId),
    onSuccess: async (data) => {
      if (data.conversation_id) {
        await qc.invalidateQueries({ queryKey: aiKeys.conversation(data.conversation_id) })
      }
    },
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (conversationId: number) => deleteConversation(conversationId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: aiKeys.conversations() })
    },
  })
}

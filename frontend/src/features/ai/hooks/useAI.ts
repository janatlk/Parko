import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AIMessage } from '../api/aiApi'
import { executeAIAction, getAIConversation, sendAIMessage } from '../api/aiApi'

const aiKeys = {
  all: ['ai'] as const,
  conversation: () => [...aiKeys.all, 'conversation'] as const,
}

export function useAIConversation() {
  return useQuery<AIMessage[]>({
    queryKey: aiKeys.conversation(),
    queryFn: getAIConversation,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSendAIMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => sendAIMessage(message),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: aiKeys.conversation() })
    },
  })
}

export function useExecuteAIAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ action, params }: { action: string; params: Record<string, unknown> }) =>
      executeAIAction(action, params),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: aiKeys.conversation() })
    },
  })
}

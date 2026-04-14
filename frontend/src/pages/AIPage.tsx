import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Tooltip,
  Divider,
  rem,
} from '@mantine/core'
import {
  IconBrain,
  IconSend2,
  IconAlertTriangle,
  IconMessage,
  IconCheck,
  IconX,
  IconTrash,
  IconPlus,
  IconHistory,
  IconUser,
  IconSparkles,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useAIConversation, useSendAIMessage, useExecuteAIAction } from '@features/ai/hooks/useAI'
import { MarkdownText } from '@features/ai/ui/MarkdownText'
import { parseActionsFromContent } from '@features/ai/ui/parseAction'
import { http } from '@shared/api/http'

type ActionPayload = {
  action: string
  params: Record<string, unknown>
  description: string
}

type MessageWithAction = {
  role: 'user' | 'assistant'
  content: string
  actions: ActionPayload[]
  id?: number
  timestamp: string
}

type ChatSession = {
  id: string
  title: string
  messages: MessageWithAction[]
  createdAt: string
}

type ExecutionResult = {
  messageId: number
  actionIndex: number
  success: boolean
  response: string
}

const getSessionsKey = (companyId: number) => `parko_ai_sessions_${companyId}`
const getCurrentKey = (companyId: number) => `parko_ai_current_session_${companyId}`
const getInputKey = (companyId: number) => `parko_ai_draft_${companyId}`

function getSessions(companyId: number): ChatSession[] {
  try {
    const stored = localStorage.getItem(getSessionsKey(companyId))
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveSessions(companyId: number, sessions: ChatSession[]) {
  localStorage.setItem(getSessionsKey(companyId), JSON.stringify(sessions))
}

function getCurrentSessionId(companyId: number): string | null {
  return localStorage.getItem(getCurrentKey(companyId))
}

function setCurrentSessionId(companyId: number, id: string | null) {
  if (id) {
    localStorage.setItem(getCurrentKey(companyId), id)
  } else {
    localStorage.removeItem(getCurrentKey(companyId))
  }
}

function getInputValue(companyId: number): string {
  return localStorage.getItem(getInputKey(companyId)) || ''
}

function setInputValue(companyId: number, value: string) {
  if (value) {
    localStorage.setItem(getInputKey(companyId), value)
  } else {
    localStorage.removeItem(getInputKey(companyId))
  }
}

function getSessionTitle(messages: MessageWithAction[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (firstUser) {
    const text = firstUser.content
    return text.length > 40 ? text.slice(0, 40) + '...' : text
  }
  return 'New chat'
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function AIPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const companyId = user?.company ?? 0

  // Restore draft input (company-scoped)
  const [input, setInput] = useState(() => getInputValue(companyId))

  // Save draft input (company-scoped)
  useEffect(() => {
    setInputValue(companyId, input)
  }, [input, companyId])

  const [localMessages, setLocalMessages] = useState<MessageWithAction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [executions, setExecutions] = useState<ExecutionResult[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const messageIdCounter = useRef(0)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const currentSessionIdRef = useRef<string | null>(null)
  const [sidebarCurrentId, setSidebarCurrentId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const { data: conversation, isLoading: isFetching } = useAIConversation()
  const { mutate: sendMessage, isPending } = useSendAIMessage()
  const { mutate: executeAction, isPending: isExecuting } = useExecuteAIAction()

  // Reset everything when company changes
  useEffect(() => {
    if (companyId === 0) return

    // Clear local messages and state for new company
    setLocalMessages([])
    setExecutions([])
    setInitialized(false)
    messageIdCounter.current = 0

    setSessions(getSessions(companyId))
    const storedId = getCurrentSessionId(companyId)
    setSidebarCurrentId(storedId)
    currentSessionIdRef.current = storedId

    // Try to restore from localStorage first
    if (storedId) {
      const stored = getSessions(companyId)
      const session = stored.find((s) => s.id === storedId)
      if (session) {
        setLocalMessages(session.messages)
        messageIdCounter.current = session.messages.reduce((max, m) => Math.max(max, m.id || 0), 0)
        setInitialized(true)
        return
      }
    }

    setInitialized(true)
  }, [companyId])

  // Fallback: load from server if localStorage is empty
  useEffect(() => {
    if (initialized) return // already loaded from localStorage
    if (!conversation || conversation.length === 0) return

    const formatted = conversation.map((msg) => {
      const parsed = parseActionsFromContent(msg.content)
      const id = ++messageIdCounter.current
      return {
        role: msg.role as 'user' | 'assistant',
        content: parsed.text,
        actions: parsed.actions,
        id,
        timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
      }
    })
    setLocalMessages(formatted)
    setInitialized(true)
  }, [conversation, initialized])

  // Save session — debounced, company-scoped
  const saveCurrentSession = useCallback(() => {
    if (localMessages.length === 0 || companyId === 0) return

    const currentId = getCurrentSessionId(companyId)
    const sessions = getSessions(companyId)
    let session = sessions.find((s) => s.id === currentId)

    if (!session) {
      session = {
        id: Date.now().toString(),
        title: getSessionTitle(localMessages),
        messages: localMessages,
        createdAt: new Date().toISOString(),
      }
      sessions.unshift(session)
    } else {
      session.messages = localMessages
      session.title = getSessionTitle(localMessages)
    }

    saveSessions(companyId, sessions)
    setSessions(sessions)
    if (currentId) {
      currentSessionIdRef.current = currentId
      setSidebarCurrentId(currentId)
    }
  }, [localMessages, companyId])

  // Only persist session periodically (debounced), not on every render
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    if (localMessages.length === 0) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveCurrentSession()
    }, 1000)
    return () => clearTimeout(saveTimerRef.current)
  }, [localMessages, saveCurrentSession, companyId])

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [localMessages, isPending])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isPending) return

    setError(null)
    setLocalMessages((prev) => [
      ...prev,
      { role: 'user' as const, content: trimmed, actions: [], timestamp: new Date().toISOString() },
    ])
    setInput('')

    sendMessage(trimmed, {
      onSuccess: (data) => {
        const parsed = parseActionsFromContent(data.response)
        const id = ++messageIdCounter.current
        setLocalMessages((prev) => [
          ...prev,
          {
            role: 'assistant' as const,
            content: parsed.text,
            actions: parsed.actions,
            id,
            timestamp: new Date().toISOString(),
          },
        ])
      },
      onError: (err: unknown) => {
        const apiError = err as { response?: { data?: { error?: string; detail?: string } } }
        const errorDetail = apiError.response?.data?.detail || apiError.response?.data?.error
        
        let errorType = 'failed'
        if (errorDetail?.includes('API') || errorDetail?.includes('api')) {
          errorType = 'no_api_key'
        } else if (errorDetail?.includes('refused') || errorDetail?.includes('refusal')) {
          errorType = 'refused'
        }
        
        setError(errorType)
        
        // Add error message to chat
        const id = ++messageIdCounter.current
        let errorMessage = '❌ Произошла ошибка при обработке запроса.'
        if (errorDetail) {
          errorMessage += `\n\n📋 Детали: ${errorDetail}`
        }
        if (errorType === 'no_api_key') {
          errorMessage = '🔑 AI-ассистент временно недоступен: API-ключ не настроен.\n\nОбратитесь к администратору системы для настройки интеграции с Groq AI.'
        } else if (errorType === 'refused') {
          errorMessage = '⚠️ AI-ассистент отказался выполнять запрос.\n\nВозможно, запрос не соответствует тематике системы управления автопарком.'
        }
        errorMessage += '\n\n💡 Попробуйте переформулировать запрос или повторите попытку.'
        
        setLocalMessages((prev) => [
          ...prev,
          {
            role: 'assistant' as const,
            content: errorMessage,
            actions: [],
            id,
            timestamp: new Date().toISOString(),
          },
        ])
        
        // Remove the user message that caused the error
        setLocalMessages((prev) => prev.filter((m) => m.content !== trimmed || m.role !== 'user'))
      },
    })
  }, [input, isPending, sendMessage])

  const handleConfirmAction = useCallback(
    (messageId: number, actionIndex: number, action: string, params: Record<string, unknown>) => {
      executeAction({ action, params }, {
        onSuccess: (data) => {
          setExecutions((prev) => [...prev, { messageId, actionIndex, success: data.success, response: data.result || data.response }])
          const id = ++messageIdCounter.current
          setLocalMessages((prev) => [
            ...prev,
            { role: 'assistant' as const, content: data.result || data.response || 'Действие выполнено.', actions: [], id, timestamp: new Date().toISOString() },
          ])
        },
        onError: () => {
          setExecutions((prev) => [...prev, { messageId, actionIndex, success: false, response: '' }])
          const id = ++messageIdCounter.current
          setLocalMessages((prev) => [
            ...prev,
            { role: 'assistant' as const, content: t('ai.action_failed'), actions: [], id, timestamp: new Date().toISOString() },
          ])
        },
      })
    },
    [executeAction, t],
  )

  const handleCancelAction = useCallback((messageId: number, actionIndex: number) => {
    setExecutions((prev) => [...prev, { messageId, actionIndex, success: false, response: '' }])
  }, [])

  const handleConfirmAllActions = useCallback((messageId: number, actions: ActionPayload[]) => {
    // Execute all actions sequentially
    actions.forEach((act, idx) => {
      const alreadyExecuted = executions.some((e) => e.messageId === messageId && e.actionIndex === idx)
      if (alreadyExecuted) return

      executeAction({ action: act.action, params: act.params }, {
        onSuccess: (data) => {
          setExecutions((prev) => [...prev, { messageId, actionIndex: idx, success: data.success, response: data.result || data.response }])
        },
        onError: () => {
          setExecutions((prev) => [...prev, { messageId, actionIndex: idx, success: false, response: '' }])
        },
      })
    })
  }, [executeAction, executions])

  const handleCancelAllActions = useCallback((messageId: number, actions: ActionPayload[]) => {
    actions.forEach((_, idx) => {
      setExecutions((prev) => [...prev, { messageId, actionIndex: idx, success: false, response: '' }])
    })
  }, [])

  const handleNewChat = useCallback(() => {
    if (localMessages.length > 0) {
      saveCurrentSession()
    }
    setLocalMessages([])
    setExecutions([])
    currentSessionIdRef.current = null
    setCurrentSessionId(companyId, null)
    setSidebarCurrentId(null)
    setSidebarOpen(false)
    messageIdCounter.current = 0
  }, [localMessages, saveCurrentSession, companyId])

  const handleLoadSession = useCallback((session: ChatSession) => {
    currentSessionIdRef.current = session.id
    setCurrentSessionId(companyId, session.id)
    setSidebarCurrentId(session.id)
    setLocalMessages(session.messages)
    setExecutions([])
    messageIdCounter.current = session.messages.reduce((max, m) => Math.max(max, m.id || 0), 0)
    setSidebarOpen(false)
  }, [companyId])

  const handleDeleteSession = useCallback((sessionId: string) => {
    const sessions = getSessions(companyId).filter((s) => s.id !== sessionId)
    saveSessions(companyId, sessions)
    setSessions(sessions)
    if (currentSessionIdRef.current === sessionId) {
      setLocalMessages([])
      currentSessionIdRef.current = null
      setCurrentSessionId(companyId, null)
      setSidebarCurrentId(null)
    }
  }, [companyId])

  const handleClearChat = useCallback(async () => {
    try {
      if (localMessages.length > 0) {
        saveCurrentSession()
      }
      await http.delete('ai/messages/')
      handleNewChat()
    } catch {
      // ignore
    }
  }, [localMessages, saveCurrentSession, handleNewChat])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = localMessages.length === 0 && !isFetching

  return (
    <Box
      style={{
        height: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header — fixed */}
      <Box style={{ flexShrink: 0 }}>
        <Paper p="sm" radius="md" withBorder>
          <Group justify="space-between">
            <Group gap="sm">
              <Tooltip label={t('ai.history') || 'Chat history'}>
                <ActionIcon variant="subtle" size="md" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <IconHistory size={18} />
                </ActionIcon>
              </Tooltip>
              <IconBrain size={28} stroke={1.5} />
              <div>
                <Text size="lg" fw={700}>
                  {t('ai.title')}
                </Text>
                <Text size="xs" c="dimmed">
                  {t('ai.subtitle')}
                </Text>
              </div>
            </Group>
            <Group gap="xs">
              {!isEmpty && (
                <Tooltip label={t('ai.new_chat') || 'New chat'}>
                  <ActionIcon variant="subtle" size="md" onClick={handleNewChat}>
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
              {!isEmpty && (
                <Tooltip label={t('ai.clear_chat') || 'Clear chat'}>
                  <ActionIcon variant="subtle" color="red" size="md" onClick={handleClearChat}>
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>
        </Paper>
      </Box>

      {/* Error Alert — fixed */}
      {error && (
        <Box style={{ flexShrink: 0 }}>
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t('common.error')}
            color="orange"
            withCloseButton
            onClose={() => setError(null)}
          >
            <Text size="sm">{t(`ai.error_${error}`)}</Text>
          </Alert>
        </Box>
      )}

      {/* Messages Area — scrollable, takes remaining space */}
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {isEmpty ? (
          <Stack align="center" justify="center" h="100%" gap="xl" p="xl">
            <Box
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--mantine-color-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSparkles size={40} color="var(--mantine-color-blue-6)" />
            </Box>
            <Text size="xl" fw={700} ta="center">
              {t('ai.welcome_title')}
            </Text>
            <Text size="sm" c="dimmed" ta="center" maw={400} lh={1.6}>
              {t('ai.welcome_subtitle')}
            </Text>
            <Stack gap="xs" mt="md" maw={400}>
              {['Какие машины в автопарке?', 'Добавь топливо для машины #1', 'Покажи расходы на запчасти'].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="light"
                  size="xs"
                  radius="xl"
                  fullWidth
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </Stack>
          </Stack>
        ) : (
          <ScrollArea style={{ flex: 1 }} viewportRef={viewportRef as React.RefObject<HTMLDivElement>} ref={scrollRef}>
            <Stack p="md" gap="lg">
              {localMessages.map((msg) => {
                const isUser = msg.role === 'user'

                return (
                  <Group
                    key={msg.id}
                    gap="xs"
                    wrap="nowrap"
                    style={{
                      flexDirection: isUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Avatar
                      size={32}
                      radius="xl"
                      color={isUser ? 'blue' : undefined}
                      variant={isUser ? 'filled' : 'light'}
                    >
                      {isUser ? <IconUser size={18} /> : <IconBrain size={18} />}
                    </Avatar>
                    <Stack gap={2} style={{ maxWidth: '70%' }}>
                      <Paper
                        p="sm"
                        style={{
                          borderRadius: isUser
                            ? 'var(--mantine-radius-md) var(--mantine-radius-md) 4px var(--mantine-radius-md)'
                            : 'var(--mantine-radius-md) var(--mantine-radius-md) var(--mantine-radius-md) 4px',
                          background: isUser ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-gray-0)',
                          color: isUser ? '#ffffff' : undefined,
                        }}
                      >
                        {isUser ? (
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {msg.content}
                          </Text>
                        ) : (
                          <MarkdownText content={msg.content} />
                        )}

                        {/* Action buttons INSIDE bubble — supports multiple actions */}
                        {msg.actions.length > 0 && (
                          <>
                            <Divider my="sm" />
                            {msg.actions.map((act, idx) => {
                              const actionExecution = executions.find(
                                (e) => e.messageId === msg.id && e.actionIndex === idx
                              )
                              const isActionExecuted = !!actionExecution

                              // Skip rendering if this action was already executed/cancelled
                              if (isActionExecuted) {
                                return null
                              }

                              return (
                                <Box key={`${msg.id}-${idx}`} mb="xs">
                                  <Text size="xs" fw={600} c="orange.7" mb={4}>
                                    ⚙️ {t('ai.action_pending') || 'Запланированное действие:'} {idx + 1}/{msg.actions.length}
                                  </Text>
                                  <Text size="xs" c="dimmed" mb="xs" style={{ whiteSpace: 'pre-wrap' }}>
                                    {act.description || `${act.action} — ${JSON.stringify(act.params)}`}
                                  </Text>
                                  <Group gap="xs">
                                    <Button
                                      size="xs"
                                      color="green"
                                      variant="light"
                                      leftSection={<IconCheck size={14} />}
                                      onClick={() => handleConfirmAction(msg.id!, idx, act.action, act.params)}
                                      loading={isExecuting}
                                      disabled={isExecuting}
                                    >
                                      {t('ai.confirm')}
                                    </Button>
                                    <Button
                                      size="xs"
                                      color="red"
                                      variant="light"
                                      leftSection={<IconX size={14} />}
                                      onClick={() => handleCancelAction(msg.id!, idx)}
                                      disabled={isExecuting}
                                    >
                                      {t('ai.cancel')}
                                    </Button>
                                  </Group>
                                </Box>
                              )
                            })}
                            {/* Bulk action buttons when multiple actions pending */}
                            {msg.actions.length > 1 && (
                              <>
                                <Divider my="xs" />
                                <Group gap="xs">
                                  <Button
                                    size="xs"
                                    color="green"
                                    variant="filled"
                                    leftSection={<IconCheck size={14} />}
                                    onClick={() => handleConfirmAllActions(msg.id!, msg.actions)}
                                    loading={isExecuting}
                                    disabled={isExecuting}
                                  >
                                    {t('ai.confirm_all') || 'Подтвердить все'}
                                  </Button>
                                  <Button
                                    size="xs"
                                    color="red"
                                    variant="filled"
                                    leftSection={<IconX size={14} />}
                                    onClick={() => handleCancelAllActions(msg.id!, msg.actions)}
                                    disabled={isExecuting}
                                  >
                                    {t('ai.cancel_all') || 'Отменить все'}
                                  </Button>
                                </Group>
                              </>
                            )}
                          </>
                        )}
                        {/* Show executed actions */}
                        {msg.actions.length > 0 && executions.some((e) => e.messageId === msg.id) && (
                          <>
                            <Divider my="sm" />
                            <Stack gap="xs">
                              {executions
                                .filter((e) => e.messageId === msg.id)
                                .map((execution, idx) => (
                                  <Group key={idx} gap="xs">
                                    {execution.success ? (
                                      <>
                                        <IconCheck size={16} color="green" />
                                        <Text size="xs" c="green">{t('ai.action_success')} ({idx + 1})</Text>
                                      </>
                                    ) : (
                                      <>
                                        <IconX size={16} color="red" />
                                        <Text size="xs" c="red">{t('ai.action_failed')} ({idx + 1})</Text>
                                      </>
                                    )}
                                  </Group>
                                ))}
                            </Stack>
                          </>
                        )}
                        {msg.actions.length > 0 && isExecuting && (
                          <>
                            <Divider my="sm" />
                            <Group gap="xs">
                              <Loader size="xs" />
                              <Text size="xs" c="dimmed">{t('ai.executing')}</Text>
                            </Group>
                          </>
                        )}
                      </Paper>
                      <Text size="xs" c="dimmed" style={{ textAlign: isUser ? 'right' : 'left' }}>
                        {formatTime(msg.timestamp)}
                      </Text>
                    </Stack>
                  </Group>
                )
              })}
              {isPending && (
                <Group gap="xs" wrap="nowrap" style={{ alignItems: 'flex-start' }}>
                  <Avatar size={32} radius="xl" variant="light" color="blue">
                    <IconBrain size={18} />
                  </Avatar>
                  <Paper p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                    <Group gap="xs">
                      <Loader size="xs" />
                      <Text size="sm" c="dimmed">{t('ai.typing')}</Text>
                    </Group>
                  </Paper>
                </Group>
              )}
            </Stack>
          </ScrollArea>
        )}

        {/* Input Area — fixed at bottom */}
        <Box style={{ flexShrink: 0 }}>
          <Divider />
          <Box p="md">
            <Group gap="xs" style={{ position: 'relative' }}>
              <Textarea
                flex={1}
                placeholder={t('ai.placeholder')}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
                size="md"
                autosize
                minRows={1}
                maxRows={4}
                radius="xl"
                styles={{
                  input: {
                    paddingRight: rem(50),
                    border: '2px solid var(--mantine-color-gray-3)',
                    transition: 'border-color 0.15s ease',
                  },
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--mantine-color-blue-5)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)'
                }}
                rightSectionWidth={42}
                rightSection={
                  <ActionIcon
                    size="lg"
                    radius="xl"
                    color="blue"
                    onClick={handleSend}
                    loading={isPending || isFetching}
                    disabled={!input.trim()}
                  >
                    <IconSend2 size={18} color="#ffffff" />
                  </ActionIcon>
                }
              />
            </Group>
            <Text size="xs" c="dimmed" ta="center" mt="xs">
              Parko AI может допускать ошибки. Проверяйте важную информацию.
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Box
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <Paper
          shadow="xl"
          p={0}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 300,
            height: '100%',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box p="md" style={{ background: 'var(--mantine-color-gray-0)' }}>
            <Group justify="space-between">
              <Text fw={700} size="sm">
                {t('ai.history') || 'Chat history'}
              </Text>
              <ActionIcon variant="subtle" size="sm" onClick={handleNewChat}>
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          </Box>
          <Divider />
          <ScrollArea style={{ flex: 1 }} p="xs">
            {sessions.length === 0 ? (
              <Stack align="center" justify="center" h="100%" gap="xs" p="xl">
                <IconHistory size={32} stroke={1.5} opacity={0.3} />
                <Text size="sm" c="dimmed" ta="center">{t('ai.no_history') || 'No chat history'}</Text>
              </Stack>
            ) : (
              <Stack gap={2} p="xs">
                {sessions.map((session) => (
                  <Group
                    key={session.id}
                    gap="xs"
                    p="xs"
                    style={{
                      borderRadius: 'var(--mantine-radius-md)',
                      cursor: 'pointer',
                      background: sidebarCurrentId === session.id ? 'var(--mantine-color-blue-light)' : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => handleLoadSession(session)}
                  >
                    <Avatar size={32} radius="md" color="blue" variant="light">
                      <IconMessage size={16} />
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>{session.title}</Text>
                      <Text size="xs" c="dimmed">{new Date(session.createdAt).toLocaleDateString()}</Text>
                    </Box>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(session.id)
                      }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            )}
          </ScrollArea>
        </Paper>
      )}
    </Box>
  )
}

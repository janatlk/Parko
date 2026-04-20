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
  Menu,
  Modal,
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
  IconUser,
  IconSparkles,
  IconDotsVertical,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import {
  useAIConversations,
  useSendAIMessage,
  useExecuteAIAction,
  useDeleteConversation,
  useAISuggestions,
} from '@features/ai/hooks/useAI'
import { getAIConversation } from '@features/ai/api/aiApi'
import { MarkdownText } from '@features/ai/ui/MarkdownText'
import { parseActionsFromContent } from '@features/ai/ui/parseAction'

type ActionPayload = {
  action: string
  params: Record<string, unknown>
  description: string
}

type MessageWithAction = {
  role: 'user' | 'assistant'
  content: string
  actions: ActionPayload[]
  id: number
  timestamp: string
}

type ExecutionResult = {
  messageId: number
  actionIndex: number
  success: boolean
  response: string
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}

export function AIPage() {
  const { t } = useTranslation()

  const [input, setInput] = useState('')
  const [localMessages, setLocalMessages] = useState<MessageWithAction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [executions, setExecutions] = useState<ExecutionResult[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const messageIdCounter = useRef(0)

  const { data: conversations = [], isLoading: isLoadingConversations } = useAIConversations()
  const { mutate: sendMessage, isPending } = useSendAIMessage()
  const { mutate: executeAction, isPending: isExecuting } = useExecuteAIAction()
  const { mutate: deleteConversation } = useDeleteConversation()
  const { data: suggestions = [] } = useAISuggestions()

  const nextMessageId = useCallback(() => {
    messageIdCounter.current += 1
    return messageIdCounter.current
  }, [])

  // Load conversation on mount or when selected
  const loadConversation = useCallback(
    (conversationId: number) => {
      setCurrentConversationId(conversationId)
      setLocalMessages([])
      setExecutions([])
      messageIdCounter.current = 0

      getAIConversation(conversationId)
        .then((data) => {
          const formatted = data.messages.map((msg, idx) => {
            const parsed = parseActionsFromContent(msg.content)
            return {
              role: msg.role as 'user' | 'assistant',
              content: parsed.text,
              actions: parsed.actions,
              id: idx + 1,
              timestamp: msg.created_at || new Date().toISOString(),
            }
          })
          setLocalMessages(formatted)
          messageIdCounter.current = data.messages.length
        })
        .catch(() => {
          setError('failed')
        })
    },
    [],
  )

  // Start new chat
  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null)
    setLocalMessages([])
    setExecutions([])
    messageIdCounter.current = 0
    setInput('')
  }, [])

  // Send message
  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isPending) return

    setError(null)
    const optimisticUserMessageId = nextMessageId()
    setLocalMessages((prev) => [
      ...prev,
      {
        role: 'user' as const,
        content: trimmed,
        actions: [],
        id: optimisticUserMessageId,
        timestamp: new Date().toISOString(),
      },
    ])
    setInput('')

    sendMessage(
      { message: trimmed, conversationId: currentConversationId },
      {
        onSuccess: (data) => {
          // Update conversation ID if this is a new conversation
          if (data.conversation_id && !currentConversationId) {
            setCurrentConversationId(data.conversation_id)
          }

          const parsed = parseActionsFromContent(data.response)
          const id = nextMessageId()
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

          const id = nextMessageId()
          let errorMessage = '❌ Произошла ошибка при обработке запроса.'
          if (errorDetail) {
            errorMessage += `\n\n📋 Детали: ${errorDetail}`
          }
          if (errorType === 'no_api_key') {
            errorMessage =
              '🔑 AI-ассистент временно недоступен: API-ключ не настроен.\n\nОбратитесь к администратору системы для настройки интеграции с Groq AI.'
          } else if (errorType === 'refused') {
            errorMessage =
              '⚠️ AI-ассистент отказался выполнять запрос.\n\nВозможно, запрос не соответствует тематике системы управления автопарком.'
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
          setLocalMessages((prev) =>
            prev.filter((m) => m.id !== optimisticUserMessageId),
          )
        },
      },
    )
  }, [currentConversationId, input, isPending, nextMessageId, sendMessage])

  // Action handlers
  const handleConfirmAction = useCallback(
    (messageId: number, actionIndex: number, action: string, params: Record<string, unknown>) => {
      if (!currentConversationId) return

      executeAction(
        { action, params, conversationId: currentConversationId },
        {
          onSuccess: (data) => {
            setExecutions((prev) => [
              ...prev,
              { messageId, actionIndex, success: data.success, response: data.result || data.response },
            ])
            const id = nextMessageId()
            setLocalMessages((prev) => [
              ...prev,
              {
                role: 'assistant' as const,
                content: data.result || data.response || 'Действие выполнено.',
                actions: [],
                id,
                timestamp: new Date().toISOString(),
              },
            ])
          },
          onError: () => {
            setExecutions((prev) => [
              ...prev,
              { messageId, actionIndex, success: false, response: '' },
            ])
            const id = nextMessageId()
            setLocalMessages((prev) => [
              ...prev,
              {
                role: 'assistant' as const,
                content: t('ai.action_failed'),
                actions: [],
                id,
                timestamp: new Date().toISOString(),
              },
            ])
          },
        },
      )
    },
    [currentConversationId, executeAction, nextMessageId, t],
  )

  const handleCancelAction = useCallback((messageId: number, actionIndex: number) => {
    setExecutions((prev) => [
      ...prev,
      { messageId, actionIndex, success: false, response: '' },
    ])
  }, [])

  // Delete conversation
  const handleDeleteConversation = useCallback(() => {
    if (!conversationToDelete) return

    deleteConversation(conversationToDelete, {
      onSuccess: () => {
        // If we deleted the current conversation, start new chat
        if (currentConversationId === conversationToDelete) {
          handleNewChat()
        }
        setDeleteModalOpen(false)
        setConversationToDelete(null)
      },
    })
  }, [conversationToDelete, currentConversationId, deleteConversation, handleNewChat])

  // Auto-scroll to bottom
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [localMessages, isPending])

  const isEmpty = localMessages.length === 0 && !isPending

  return (
    <Box style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 0 }}>
      {/* Sidebar - GPT style */}
      {sidebarOpen && (
        <Box
          style={{
            width: 260,
            flexShrink: 0,
            background: 'var(--mantine-color-gray-0)',
            borderRight: '1px solid var(--mantine-color-gray-3)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* New Chat Button */}
          <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Button
              fullWidth
              leftSection={<IconPlus size={18} />}
              onClick={handleNewChat}
              variant="light"
              size="md"
            >
              Новый чат
            </Button>
          </Box>

          {/* Conversations List */}
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap={2} p="xs">
              {isLoadingConversations ? (
                <Group justify="center" p="xl">
                  <Loader size="sm" />
                </Group>
              ) : conversations.length === 0 ? (
                <Box p="xl" ta="center">
                  <IconMessage size={32} stroke={1.5} opacity={0.3} />
                  <Text size="sm" c="dimmed" mt="sm">
                    Нет истории чатов
                  </Text>
                </Box>
              ) : (
                conversations.map((conv) => (
                  <Group
                    key={conv.id}
                    gap="xs"
                    p="xs"
                    style={{
                      borderRadius: 'var(--mantine-radius-md)',
                      cursor: 'pointer',
                      background:
                        currentConversationId === conv.id
                          ? 'var(--mantine-color-gray-2)'
                          : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <Avatar size={32} radius="md" color="blue" variant="light">
                      <IconMessage size={16} />
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {conv.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDate(conv.updated_at)}
                      </Text>
                    </Box>
                    <Menu position="right-start" width={150}>
                      <Menu.Target>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconDotsVertical size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => {
                            setConversationToDelete(conv.id)
                            setDeleteModalOpen(true)
                          }}
                        >
                          Удалить
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Box>
      )}

      {/* Main Chat Area */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Box
          p="sm"
          style={{
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            background: 'var(--mantine-color-body)',
          }}
        >
          <Group justify="space-between">
            <Group gap="sm">
              <Tooltip label="Показать/скрыть историю">
                <ActionIcon variant="subtle" size="md" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <IconMessage size={18} />
                </ActionIcon>
              </Tooltip>
              <IconBrain size={28} stroke={1.5} />
              <div>
                <Text size="lg" fw={700}>
                  {t('ai.title')}
                </Text>
                <Text size="xs" c="dimmed">
                  {currentConversationId
                    ? conversations.find((c) => c.id === currentConversationId)?.title
                    : 'Новый разговор'}
                </Text>
              </div>
            </Group>
          </Group>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t('common.error')}
            color="orange"
            withCloseButton
            onClose={() => setError(null)}
            m="sm"
          >
            <Text size="sm">{t(`ai.error_${error}`)}</Text>
          </Alert>
        )}

        {/* Messages Area */}
        <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
              <Stack gap="xs" mt="md" maw={450}>
                {(suggestions.length > 0
                  ? suggestions
                  : [
                    { text: 'Какие машины в автопарке?', icon: '🚗', category: 'fleet' },
                    { text: 'Покажи расходы на топливо', icon: '⛽', category: 'fuel' },
                    { text: 'Покажи расходы на запчасти', icon: '🔧', category: 'maintenance' },
                  ]
                ).map((s) => (
                  <Button
                    key={s.text}
                    variant="light"
                    size="xs"
                    radius="xl"
                    fullWidth
                    leftSection={<Text size="sm">{s.icon}</Text>}
                    onClick={() => setInput(s.text)}
                    styles={{
                      root: { justifyContent: 'flex-start' },
                      label: { overflow: 'hidden', textOverflow: 'ellipsis' },
                    }}
                  >
                    {s.text}
                  </Button>
                ))}
              </Stack>
            </Stack>
          ) : (
            <ScrollArea style={{ flex: 1 }} viewportRef={viewportRef} ref={scrollRef}>
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
                      <Stack gap={2} style={{ maxWidth: isUser ? '70%' : '88%' }}>
                        <Paper
                          p="sm"
                          style={{
                            borderRadius: isUser
                              ? 'var(--mantine-radius-md) var(--mantine-radius-md) 4px var(--mantine-radius-md)'
                              : 'var(--mantine-radius-md) var(--mantine-radius-md) var(--mantine-radius-md) 4px',
                            background: isUser
                              ? 'var(--mantine-color-blue-filled)'
                              : 'var(--mantine-color-gray-0)',
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

                          {/* Action buttons */}
                          {msg.actions.length > 0 && (
                            <>
                              <Divider my="sm" />
                              {msg.actions.map((act, idx) => {
                                const actionExecution = executions.find(
                                  (e) => e.messageId === msg.id && e.actionIndex === idx,
                                )
                                const isActionExecuted = !!actionExecution

                                if (isActionExecuted) return null

                                return (
                                  <Box key={`${msg.id}-${idx}`} mb="xs">
                                    <Text size="xs" fw={600} c="orange.7" mb={4}>
                                      ⚙️ Запланированное действие: {idx + 1}/{msg.actions.length}
                                    </Text>
                                    <Text
                                      size="xs"
                                      c="dimmed"
                                      mb="xs"
                                      style={{ whiteSpace: 'pre-wrap' }}
                                    >
                                      {act.description ||
                                        `${act.action} — ${JSON.stringify(act.params)}`}
                                    </Text>
                                    <Group gap="xs">
                                      <Button
                                        size="xs"
                                        color="green"
                                        variant="light"
                                        leftSection={<IconCheck size={14} />}
                                        onClick={() =>
                                          handleConfirmAction(msg.id, idx, act.action, act.params)
                                        }
                                        loading={isExecuting}
                                        disabled={isExecuting}
                                      >
                                        Подтвердить
                                      </Button>
                                      <Button
                                        size="xs"
                                        color="red"
                                        variant="light"
                                        leftSection={<IconX size={14} />}
                                        onClick={() => handleCancelAction(msg.id, idx)}
                                        disabled={isExecuting}
                                      >
                                        Отменить
                                      </Button>
                                    </Group>
                                  </Box>
                                )
                              })}
                            </>
                          )}
                        </Paper>
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{ textAlign: isUser ? 'right' : 'left' }}
                        >
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
                        <Text size="sm" c="dimmed">
                          {t('ai.typing')}
                        </Text>
                      </Group>
                    </Paper>
                  </Group>
                )}
              </Stack>
            </ScrollArea>
          )}

          {/* Input Area */}
          <Box
            p="md"
            style={{
              borderTop: '1px solid var(--mantine-color-gray-3)',
              background: 'var(--mantine-color-body)',
            }}
          >
            <Group gap="xs" style={{ position: 'relative' }}>
              <Textarea
                flex={1}
                placeholder={t('ai.placeholder')}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={isPending}
                size="md"
                autosize
                minRows={1}
                maxRows={4}
                radius="xl"
                styles={{
                  input: {
                    paddingRight: rem(50),
                  },
                }}
                rightSectionWidth={42}
                rightSection={
                  <ActionIcon
                    size="lg"
                    radius="xl"
                    color="blue"
                    onClick={handleSend}
                    loading={isPending}
                    disabled={!input.trim()}
                  >
                    <IconSend2 size={18} />
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

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удалить чат"
        centered
      >
        <Text size="sm" mb="md">
          Вы уверены, что хотите удалить этот чат? Все сообщения будут удаллены безвозвратно.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setDeleteModalOpen(false)}>
            Отмена
          </Button>
          <Button color="red" onClick={handleDeleteConversation}>
            Удалить
          </Button>
        </Group>
      </Modal>
    </Box>
  )
}

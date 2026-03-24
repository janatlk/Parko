import type { AxiosError } from 'axios'
import { useEffect, useState } from 'react'

import { Alert, Button, Container, Group, Paper, PasswordInput, Stack, Text, TextInput, Title, Box, ThemeIcon } from '@mantine/core'
import { IconCar, IconUser, IconLock, IconAlertCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '@features/auth/hooks/useAuth'
import { showSuccess, showError } from '@shared/utils/toast'

type FormState = {
  username: string
  password: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [searchParams] = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'

  const [form, setForm] = useState<FormState>({
    username: isDemo ? 'demo' : '',
    password: isDemo ? 'demo' : ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const getInputValue = (valueOrEvent: unknown): string => {
    if (typeof valueOrEvent === 'string') return valueOrEvent
    if (valueOrEvent && typeof valueOrEvent === 'object') {
      const record = valueOrEvent as Record<string, unknown>
      const currentTarget = record.currentTarget as { value?: unknown } | undefined
      if (typeof currentTarget?.value === 'string') return currentTarget.value
      const target = record.target as { value?: unknown } | undefined
      if (typeof target?.value === 'string') return target.value
    }
    return ''
  }

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, user])

  const extractErrorMessage = (err: unknown): string => {
    const axiosErr = err as AxiosError
    const data = axiosErr?.response?.data as unknown
    if (typeof data === 'string') return data
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      if (typeof record.message === 'string') return record.message
      if (typeof record.detail === 'string') return record.detail
      if (Array.isArray(record.non_field_errors) && typeof record.non_field_errors[0] === 'string') {
        return record.non_field_errors[0]
      }
      return 'Login failed'
    }
    return 'Login failed'
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const nextErrors: { username?: string; password?: string } = {}
    if (!form.username.trim()) nextErrors.username = 'Required'
    if (!form.password) nextErrors.password = 'Required'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await login({ username: form.username, password: form.password })
      showSuccess(t('auth.login_success') || 'Вы успешно вошли в систему')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const errorMsg = extractErrorMessage(err)
      setServerError(errorMsg)
      showError(errorMsg, t('auth.login_failed') || 'Ошибка входа')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size={420} py="xl">
      <Box ta="center" mb="xl">
        <Group justify="center" gap="xs" mb="md">
          <ThemeIcon variant="light" size="xl" radius="xl" color="blue">
            <IconCar size={32} stroke={1.5} />
          </ThemeIcon>
        </Group>
        <Title order={2} fw={700}>
          {t('auth.title')}
        </Title>
        <Text size="sm" c="dimmed" mt="xs">
          {t('auth.subtitle') || 'Войдите в свой аккаунт'}
        </Text>
      </Box>

      <Paper withBorder shadow="md" p="xl" radius="lg">
        <form onSubmit={onSubmit}>
          <Stack gap="md">
            {serverError && (
              <Alert
                icon={<IconAlertCircle size={18} />}
                color="red"
                variant="light"
                radius="md"
              >
                {serverError}
              </Alert>
            )}
            <TextInput
              label={t('auth.username')}
              placeholder={t('auth.username_placeholder') || 'Введите логин'}
              value={form.username}
              onChange={(valueOrEvent) =>
                setForm((s) => ({ ...s, username: getInputValue(valueOrEvent) }))
              }
              error={errors.username}
              leftSection={<IconUser size={16} />}
              required
              autoComplete="username"
              size="md"
            />
            <PasswordInput
              label={t('auth.password')}
              placeholder={t('auth.password_placeholder') || 'Введите пароль'}
              value={form.password}
              onChange={(valueOrEvent) =>
                setForm((s) => ({ ...s, password: getInputValue(valueOrEvent) }))
              }
              error={errors.password}
              leftSection={<IconLock size={16} />}
              required
              autoComplete="current-password"
              size="md"
            />
            <Button
              type="submit"
              loading={isSubmitting}
              size="md"
              radius="md"
              mt="sm"
            >
              {t('auth.login')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}

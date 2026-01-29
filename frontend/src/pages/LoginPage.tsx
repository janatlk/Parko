import type { AxiosError } from 'axios'
import { useEffect, useState } from 'react'

import { Alert, Button, Container, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@features/auth/hooks/useAuth'

type FormState = {
  username: string
  password: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, user } = useAuth()

  const [form, setForm] = useState<FormState>({ username: '', password: '' })
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
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(extractErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size={420} py="xl">
      <Title ta="center" order={2} mb="md">
        Parko
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <form onSubmit={onSubmit}>
          <Stack>
            {serverError && <Alert color="red">{serverError}</Alert>}
            <TextInput
              label={t('auth.username')}
              value={form.username}
              onChange={(valueOrEvent) =>
                setForm((s) => ({ ...s, username: getInputValue(valueOrEvent) }))
              }
              error={errors.username}
              required
              autoComplete="username"
            />
            <PasswordInput
              label={t('auth.password')}
              value={form.password}
              onChange={(valueOrEvent) =>
                setForm((s) => ({ ...s, password: getInputValue(valueOrEvent) }))
              }
              error={errors.password}
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={isSubmitting}>
              {t('auth.login')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}

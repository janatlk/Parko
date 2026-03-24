import { useEffect, useMemo, useState } from 'react'

import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core'
import { useTranslation } from 'react-i18next'

import type { User } from '@entities/user/types'
import { USER_ROLES } from '@shared/constants/roles'
import { LANGUAGES } from '@shared/constants/languages'

import type { UserCreatePayload, UserUpdatePayload } from '../api/usersApi'

type Mode = 'create' | 'edit'

type Props = {
  opened: boolean
  onClose: () => void
  mode: Mode
  user?: User
  onCreate: (payload: UserCreatePayload) => Promise<void>
  onUpdate: (userId: number, payload: UserUpdatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function UserFormModal({
  opened,
  onClose,
  mode,
  user,
  onCreate,
  onUpdate,
  isSubmitting,
}: Props) {
  const { t } = useTranslation()
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

  const getCheckedValue = (valueOrEvent: unknown): boolean => {
    if (typeof valueOrEvent === 'boolean') return valueOrEvent
    if (valueOrEvent && typeof valueOrEvent === 'object') {
      const record = valueOrEvent as Record<string, unknown>
      const currentTarget = record.currentTarget as { checked?: unknown } | undefined
      if (typeof currentTarget?.checked === 'boolean') return currentTarget.checked
      const target = record.target as { checked?: unknown } | undefined
      if (typeof target?.checked === 'boolean') return target.checked
    }
    return false
  }

  const initial = useMemo(
    () => ({
      username: user?.username ?? '',
      password: '',
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'COMPANY_ADMIN',
      region: user?.region ?? 'unknown',
      language: user?.language ?? 'ru',
      is_active: user?.is_active ?? true,
    }),
    [user],
  )

  const [form, setForm] = useState(initial)

  useEffect(() => {
    setForm(initial)
  }, [initial, opened])

  const submit = async () => {
    if (!form.username.trim()) return
    if (mode === 'create' && !form.password) return

    if (mode === 'create') {
      await onCreate({
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role as User['role'],
        region: form.region,
        language: form.language as User['language'],
        is_active: form.is_active,
      })
      onClose()
      return
    }

    if (!user) return

    const payload: UserUpdatePayload = {
      username: form.username,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      role: form.role as User['role'],
      region: form.region,
      language: form.language as User['language'],
      is_active: form.is_active,
    }
    if (form.password) {
      payload.password = form.password
    }

    await onUpdate(user.id, payload)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? t('users.create') : t('users.edit')}
      centered
    >
      <Stack>
        <TextInput
          label={t('auth.username')}
          value={form.username}
          onChange={(valueOrEvent) =>
            setForm((s) => ({ ...s, username: getInputValue(valueOrEvent) }))
          }
          required
        />

        <PasswordInput
          label={mode === 'create' ? t('auth.password') : t('users.new_password')}
          value={form.password}
          onChange={(valueOrEvent) =>
            setForm((s) => ({ ...s, password: getInputValue(valueOrEvent) }))
          }
          required={mode === 'create'}
        />

        <TextInput
          label={t('users.first_name')}
          value={form.first_name}
          onChange={(valueOrEvent) =>
            setForm((s) => ({ ...s, first_name: getInputValue(valueOrEvent) }))
          }
        />

        <TextInput
          label={t('users.last_name')}
          value={form.last_name}
          onChange={(valueOrEvent) =>
            setForm((s) => ({ ...s, last_name: getInputValue(valueOrEvent) }))
          }
        />

        <TextInput
          label={t('users.email')}
          value={form.email}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, email: getInputValue(valueOrEvent) }))}
        />

        <Select
          label={t('users.role')}
          data={USER_ROLES.map((r) => ({ value: r, label: r }))}
          value={form.role}
          onChange={(value) => value && setForm((s) => ({ ...s, role: value as User['role'] }))}
          required
        />

        <Select
          label={t('users.language')}
          data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
          value={form.language}
          onChange={(value) =>
            value && setForm((s) => ({ ...s, language: value as User['language'] }))
          }
          required
        />

        <TextInput
          label={t('users.region')}
          value={form.region}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, region: getInputValue(valueOrEvent) }))}
        />

        <Switch
          label={t('users.active')}
          checked={form.is_active}
          onChange={(valueOrEvent) =>
            setForm((s) => ({ ...s, is_active: getCheckedValue(valueOrEvent) }))
          }
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit()} loading={isSubmitting}>
            {mode === 'create' ? t('common.create') : t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

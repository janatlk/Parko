import { useMemo, useState } from 'react'

import { Button, Container, Group, Paper, Select, Stack, Text, Title } from '@mantine/core'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useUpdateMeMutation } from '@features/auth/hooks/useMe'
import { LANGUAGES } from '@shared/constants/languages'
import type { Language } from '@shared/constants/languages'

export function ProfilePage() {
  const { user, setUser } = useAuth()
  const updateMe = useUpdateMeMutation()

  const [language, setLanguage] = useState<Language | null>(user?.language ?? 'ru')

  const languageOptions = useMemo(
    () => LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() })),
    [],
  )

  if (!user) {
    return (
      <Container>
        <Text c="dimmed">No user</Text>
      </Container>
    )
  }

  return (
    <Container>
      <Title order={2} mb="xs">
        Profile
      </Title>

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Username: {user.username}
          </Text>
          <Text size="sm" c="dimmed">
            Role: {user.role}
          </Text>
          <Text size="sm" c="dimmed">
            Company: {user.company_name ?? user.company ?? '-'}
          </Text>

          <Select
            label="Language"
            data={languageOptions}
            value={language}
            onChange={setLanguage}
            w={160}
          />

          <Group justify="flex-end">
            <Button
              loading={updateMe.isPending}
              onClick={async () => {
                if (!language) return
                const updated = await updateMe.mutateAsync({ language })
                setUser(updated)
              }}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  )
}

import { Button, Container, Group, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@features/auth/hooks/useAuth'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <Container py="xl">
      <Group justify="space-between" align="center" mb="md">
        <Title order={2}>{t('dashboard.title')}</Title>
        <Button variant="light" onClick={() => void logout()}>
          {t('dashboard.logout')}
        </Button>
      </Group>

      <Text c="dimmed">{t('dashboard.logged_in_as', { username: user?.username ?? '' })}</Text>
    </Container>
  )
}

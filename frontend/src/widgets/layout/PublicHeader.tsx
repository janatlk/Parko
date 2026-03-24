import { Button, Group, Select, Text, Box } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconCar, IconLanguage } from '@tabler/icons-react'

import { LANGUAGES } from '@shared/constants/languages'
import { useAuth } from '@features/auth/hooks/useAuth'
import { showSuccess, showError } from '@shared/utils/toast'

export function PublicHeader() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleDemo = async () => {
    try {
      await login({ username: 'demo', password: 'demo' })
      showSuccess(t('auth.login_success') || 'Demo login successful')
      navigate('/dashboard')
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || 'Demo account error'
      showError(`Demo account failed: ${errorMsg}`)
      console.error('Demo login error:', error)
    }
  }

  const handleLanguageChange = (value: string | null) => {
    if (!value) return
    void i18n.changeLanguage(value)
  }

  return (
    <Box component="header" style={{
      borderBottom: '1px solid var(--mantine-color-gray-3)',
      backgroundColor: 'var(--mantine-color-body)',
    }}>
      <Group h={64} px="xl" justify="space-between">
        <Group gap="xs">
          <IconCar size={28} stroke={1.8} color="var(--mantine-color-blue-6)" />
          <Text size="xl" fw={700} c="blue.6">
            Parko
          </Text>
        </Group>

        <Group gap="sm">
          <Select
            leftSection={<IconLanguage size={14} />}
            data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
            value={i18n.language}
            onChange={handleLanguageChange}
            size="sm"
            w={100}
            variant="filled"
          />
          <Button variant="subtle" size="sm" onClick={handleDemo}>
            {t('landing.demo')}
          </Button>
          <Button variant="filled" size="sm" onClick={() => navigate('/login')}>
            {t('landing.login')}
          </Button>
        </Group>
      </Group>
    </Box>
  )
}

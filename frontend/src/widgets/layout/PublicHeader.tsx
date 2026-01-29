import { Button, Group, Select, Text } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { LANGUAGES } from '@shared/constants/languages'
import { useAuth } from '@features/auth/hooks/useAuth'
import { showSuccess, showError } from '@shared/utils/toast'

export function PublicHeader() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLanguageChange = (value: string | null) => {
    if (!value) return
    void i18n.changeLanguage(value)
  }

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

  return (
    <Group h={60} px="md" justify="space-between" style={{ borderBottom: '1px solid #e9ecef' }}>
      <Text size="xl" fw={700} c="blue.6">
        Parko
      </Text>

      <Group gap="sm">
        <Select
          data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
          value={i18n.language}
          onChange={handleLanguageChange}
          size="xs"
          w={90}
        />
        <Button variant="subtle" size="sm" onClick={handleDemo}>
          {t('landing.demo')}
        </Button>
        <Button variant="filled" size="sm" onClick={() => navigate('/login')}>
          {t('landing.login')}
        </Button>
      </Group>
    </Group>
  )
}

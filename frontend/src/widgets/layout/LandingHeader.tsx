import { Button, Group, Select, Text, Box, Burger } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconCar, IconLanguage } from '@tabler/icons-react'
import { useState } from 'react'

import { LANGUAGES } from '@shared/constants/languages'
import { useAuth } from '@features/auth/hooks/useAuth'
import { showSuccess, showError } from '@shared/utils/toast'

export function LandingHeader() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mobileOpened, setMobileOpened] = useState(false)

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileOpened(false)
  }

  return (
    <Box component="header" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 70,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #222222',
      zIndex: 200,
    }}>
      <Group h={70} px="xl" justify="space-between">
        <Group gap="xs" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <IconCar size={32} stroke={1.5} color="#ffffff" />
          <Text size="xl" fw={700} c="#ffffff" style={{ letterSpacing: '1px' }}>
            PARKO
          </Text>
        </Group>

        {/* Desktop Navigation */}
        <Group gap="lg" visibleFrom="sm">
          <Text 
            c="#888888" 
            size="sm" 
            style={{ cursor: 'pointer' }}
            onClick={() => scrollToSection('features')}
          >
            Возможности
          </Text>
          <Text 
            c="#888888" 
            size="sm" 
            style={{ cursor: 'pointer' }}
            onClick={() => scrollToSection('about')}
          >
            О системе
          </Text>
          <Text 
            c="#888888" 
            size="sm" 
            style={{ cursor: 'pointer' }}
            onClick={() => scrollToSection('contact')}
          >
            Контакты
          </Text>
        </Group>

        <Group gap="sm" visibleFrom="sm">
          <Select
            leftSection={<IconLanguage size={14} color="#888888" />}
            data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
            value={i18n.language}
            onChange={handleLanguageChange}
            size="xs"
            w={90}
            styles={{
              input: {
                background: '#111111',
                border: '1px solid #333333',
                color: '#ffffff',
              },
            }}
          />
          <Button
            size="sm"
            onClick={handleDemo}
            variant="outline"
            styles={{
              root: {
                background: 'transparent',
                border: '1px solid #444444',
                color: '#ffffff',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
              },
            }}
          >
            {t('landing.demo')}
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/login')}
            style={{
              background: '#000000 !important',
              color: '#ffffff !important',
            }}
          >
            {t('landing.login')}
          </Button>
        </Group>

        {/* Mobile Menu Button */}
        <Burger
          opened={mobileOpened}
          onClick={() => setMobileOpened(!mobileOpened)}
          color="#ffffff"
          hiddenFrom="sm"
        />
      </Group>

      {/* Mobile Menu */}
      {mobileOpened && (
        <Box
          style={{
            position: 'absolute',
            top: 70,
            left: 0,
            right: 0,
            background: '#000000',
            borderBottom: '1px solid #222222',
            padding: 20,
          }}
        >
          <Group justify="space-between" mb="md">
            <Select
              leftSection={<IconLanguage size={14} color="#888888" />}
              data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
              value={i18n.language}
              onChange={handleLanguageChange}
              size="xs"
              w={100}
              styles={{
                input: {
                  background: '#111111',
                  border: '1px solid #333333',
                  color: '#ffffff',
                },
              }}
            />
          </Group>
          <Group justify="space-around">
            <Button
              fullWidth
              onClick={handleDemo}
              variant="outline"
              styles={{
                root: {
                  background: 'transparent',
                  border: '1px solid #444444',
                  color: '#ffffff',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                },
              }}
            >
              {t('landing.demo')}
            </Button>
            <Button
              fullWidth
              onClick={() => navigate('/login')}
              style={{
                background: '#000000 !important',
                color: '#ffffff !important',
              }}
            >
              {t('landing.login')}
            </Button>
          </Group>
        </Box>
      )}
    </Box>
  )
}

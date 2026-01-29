import { AppShell, Burger, Button, Group, NavLink, Select, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@features/auth/hooks/useAuth'
import { patchMeApi } from '@features/auth/api/authApi'
import { LANGUAGES } from '@shared/constants/languages'
import { showSuccess } from '@shared/utils/toast'

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const [opened, { toggle }] = useDisclosure(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuth()

  const activePath = location.pathname

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700}>Parko</Text>
          </Group>

          <Group>
            <Select
              data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
              value={user?.language ?? 'ru'}
              onChange={(value) => {
                if (!value) return
                if (!user) return
                // Change i18n language immediately
                void i18n.changeLanguage(value)
                showSuccess(`Язык изменён на ${value.toUpperCase()}`)
                // Save to user profile
                void (async () => {
                  try {
                    const updated = await patchMeApi({ language: value as typeof user.language })
                    setUser(updated)
                  } catch {
                    // Even if API fails, keep the local i18n change
                    setUser({ ...user, language: value as typeof user.language })
                  }
                })()
              }}
              size="xs"
              w={90}
            />
            <Text size="sm" c="dimmed">
              {user?.username}
            </Text>
            <Button variant="light" size="xs" onClick={() => void logout()}>
              {t('dashboard.logout')}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <NavLink
          component={RouterNavLink}
          to="/dashboard"
          label={t('dashboard.title')}
          active={activePath.startsWith('/dashboard')}
          onClick={() => toggle()}
        />
        <NavLink
          component={RouterNavLink}
          to="/cars"
          label={t('cars.title')}
          active={activePath.startsWith('/cars')}
          onClick={() => toggle()}
        />
        <NavLink
          component={RouterNavLink}
          to="/fuel"
          label={t('fuel.title')}
          active={activePath.startsWith('/fuel')}
          onClick={() => toggle()}
        />
        <NavLink
          component={RouterNavLink}
          to="/insurances"
          label={t('insurances.title')}
          active={activePath.startsWith('/insurances')}
          onClick={() => toggle()}
        />
        <NavLink
          component={RouterNavLink}
          to="/inspections"
          label={t('inspections.title')}
          active={activePath.startsWith('/inspections')}
          onClick={() => toggle()}
        />
        <NavLink
          component={RouterNavLink}
          to="/users"
          label={t('users.title')}
          active={activePath.startsWith('/users')}
          onClick={() => toggle()}
        />
        <NavLink
          component={RouterNavLink}
          to="/reports"
          label={t('reports.title')}
          active={activePath.startsWith('/reports')}
          onClick={() => toggle()}
        />
        <NavLink
          component={RouterNavLink}
          to="/profile"
          label={t('profile.title')}
          active={activePath.startsWith('/profile')}
          onClick={() => toggle()}
        />
        <NavLink
          label="Login"
          description="(debug)"
          onClick={() => {
            navigate('/login')
            toggle()
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

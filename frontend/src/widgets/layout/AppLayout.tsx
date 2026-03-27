import { AppShell, Avatar, Badge, Burger, Button, Group, NavLink, Select, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  IconDashboard,
  IconCar,
  IconGasStation,
  IconShield,
  IconCalendarStats,
  IconUsers,
  IconFileAnalytics,
  IconUser,
  IconLogout,
  IconLanguage,
} from '@tabler/icons-react'

import { useAuth } from '@features/auth/hooks/useAuth'
import { patchMeApi } from '@features/auth/api/authApi'
import { LANGUAGES } from '@shared/constants/languages'
import { showSuccess } from '@shared/utils/toast'

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const [opened, { toggle }] = useDisclosure(false)
  const location = useLocation()
  const { user, logout, setUser } = useAuth()

  const activePath = location.pathname

  const getInitials = () => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    }
    return user?.username?.substring(0, 2).toUpperCase() ?? 'U'
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header bg="blue.6">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
            <Group gap="xs">
              <IconCar size={24} stroke={1.8} />
              <Text fw={700} size="xl" c="white">Parko</Text>
            </Group>
          </Group>

          <Group gap="sm">
            <Select
              leftSection={<IconLanguage size={14} />}
              data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
              value={user?.language ?? 'ru'}
              onChange={(value) => {
                if (!value) return
                if (!user) return
                void i18n.changeLanguage(value)
                showSuccess(`Язык изменён на ${value.toUpperCase()}`)
                void (async () => {
                  try {
                    const updated = await patchMeApi({ language: value as typeof user.language })
                    setUser(updated)
                  } catch {
                    setUser({ ...user, language: value as typeof user.language })
                  }
                })()
              }}
              size="xs"
              w={100}
              variant="filled"
            />
            <Button
              variant="white"
              size="xs"
              leftSection={<IconLogout size={14} />}
              onClick={() => void logout()}
              fw={500}
            >
              {t('dashboard.logout')}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar bg="gray.0" p="xs">
        {/* User Info Card */}
        <Group gap="sm" mb="md" p="sm" bg="white" style={{ borderRadius: '8px' }}>
          <Avatar size={40} radius="xl" color="blue" variant="filled">
            {getInitials()}
          </Avatar>
          <Stack gap={0} style={{ flex: 1 }}>
            <Text size="sm" fw={600} truncate>
              {user?.first_name || user?.last_name ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : user?.username}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {user?.company_name || user?.role}
            </Text>
          </Stack>
          <Badge size="sm" variant="light" color="blue">
            {user?.role}
          </Badge>
        </Group>

        {/* Navigation Links */}
        <Stack gap={2}>
          <NavLink
            component={RouterNavLink}
            to="/dashboard"
            label={t('dashboard.title')}
            leftSection={<IconDashboard size={18} stroke={1.5} />}
            active={activePath.startsWith('/dashboard')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/cars"
            label={t('cars.title')}
            leftSection={<IconCar size={18} stroke={1.5} />}
            active={activePath.startsWith('/cars')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/fuel"
            label={t('fuel.title')}
            leftSection={<IconGasStation size={18} stroke={1.5} />}
            active={activePath.startsWith('/fuel')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/spares"
            label={t('spares.title')}
            leftSection={<IconCar size={18} stroke={1.5} />}
            active={activePath.startsWith('/spares')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/insurances"
            label={t('insurances.title')}
            leftSection={<IconShield size={18} stroke={1.5} />}
            active={activePath.startsWith('/insurances')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/inspections"
            label={t('inspections.title')}
            leftSection={<IconCalendarStats size={18} stroke={1.5} />}
            active={activePath.startsWith('/inspections')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/users"
            label={t('users.title')}
            leftSection={<IconUsers size={18} stroke={1.5} />}
            active={activePath.startsWith('/users')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/reports"
            label={t('reports.title')}
            leftSection={<IconFileAnalytics size={18} stroke={1.5} />}
            active={activePath.startsWith('/reports')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
          <NavLink
            component={RouterNavLink}
            to="/profile"
            label={t('profile.title')}
            leftSection={<IconUser size={18} stroke={1.5} />}
            active={activePath.startsWith('/profile')}
            onClick={() => toggle()}
            styles={(theme) => ({
              root: { borderRadius: theme.radius.md },
            })}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

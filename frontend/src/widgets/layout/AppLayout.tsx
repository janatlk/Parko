import { AppShell, Avatar, Badge, Burger, Button, Group, NavLink, Select, Stack, Text, useMantineColorScheme } from '@mantine/core'
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
import { ThemeToggle } from '@features/theme/ui/ThemeToggle'

function getNavStyles(isDark: boolean, isActive: boolean) {
  if (isActive) {
    return {
      root: {
        borderRadius: 'var(--mantine-radius-md)',
        background: isDark
          ? 'linear-gradient(135deg, #1c3a5f 0%, #18304a 100%)'
          : 'linear-gradient(135deg, #e7f5ff 0%, #d0ebff 100%)',
        color: isDark ? '#74b0f0' : '#1971c2',
        fontWeight: 600,
      },
    }
  }
  return {
    root: {
      borderRadius: 'var(--mantine-radius-md)',
    },
  }
}

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const [opened, { toggle }] = useDisclosure(false)
  const location = useLocation()
  const { user, logout, setUser } = useAuth()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

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
      classNames={{
        navbar: 'app-shell-navbar',
        header: 'app-shell-header',
      }}
    >
      <AppShell.Header
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1a3a5c 0%, #18304a 50%, #1c3a4f 100%)'
            : 'linear-gradient(135deg, #1c7ed6 0%, #228be6 50%, #339af0 100%)',
          borderBottom: isDark ? '1px solid #1c3a5f' : '1px solid #1971c2',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
            <Group gap="xs">
              <IconCar size={24} stroke={1.8} color="#ffffff" />
              <Text fw={700} size="xl" c="white">Parko</Text>
            </Group>
          </Group>

          <Group gap="sm">
            <ThemeToggle />
            <Select
              leftSection={<IconLanguage size={14} color="rgba(255,255,255,0.7)" />}
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
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.25)' },
                },
                dropdown: {
                  background: isDark ? '#1a1b1e' : '#ffffff',
                  color: isDark ? '#e9ecef' : '#000000',
                },
              }}
            />
            <Button
              variant="outline"
              color="white"
              size="xs"
              leftSection={<IconLogout size={14} />}
              onClick={() => void logout()}
              fw={500}
              styles={{
                root: {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.15)' },
                },
              }}
            >
              {t('dashboard.logout')}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        bg={isDark ? '#141517' : 'white'}
        p="xs"
        className="app-shell-navbar"
        style={{ borderRight: `1px solid ${isDark ? '#2C2E33' : 'var(--mantine-color-gray-2)'}` }}
      >
        {/* User Info Card */}
        <Group gap="sm" mb="md" p="sm" style={{
          background: isDark
            ? 'linear-gradient(135deg, #1c3a5f 0%, #18304a 100%)'
            : 'linear-gradient(135deg, #e7f5ff 0%, #d0ebff 100%)',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#2a5a8f' : '#a5d8ff'}`,
        }}>
          <Avatar size={40} radius="xl" color="blue" variant="filled">
            {getInitials()}
          </Avatar>
          <Stack gap={0} style={{ flex: 1 }}>
            <Text size="sm" fw={600} truncate style={{ color: isDark ? '#e9ecef' : 'inherit' }}>
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
            leftSection={<IconDashboard size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/dashboard')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/dashboard'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/cars"
            label={t('cars.title')}
            leftSection={<IconCar size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/cars')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/cars'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/fuel"
            label={t('fuel.title')}
            leftSection={<IconGasStation size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/fuel')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/fuel'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/spares"
            label={t('spares.title')}
            leftSection={<IconCar size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/spares')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/spares'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/insurances"
            label={t('insurances.title')}
            leftSection={<IconShield size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/insurances')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/insurances'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/inspections"
            label={t('inspections.title')}
            leftSection={<IconCalendarStats size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/inspections')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/inspections'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/users"
            label={t('users.title')}
            leftSection={<IconUsers size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/users')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/users'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/reports"
            label={t('reports.title')}
            leftSection={<IconFileAnalytics size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/reports')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/reports'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/profile"
            label={t('profile.title')}
            leftSection={<IconUser size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/profile')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/profile'))}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

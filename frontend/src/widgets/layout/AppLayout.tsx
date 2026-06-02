import { AppShell, Avatar, Badge, Burger, Button, Divider, Group, NavLink, Select, Stack, Text, ThemeIcon, useMantineColorScheme } from '@mantine/core'
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
  IconBrain,
  IconLogout,
  IconLanguage,
  IconTools,
  IconClipboardCheck,
  IconTable,
} from '@tabler/icons-react'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
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
          ? 'var(--mantine-color-blue-9)'
          : 'var(--mantine-color-blue-0)',
        color: isDark ? 'var(--mantine-color-blue-3)' : 'var(--mantine-color-blue-7)',
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
  const queryClient = useQueryClient()

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
        width: { base: '100%', sm: 280 },
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
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Parko" width={32} height={32} />
              <Text fw={700} size="xl" c="white">Parko</Text>
            </Group>
          </Group>

          <Group gap="sm">
            <Group gap="sm" visibleFrom="sm">
              <ThemeToggle />
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
            <Select
              leftSection={<IconLanguage size={14} color="rgba(255,255,255,0.7)" />}
              data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
              value={user?.language ?? 'ru'}
              onChange={(value) => {
                if (!value) return
                if (!user) return
                void i18n.changeLanguage(value)
                showSuccess(t('common.language_changed', { lang: value.toUpperCase() }))
                queryClient.invalidateQueries({ queryKey: ['dashboard', 'insights'] })
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
              w={80}
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
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        bg={isDark ? '#141517' : 'white'}
        p="xs"
        className="app-shell-navbar"
        style={{
          borderRight: `1px solid ${isDark ? '#2C2E33' : 'var(--mantine-color-gray-2)'}`,
          maxWidth: '100vw',
        }}
      >
        {/* User Info Card — clickable */}
        <RouterNavLink
          to="/profile"
          onClick={() => toggle()}
          style={({ isActive }) => ({
            textDecoration: 'none',
            display: 'block',
            borderRadius: 'var(--mantine-radius-md)',
            marginBottom: 'var(--mantine-spacing-md)',
            background: isActive
              ? (isDark ? 'var(--mantine-color-blue-9)' : 'var(--mantine-color-blue-0)')
              : (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'),
            border: `1px solid ${isActive
              ? (isDark ? 'var(--mantine-color-blue-7)' : 'var(--mantine-color-blue-3)')
              : (isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)')}`,
          })}
        >
          {({ isActive }) => (
            <Group gap="sm" p="sm" style={{ cursor: 'pointer' }}>
              <Avatar size={40} radius="xl" color="blue" variant="filled">
                {getInitials()}
              </Avatar>
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text
                  size="sm"
                  fw={600}
                  truncate
                  c={isActive ? (isDark ? 'var(--mantine-color-blue-3)' : 'var(--mantine-color-blue-7)') : undefined}
                >
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
          )}
        </RouterNavLink>

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

          {/* CRUD Section - Grouped and Highlighted */}
          <Divider
            my="sm"
            label={t('common.data_management')}
            labelPosition="left"
            styles={{
              label: {
                color: isDark ? '#74b0f0' : '#1971c2',
                fontWeight: 600,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
            }}
          />

          <Group gap={4} mb={4} px="xs">
            <ThemeIcon size={16} variant="light" color="blue" radius="xl">
              <IconClipboardCheck size={10} />
            </ThemeIcon>
            <Text size="xs" fw={600} c={isDark ? 'blue.3' : 'blue.7'}>
              {t('common.main_tables')}
            </Text>
          </Group>

          <NavLink
            component={RouterNavLink}
            to="/cars"
            label={t('cars.title')}
            leftSection={<IconCar size={18} stroke={1.5} color={isDark ? '#4dabf7' : '#1971c2'} />}
            active={activePath.startsWith('/cars')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/cars'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/fuel"
            label={t('fuel.title')}
            leftSection={<IconGasStation size={18} stroke={1.5} color={isDark ? '#69db7c' : '#40c057'} />}
            active={activePath.startsWith('/fuel')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/fuel'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/spares"
            label={t('spares.title')}
            leftSection={<IconTools size={18} stroke={1.5} color={isDark ? '#ffa94d' : '#fd7e14'} />}
            active={activePath.startsWith('/spares')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/spares'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/insurances"
            label={t('insurances.title')}
            leftSection={<IconShield size={18} stroke={1.5} color={isDark ? '#9775fa' : '#845ef7'} />}
            active={activePath.startsWith('/insurances')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/insurances'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/inspections"
            label={t('inspections.title')}
            leftSection={<IconCalendarStats size={18} stroke={1.5} color={isDark ? '#f783ac' : '#e64980'} />}
            active={activePath.startsWith('/inspections')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/inspections'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/users"
            label={t('users.title')}
            leftSection={<IconUsers size={18} stroke={1.5} color={isDark ? '#38d9a9' : '#20c997'} />}
            active={activePath.startsWith('/users')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/users'))}
          />

          <Divider my="sm" />

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
            to="/custom-tables"
            label={t('custom_tables.title')}
            leftSection={<IconTable size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/custom-tables')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/custom-tables'))}
          />
          <NavLink
            component={RouterNavLink}
            to="/ai"
            label={t('ai.title')}
            leftSection={<IconBrain size={18} stroke={1.5} color={isDark ? '#868e96' : undefined} />}
            active={activePath.startsWith('/ai')}
            onClick={() => toggle()}
            styles={() => getNavStyles(isDark, activePath.startsWith('/ai'))}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

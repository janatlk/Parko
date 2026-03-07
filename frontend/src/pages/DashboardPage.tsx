import {
  Alert,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconCar,
  IconAlertTriangle,
  IconFlame,
  IconTools,
  IconShield,
  IconCalendar,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { useDashboardStats, useExpiringItems, useFuelStatsByMonth, useRecentFuelEntries } from '@features/dashboard/hooks/useDashboard'
import { StatsGrid } from '@features/dashboard/ui/StatCard'
import { ExpiringSoon } from '@features/dashboard/ui/ExpiringSoon'
import { RecentActivity } from '@features/dashboard/ui/RecentActivity'
import { FuelChart } from '@features/dashboard/ui/FuelChart'
import { CarsByStatus } from '@features/dashboard/ui/CarsByStatus'

export function DashboardPage() {
  const { t } = useTranslation()

  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: expiringItems, isLoading: expiringLoading } = useExpiringItems()
  const { data: fuelEntries, isLoading: fuelLoading } = useRecentFuelEntries(5)
  const { data: fuelByMonth, isLoading: fuelChartLoading } = useFuelStatsByMonth(6)

  if (statsLoading) {
    return (
      <Container py="xl">
        <Group justify="center" py="xl">
          <Loader size="xl" />
        </Group>
      </Container>
    )
  }

  if (statsError) {
    return (
      <Container py="xl">
        <Alert icon={<IconAlertTriangle size={20} />} color="red" title={t('common.error_loading')}>
          {t('dashboard.loading_error')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="fluid" px="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2} fw={700}>{t('dashboard.title')}</Title>
            <Text c="dimmed" size="sm">{t('dashboard.welcome')}</Text>
          </div>
        </Group>

        {/* Stats Grid */}
        <StatsGrid
          stats={[
            {
              icon: <IconCar size={24} />,
              label: t('cars.title'),
              value: stats?.total_cars ?? 0,
              color: 'blue',
              ringValue: stats && stats.total_cars > 0
                ? Math.round((stats.active_cars / stats.total_cars) * 100)
                : 0,
            },
            {
              icon: <IconFlame size={24} />,
              label: t('dashboard.total_fuel_cost'),
              value: `${(stats?.total_fuel_cost_month ?? 0).toLocaleString('ru-RU')} с.`,
              color: 'green',
            },
            {
              icon: <IconShield size={24} />,
              label: t('dashboard.active_insurances'),
              value: stats?.active_insurances ?? 0,
              color: 'teal',
            },
            {
              icon: <IconTools size={24} />,
              label: t('dashboard.maintenance_cost'),
              value: `${(stats?.total_maintenance_cost_month ?? 0).toLocaleString('ru-RU')} с.`,
              color: 'orange',
            },
          ]}
        />

        {/* Additional Stats Row */}
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md">
          <Paper p="md" radius="md" withBorder>
            <Group gap="sm">
              <IconCar size={28} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed" fw={500}>{t('dashboard.active_cars')}</Text>
                <Text size="lg" fw={700}>{stats?.active_cars ?? 0}</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Group gap="sm">
              <IconTools size={28} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed" fw={500}>{t('dashboard.maintenance_cars')}</Text>
                <Text size="lg" fw={700}>{stats?.maintenance_cars ?? 0}</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Group gap="sm">
              <IconCalendar size={28} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed" fw={500}>{t('dashboard.active_inspections')}</Text>
                <Text size="lg" fw={700}>{stats?.active_inspections ?? 0}</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Group gap="sm">
              <IconTrendingUp size={28} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed" fw={500}>{t('dashboard.avg_consumption')}</Text>
                <Text size="lg" fw={700}>{stats?.avg_fuel_consumption ?? 0} л/100км</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Main Content Grid */}
        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
          {/* Left Column - Charts and Overview */}
          <Stack gap="md" style={{ gridColumn: 'span 2' }}>
            {/* Fuel Chart */}
            <Paper p="md" radius="md" withBorder>
              <FuelChart data={fuelByMonth} isLoading={fuelChartLoading} />
            </Paper>

            {/* Recent Activity */}
            <Paper p="md" radius="md" withBorder>
              <RecentActivity fuelEntries={fuelEntries} isLoading={fuelLoading} />
            </Paper>
          </Stack>

          {/* Right Column - Alerts and Status */}
          <Stack gap="md">
            {/* Expiring Items */}
            <Paper p="md" radius="md" withBorder>
              <ExpiringSoon items={expiringItems} isLoading={expiringLoading} />
            </Paper>

            {/* Fleet Overview Pie Chart */}
            <Paper p="md" radius="md" withBorder>
              <CarsByStatus
                total={stats?.total_cars}
                active={stats?.active_cars}
                maintenance={stats?.maintenance_cars}
                inactive={stats?.inactive_cars}
              />
            </Paper>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Container>
  )
}

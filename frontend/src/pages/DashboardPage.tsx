import { useState } from 'react'

import {
  ActionIcon,
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
import { IconAlertTriangle, IconCar, IconFlame, IconSettings, IconTools } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import {
  useDashboardStats,
  useExpiringItems,
  useActivityFeed,
  useCostByMonth,
  useVehicleConsumption,
  loadDashboardPreferences,
} from '@features/dashboard'
import { StatsGrid } from '@features/dashboard/ui/StatCard'
import { ExpiringSoon } from '@features/dashboard/ui/ExpiringSoon'
import { ActivityFeed } from '@features/dashboard/ui/ActivityFeed'
import { CostBreakdownChart } from '@features/dashboard/ui/CostBreakdownChart'
import { CarsByStatus } from '@features/dashboard/ui/CarsByStatus'
import { CustomizationPanel } from '@features/dashboard/ui/CustomizationPanel'
import { VehicleConsumptionList } from '@features/dashboard/ui/VehicleConsumptionList'

export function DashboardPage() {
  const { t } = useTranslation()

  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [preferences, setPreferences] = useState(() => loadDashboardPreferences())
  const [chartMonths, setChartMonths] = useState<string>('6')

  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: expiringData, isLoading: expiringLoading } = useExpiringItems()
  const { data: activityItems, isLoading: activityLoading } = useActivityFeed(10)
  const { data: costData, isLoading: costLoading } = useCostByMonth(Number(chartMonths))
  const { data: vehicleConsumption, isLoading: vehicleLoading } = useVehicleConsumption(10)

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

  const totalCars = stats?.total_cars ?? 0
  const activeCars = stats?.active_cars ?? 0

  // Build stat cards array based on preferences
  const statCards = [
    preferences.showOperationalCost ? {
      icon: <IconCar size={24} />,
      label: t('dashboard.total_operational_cost'),
      value: `${(stats?.total_operational_cost ?? 0).toLocaleString('ru-RU')} с.`,
      color: 'blue',
      currentValue: stats?.total_operational_cost,
      previousValue: stats?.prev_operational_cost,
      inverseTrend: true,
      ringValue: totalCars > 0 ? Math.round((activeCars / totalCars) * 100) : 0,
    } : null,
    preferences.showActiveCars ? {
      icon: <IconCar size={24} />,
      label: t('dashboard.active_cars'),
      value: `${stats?.active_cars ?? 0} / ${totalCars}`,
      color: 'teal',
      ringValue: totalCars > 0 ? Math.round((activeCars / totalCars) * 100) : 0,
    } : null,
    preferences.showAvgConsumption ? {
      icon: <IconFlame size={24} />,
      label: t('dashboard.avg_consumption'),
      value: `${(stats?.avg_fuel_consumption ?? 0).toFixed(1)} л/100км`,
      color: 'green',
      currentValue: stats?.avg_fuel_consumption,
      previousValue: stats?.prev_avg_fuel_consumption,
      inverseTrend: true,
    } : null,
    preferences.showMaintenanceCars ? {
      icon: <IconTools size={24} />,
      label: t('dashboard.maintenance_cars'),
      value: stats?.maintenance_cars ?? 0,
      color: 'orange',
      ringValue: totalCars > 0 ? Math.round((stats?.maintenance_cars ?? 0) / totalCars * 100) : 0,
    } : null,
  ].filter((card): card is NonNullable<typeof card> => card !== null)

  // Determine grid columns based on visible widgets
  const visibleWidgets = [
    preferences.showCostChart,
    preferences.showActivityFeed,
    preferences.showExpiringSoon,
    preferences.showFleetStatus,
    preferences.showVehicleConsumption,
  ].filter(Boolean).length

  const gridCols = visibleWidgets <= 2 ? 2 : 3

  return (
    <Container size="fluid" px={preferences.compactMode ? 'md' : 'xl'} py={preferences.compactMode ? 'md' : 'xl'} className={preferences.compactMode ? 'dashboard-compact' : ''}>
      <Stack gap={preferences.compactMode ? 'sm' : 'xl'}>
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2} fw={700} size={preferences.compactMode ? 'xl' : undefined}>{t('dashboard.title')}</Title>
            <Text c="dimmed" size={preferences.compactMode ? 'xs' : 'sm'}>{t('dashboard.welcome')}</Text>
          </div>
          <ActionIcon
            variant="outline"
            size={preferences.compactMode ? 'md' : 'lg'}
            radius="md"
            onClick={() => setPreferencesOpen(true)}
          >
            <IconSettings size={20} />
          </ActionIcon>
        </Group>

        {/* Stat Cards Grid */}
        {statCards.length > 0 && (
          <StatsGrid stats={statCards} compact={preferences.compactMode} />
        )}

        {/* Main Dashboard Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: gridCols }} spacing={preferences.compactMode ? 'sm' : 'md'}>
          {preferences.showCostChart && (
            <Paper p={preferences.compactMode ? 'sm' : 'md'} radius="md" withBorder style={{ minHeight: preferences.compactMode ? 280 : 380 }}>
              <CostBreakdownChart data={costData} isLoading={costLoading} monthsRange={chartMonths} setMonthsRange={setChartMonths} compact={preferences.compactMode} />
            </Paper>
          )}

          {preferences.showActivityFeed && (
            <Paper p={preferences.compactMode ? 'sm' : 'md'} radius="md" withBorder style={{ minHeight: preferences.compactMode ? 280 : 380 }}>
              <ActivityFeed items={activityItems} isLoading={activityLoading} compact={preferences.compactMode} />
            </Paper>
          )}

          {preferences.showExpiringSoon && (
            <Paper p={preferences.compactMode ? 'sm' : 'md'} radius="md" withBorder style={{ minHeight: preferences.compactMode ? 280 : 380 }}>
              <ExpiringSoon data={expiringData} isLoading={expiringLoading} compact={preferences.compactMode} />
            </Paper>
          )}

          {preferences.showFleetStatus && (
            <Paper p={preferences.compactMode ? 'sm' : 'md'} radius="md" withBorder style={{ minHeight: preferences.compactMode ? 240 : 340 }}>
              <CarsByStatus
                total={stats?.total_cars}
                active={stats?.active_cars}
                maintenance={stats?.maintenance_cars}
                inactive={stats?.inactive_cars}
                compact={preferences.compactMode}
              />
            </Paper>
          )}

          {preferences.showVehicleConsumption && (
            <Paper p={preferences.compactMode ? 'sm' : 'md'} radius="md" withBorder style={{ minHeight: preferences.compactMode ? 240 : 340 }}>
              <VehicleConsumptionList items={vehicleConsumption} isLoading={vehicleLoading} compact={preferences.compactMode} />
            </Paper>
          )}
        </SimpleGrid>
      </Stack>

      {/* Customization Drawer */}
      <CustomizationPanel
        opened={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        preferences={preferences}
        onPreferencesChange={setPreferences}
      />
    </Container>
  )
}

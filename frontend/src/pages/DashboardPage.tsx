import { useState } from 'react'

import {
  ActionIcon,
  Alert,
  Box,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconAlertTriangle, IconCar, IconFlame, IconSettings, IconTools, IconRefresh } from '@tabler/icons-react'
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
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [preferences, setPreferences] = useState(() => loadDashboardPreferences())
  const [chartMonths, setChartMonths] = useState<string>('6')
  const [costChartSize, setCostChartSize] = useState<{ w: number; h: number } | null>(null)
  const [carsChartSize, setCarsChartSize] = useState<{ w: number; h: number } | null>(null)

  const handleResetLayout = () => {
    setCostChartSize(null)
    setCarsChartSize(null)
    localStorage.removeItem('parko_cost_chart_size')
    localStorage.removeItem('parko_cars_chart_size')
  }

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

  const statCards = [
    preferences.showOperationalCost ? {
      icon: <IconCar size={24} />,
      label: t('dashboard.total_operational_cost'),
      value: formatPrice(stats?.total_operational_cost ?? 0, currency),
      color: 'blue',
      currentValue: stats?.total_operational_cost,
      previousValue: stats?.prev_operational_cost,
      inverseTrend: true,
    } : null,
    preferences.showActiveCars ? {
      icon: <IconCar size={24} />,
      label: t('dashboard.active_cars'),
      value: `${stats?.active_cars ?? 0} / ${totalCars}`,
      color: 'teal',
    } : null,
    preferences.showAvgConsumption ? {
      icon: <IconFlame size={24} />,
      label: t('dashboard.avg_consumption'),
      value: `${(stats?.avg_fuel_consumption ?? 0).toFixed(1)} ${t('dashboard.avg_consumption_unit')}`,
      color: 'green',
      currentValue: stats?.avg_fuel_consumption,
      previousValue: stats?.prev_avg_fuel_consumption,
      inverseTrend: true,
    } : null,
    preferences.showSparePartsCost ? {
      icon: <IconTools size={24} />,
      label: t('dashboard.spare_parts_cost'),
      value: formatPrice(stats?.total_spare_parts_cost_month ?? 0, currency),
      color: 'cyan',
      currentValue: stats?.total_spare_parts_cost_month,
      previousValue: stats?.total_spare_parts_cost_prev_month,
      inverseTrend: true,
    } : null,
    preferences.showMaintenanceCars ? {
      icon: <IconTools size={24} />,
      label: t('dashboard.maintenance_cars'),
      value: stats?.maintenance_cars ?? 0,
      color: 'orange',
    } : null,
  ].filter((card): card is NonNullable<typeof card> => card !== null)

  return (
    <Container size="fluid" px="md" py="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2} fw={700}>{t('dashboard.title')}</Title>
            <Text c="dimmed" size="xs">{t('dashboard.welcome')}</Text>
          </div>
          <Group gap="xs">
            <Tooltip label="Reset chart sizes">
              <ActionIcon
                variant="outline"
                size="md"
                radius="md"
                onClick={handleResetLayout}
              >
                <IconRefresh size={20} />
              </ActionIcon>
            </Tooltip>
            <ActionIcon
              variant="outline"
              size="md"
              radius="md"
              onClick={() => setPreferencesOpen(true)}
            >
              <IconSettings size={20} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Stat Cards Grid */}
        {statCards.length > 0 && (
          <StatsGrid stats={statCards} compact />
        )}

        {/* Main Dashboard Grid — Flexbox for dynamic sizing */}
        <Box
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          {preferences.showCostChart && (
            <Box
              style={{
                flex: costChartSize && costChartSize.w > 0
                  ? `0 0 ${costChartSize.w}px`
                  : '1 1 300px',
                minWidth: 280,
              }}
            >
              <Paper p="sm" radius="md" withBorder style={{ overflow: 'visible' }}>
                <CostBreakdownChart
                  data={costData}
                  isLoading={costLoading}
                  monthsRange={chartMonths}
                  setMonthsRange={setChartMonths}
                  compact
                  onResize={setCostChartSize}
                />
              </Paper>
            </Box>
          )}

          {preferences.showActivityFeed && (
            <Box style={{ flex: '1 1 300px', minWidth: 280 }}>
              <Paper p="sm" radius="md" withBorder>
                <ActivityFeed items={activityItems} isLoading={activityLoading} compact />
              </Paper>
            </Box>
          )}

          {preferences.showExpiringSoon && (
            <Box style={{ flex: '1 1 300px', minWidth: 280 }}>
              <Paper p="sm" radius="md" withBorder>
                <ExpiringSoon data={expiringData} isLoading={expiringLoading} compact />
              </Paper>
            </Box>
          )}

          {preferences.showFleetStatus && (
            <Box
              style={{
                flex: carsChartSize && carsChartSize.w > 0
                  ? `0 0 ${carsChartSize.w}px`
                  : '1 1 300px',
                minWidth: 280,
              }}
            >
              <Paper p="sm" radius="md" withBorder style={{ overflow: 'visible' }}>
                <CarsByStatus
                  total={stats?.total_cars}
                  active={stats?.active_cars}
                  maintenance={stats?.maintenance_cars}
                  inactive={stats?.inactive_cars}
                  compact
                  onResize={setCarsChartSize}
                />
              </Paper>
            </Box>
          )}

          {preferences.showVehicleConsumption && (
            <Box style={{ flex: '1 1 300px', minWidth: 280 }}>
              <Paper p="sm" radius="md" withBorder>
                <VehicleConsumptionList items={vehicleConsumption} isLoading={vehicleLoading} compact />
              </Paper>
            </Box>
          )}
        </Box>
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

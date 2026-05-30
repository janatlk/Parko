import {
  Alert,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconCar, IconFlame, IconGasStation, IconTools } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { useDashboardOverview } from '@features/dashboard'
import { StatsGrid } from '@features/dashboard/ui/StatCard'
import { CostTrendChart } from '@features/dashboard/ui/CostTrendChart'
import { FuelEfficiencyChart } from '@features/dashboard/ui/FuelEfficiencyChart'
import { TopVehiclesChart } from '@features/dashboard/ui/TopVehiclesChart'
import { ExpiringTable } from '@features/dashboard/ui/ExpiringTable'
import { ActivityTimeline } from '@features/dashboard/ui/ActivityTimeline'
import { VehicleRadarChart } from '@features/dashboard/ui/VehicleRadarChart'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  const { data, isLoading, error, refetch } = useDashboardOverview(12, 8)

  if (isLoading) {
    return (
      <Container size="fluid" px="sm" py="sm">
        <Stack gap="sm">
          <Skeleton height={32} width={180} radius="md" />
          <SimpleGridSkeleton />
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Skeleton height={220} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Skeleton height={220} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Skeleton height={260} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Skeleton height={260} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Skeleton height={260} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Skeleton height={260} radius="md" />
            </Grid.Col>
            <Grid.Col span={12}>
              <Skeleton height={140} radius="md" />
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="fluid" px="sm" py="sm">
        <Alert
          icon={<IconAlertTriangle size={18} />}
          color="red"
          title={t('common.error_loading')}
          mb="sm"
        >
          {t('dashboard.loading_error')}
        </Alert>
        <Button onClick={() => refetch()} variant="light" color="blue" size="sm">
          {t('common.retry')}
        </Button>
      </Container>
    )
  }

  const stats = data?.stats
  const history = data?.history || []

  const statCards = [
    {
      icon: <IconCar size={18} />,
      label: t('dashboard.active_cars'),
      value: `${stats?.active_cars ?? 0} / ${stats?.total_cars ?? 0}`,
      color: '#228be6',
    },
    {
      icon: <IconGasStation size={18} />,
      label: t('dashboard.total_fuel_cost'),
      value: formatPrice(stats?.total_fuel_cost_month ?? 0, currency),
      color: '#40c057',
      currentValue: stats?.total_fuel_cost_month,
      previousValue: stats?.total_fuel_cost_prev_month,
      inverseTrend: true,
      sparklineData: history.map((h) => ({ value: h.fuel_cost })),
    },
    {
      icon: <IconFlame size={18} />,
      label: t('dashboard.avg_consumption'),
      value: `${(stats?.avg_fuel_consumption ?? 0).toFixed(1)} ${t('dashboard.avg_consumption_unit')}`,
      color: '#fd7e14',
      sparklineData: history.map((h) => ({ value: h.avg_consumption })),
    },
    {
      icon: <IconTools size={18} />,
      label: t('dashboard.total_operational_cost'),
      value: formatPrice(stats?.total_operational_cost ?? 0, currency),
      color: '#845ef7',
      currentValue: stats?.total_operational_cost,
      previousValue: stats?.prev_operational_cost,
      inverseTrend: true,
      sparklineData: history.map((h) => ({ value: h.total_cost })),
    },
  ]

  // Limit activity items to align height with TopVehiclesChart
  const activityItems = data?.activity?.slice(0, 6)

  return (
    <Container size="fluid" px="sm" py="sm">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={3} fw={700}>{t('dashboard.title')}</Title>
            <Text c="dimmed" size="xs">{t('dashboard.welcome')}</Text>
          </div>
        </Group>

        {/* Stat Cards */}
        <StatsGrid stats={statCards} />

        {/* Main Grid */}
        <Grid gutter="sm" align="stretch">
          {/* Cost Trend */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder p="sm" radius="md" h="100%">
              <CostTrendChart data={history} />
            </Paper>
          </Grid.Col>

          {/* Fuel Efficiency */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="sm" radius="md" h="100%">
              <FuelEfficiencyChart data={history} />
            </Paper>
          </Grid.Col>

          {/* Vehicle Comparison — Radar */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="sm" radius="md" h="100%">
              <VehicleRadarChart data={data?.top_vehicles} />
            </Paper>
          </Grid.Col>

          {/* Top Vehicles */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="sm" radius="md" h="100%">
              <TopVehiclesChart data={data?.top_vehicles} />
            </Paper>
          </Grid.Col>

          {/* Recent Activity — sliced to match TopVehicles height */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="sm" radius="md" h="100%">
              <ActivityTimeline items={activityItems} />
            </Paper>
          </Grid.Col>

          {/* Expiring Soon */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="sm" radius="md" h="100%">
              <ExpiringTable data={data?.expiring} />
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}

function SimpleGridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} height={88} radius="md" />
      ))}
    </div>
  )
}

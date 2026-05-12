import { Box, Group, Text, useMantineColorScheme } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatPrice } from '@shared/utils/formatPrice'
import type { TopVehicle } from '@features/dashboard/api/dashboardApi'

const COLORS = ['#228be6', '#40c057', '#fab005', '#fd7e14', '#845ef7']
const COLORS_DARK = ['#4dabf7', '#51cf66', '#fcc419', '#ff922b', '#9775fa']

type VehicleRadarChartProps = {
  data?: TopVehicle[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <Box
      style={{
        background: 'var(--mantine-color-body)',
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 160,
      }}
    >
      <Text size="xs" fw={700} mb={6} tt="capitalize">
        {label}
      </Text>
      {payload.map((p: any) => {
        // Extract raw real value from the data entry
        const rawValue = p.payload?.[`${p.dataKey}_raw`]
        const isCurrency = label !== 'Average Consumption' && label !== 'Средний расход' && label !== 'Орточо сарпталыш'
        const displayValue = rawValue !== undefined
          ? (isCurrency ? formatPrice(rawValue, 'KGS') : `${Number(rawValue).toFixed(1)} л/100км`)
          : `${p.value}%`

        return (
          <Group key={p.dataKey} gap={8} mb={2}>
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: p.color,
                flexShrink: 0,
              }}
            />
            <Text size="xs" c="dimmed" style={{ flex: 1 }}>
              {p.name}
            </Text>
            <Text size="xs" fw={600}>
              {displayValue}
            </Text>
          </Group>
        )
      })}
    </Box>
  )
}

export function VehicleRadarChart({ data = [] }: VehicleRadarChartProps) {
  const { t } = useTranslation()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? COLORS_DARK : COLORS

  const topVehicles = [...data]
    .filter((v) => v.total_cost > 0)
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 3)

  if (topVehicles.length === 0) {
    return (
      <Box>
        <Text fw={600} size="sm" mb="xs">
          {t('dashboard.vehicle_comparison')}
        </Text>
        <Text size="sm" c="dimmed" ta="center" py="md">
          {t('dashboard.no_data')}
        </Text>
      </Box>
    )
  }

  // Normalize metrics to 0-100 scale for radar rendering
  const maxFuel = Math.max(...topVehicles.map((v) => v.fuel_cost), 1)
  const maxMaint = Math.max(...topVehicles.map((v) => v.maintenance_cost), 1)
  const maxOther = Math.max(...topVehicles.map((v) => v.other_cost), 1)
  const maxConsumption = Math.max(...topVehicles.map((v) => v.avg_consumption), 1.1)

  const chartData = [
    {
      metric: t('dashboard.fuel'),
      fullMark: 100,
      ...topVehicles.reduce((acc, v, i) => {
        acc[`v${i}`] = Math.round((v.fuel_cost / maxFuel) * 100)
        acc[`v${i}_raw`] = v.fuel_cost
        return acc
      }, {} as Record<string, number>),
    },
    {
      metric: t('dashboard.maintenance'),
      fullMark: 100,
      ...topVehicles.reduce((acc, v, i) => {
        acc[`v${i}`] = Math.round((v.maintenance_cost / maxMaint) * 100)
        acc[`v${i}_raw`] = v.maintenance_cost
        return acc
      }, {} as Record<string, number>),
    },
    {
      metric: t('dashboard.other'),
      fullMark: 100,
      ...topVehicles.reduce((acc, v, i) => {
        acc[`v${i}`] = Math.round((v.other_cost / maxOther) * 100)
        acc[`v${i}_raw`] = v.other_cost
        return acc
      }, {} as Record<string, number>),
    },
    {
      metric: t('dashboard.avg_consumption'),
      fullMark: 100,
      ...topVehicles.reduce((acc, v, i) => {
        acc[`v${i}`] = Math.round((v.avg_consumption / maxConsumption) * 100)
        acc[`v${i}_raw`] = v.avg_consumption
        return acc
      }, {} as Record<string, number>),
    },
  ]

  return (
    <Box>
      <Text fw={600} size="sm" mb="xs">
        {t('dashboard.vehicle_comparison')}
      </Text>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart cx="50%" cy="52%" outerRadius="62%" data={chartData} margin={{ top: 16, right: 16, bottom: 4, left: 16 }}>
          <PolarGrid
            stroke={isDark ? '#2C2E33' : '#e9ecef'}
            strokeWidth={1}
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 11, fill: isDark ? '#c1c2c5' : '#495057', fontWeight: 500 }}
          />
          <PolarRadiusAxis
            tick={{ fontSize: 9, fill: isDark ? '#5c5f66' : '#adb5bd' }}
            tickCount={4}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {topVehicles.map((v, i) => (
            <Radar
              key={v.id}
              name={v.numplate}
              dataKey={`v${i}`}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.12}
              strokeWidth={2.5}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      <Group gap="xs" justify="center" wrap="wrap" mt={4}>
        {topVehicles.map((v, i) => (
          <Group key={v.id} gap={6}>
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors[i % colors.length],
              }}
            />
            <Text size="xs" c="dimmed" fw={500}>
              {v.numplate}
            </Text>
          </Group>
        ))}
      </Group>
    </Box>
  )
}

import { Box, Text, useMantineColorScheme } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { TopVehicle } from '../api/dashboardApi'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

const BAR_COLOR_LIGHT = '#228be6'
const BAR_COLOR_DARK = '#4dabf7'

type TopVehiclesChartProps = {
  data?: TopVehicle[]
}

export function TopVehiclesChart({ data = [] }: TopVehiclesChartProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const currency = user?.currency || 'KGS'
  const barColor = isDark ? BAR_COLOR_DARK : BAR_COLOR_LIGHT

  const chartData = [...data]
    .sort((a, b) => a.total_cost - b.total_cost)
    .map((v) => ({
      name: v.numplate,
      cost: Math.round(v.total_cost),
      fuel: Math.round(v.fuel_cost),
      maintenance: Math.round(v.maintenance_cost),
      other: Math.round(v.other_cost),
    }))

  // Dynamic height: ~26px per bar + margins
  const chartHeight = Math.max(120, chartData.length * 26 + 40)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload
      return (
        <Box
          bg={isDark ? '#1a1b1e' : 'white'}
          p="xs"
          style={{
            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
            borderRadius: 'var(--mantine-radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <Text fw={600} size="xs" mb={2}>{label}</Text>
          <Text size="xs" fw={600}>{formatPrice(entry.cost, currency)}</Text>
        </Box>
      )
    }
    return null
  }

  return (
    <Box>
      <Text fw={600} size="sm" mb="xs">{t('dashboard.top_vehicles')}</Text>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 2, right: 16, left: 4, bottom: 2 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke={isDark ? '#2C2E33' : '#e9ecef'}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: isDark ? '#868e96' : '#495057' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: isDark ? '#e9ecef' : '#495057' }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="cost" radius={[0, 3, 3, 0]} barSize={16} fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

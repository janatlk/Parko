import { useState } from 'react'
import { Box, Group, SegmentedControl, Text, useMantineColorScheme } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { HistoryMonth } from '../api/dashboardApi'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

type CostTrendChartProps = {
  data?: HistoryMonth[]
}

const CHART_COLOR_LIGHT = '#228be6'
const CHART_COLOR_DARK = '#4dabf7'

export function CostTrendChart({ data = [] }: CostTrendChartProps) {
  const [monthsRange, setMonthsRange] = useState<string>('6')
  const { t } = useTranslation()
  const { user } = useAuth()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const currency = user?.currency || 'KGS'
  const chartColor = isDark ? CHART_COLOR_DARK : CHART_COLOR_LIGHT

  const displayData = data.slice(-Number(monthsRange))

  const chartData = displayData.map((item) => ({
    name: item.month_name.substring(0, 3),
    total: Math.round(item.total_cost),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
          <Text size="xs" fw={600}>{formatPrice(payload[0].value, currency)}</Text>
        </Box>
      )
    }
    return null
  }

  return (
    <Box>
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="sm">{t('dashboard.cost_trend')}</Text>
        <SegmentedControl
          value={monthsRange}
          onChange={setMonthsRange}
          data={[
            { label: '3m', value: '3' },
            { label: '6m', value: '6' },
            { label: '12m', value: '12' },
          ]}
          size="xs"
        />
      </Group>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={isDark ? 0.25 : 0.15} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={isDark ? '#2C2E33' : '#e9ecef'}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: isDark ? '#868e96' : '#495057' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: isDark ? '#868e96' : '#495057' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#costGradient)"
            dot={false}
            activeDot={{ r: 4, fill: chartColor, stroke: isDark ? '#1a1b1e' : '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

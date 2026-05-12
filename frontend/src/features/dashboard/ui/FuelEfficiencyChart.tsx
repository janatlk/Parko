import { useState } from 'react'

import { Box, Group, SegmentedControl, Text, useMantineColorScheme } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { HistoryMonth } from '../api/dashboardApi'

const CHART_COLOR_LIGHT = '#228be6'
const CHART_COLOR_DARK = '#4dabf7'

type FuelEfficiencyChartProps = {
  data?: HistoryMonth[]
}

const GOAL_KEY = 'parko_consumption_goal'

function getGoal(): number {
  try {
    const stored = localStorage.getItem(GOAL_KEY)
    if (stored) return parseFloat(stored)
  } catch { /* ignore */ }
  return 15
}

export function FuelEfficiencyChart({ data = [] }: FuelEfficiencyChartProps) {
  const { t } = useTranslation()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const [monthsRange, setMonthsRange] = useState<string>('6')
  const goal = getGoal()
  const chartColor = isDark ? CHART_COLOR_DARK : CHART_COLOR_LIGHT
  const refColor = isDark ? '#868e96' : '#adb5bd'

  const displayData = data.slice(-Number(monthsRange))

  const chartData = displayData.map((item) => ({
    name: item.month_name.substring(0, 3),
    consumption: item.avg_consumption || 0,
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
          <Text size="xs">{payload[0].value.toFixed(1)} л/100км</Text>
        </Box>
      )
    }
    return null
  }

  return (
    <Box>
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="sm">{t('dashboard.fuel_efficiency')}</Text>
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
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
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
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', strokeWidth: 1 }} />
          <ReferenceLine
            y={goal}
            stroke={refColor}
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `${goal}`,
              position: 'insideTopRight',
              fill: refColor,
              fontSize: 9,
            }}
          />
          <Area
            type="monotone"
            dataKey="consumption"
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#fuelGradient)"
            dot={false}
            activeDot={{ r: 4, fill: chartColor, stroke: isDark ? '#1a1b1e' : '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

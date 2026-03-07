import { useMemo } from 'react'

import { Box, Group, Loader, Text, Title } from '@mantine/core'
import { IconFlame } from '@tabler/icons-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'

import type { FuelStatsByMonth } from '../api/dashboardApi'

type FuelChartProps = {
  data?: FuelStatsByMonth[]
  isLoading?: boolean
}

export function FuelChart({ data = [], isLoading }: FuelChartProps) {
  const { t } = useTranslation()

  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.month_name,
      liters: Math.round(item.total_liters),
      cost: Math.round(item.total_cost),
      consumption: parseFloat(String(item.avg_consumption)) || 0,
    }))
  }, [data])

  type CustomTooltipProps = {
    active?: boolean
    payload?: Array<{ value: number; name: string }>
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length && label) {
      return (
        <Box
          style={{
            backgroundColor: 'var(--mantine-color-body)',
            padding: 'var(--mantine-spacing-sm)',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-default-border)',
            boxShadow: 'var(--mantine-shadow-md)',
          }}
        >
          <Text fw={600} mb="xs">{label}</Text>
          {payload.map((entry, index) => (
            <Group key={index} justify="space-between" gap="lg">
              <Text size="sm" c="dimmed">{entry.name}:</Text>
              <Text size="sm" fw={500}>
                {entry.name === t('dashboard.fuel_liters')
                  ? `${entry.value.toLocaleString('ru-RU')} л`
                  : `${entry.value.toLocaleString('ru-RU')} с.`}
              </Text>
            </Group>
          ))}
        </Box>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader />
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Box p="xl" ta="center">
        <Text c="dimmed">{t('dashboard.no_fuel_data')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('dashboard.fuel_consumption_chart')}</Title>
        <Group gap="xs">
          <IconFlame size={20} stroke={1.5} />
          <Text size="sm" c="dimmed">{t('dashboard.last_months', { count: data.length })}</Text>
        </Group>
      </Group>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}л`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}с.`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="left"
            dataKey="liters"
            name={t('dashboard.fuel_liters')}
            fill="var(--mantine-color-blue-6)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="cost"
            name={t('dashboard.fuel_cost')}
            fill="var(--mantine-color-green-6)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

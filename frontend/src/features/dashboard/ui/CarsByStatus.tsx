import { Box, Group, Loader, Text, Title } from '@mantine/core'
import { IconCar } from '@tabler/icons-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'

type CarsByStatusProps = {
  total?: number
  active?: number
  maintenance?: number
  inactive?: number
  isLoading?: boolean
}

export function CarsByStatus({ total = 0, active = 0, maintenance = 0, inactive = 0, isLoading }: CarsByStatusProps) {
  const { t } = useTranslation()

  const data = [
    { name: t('dashboard.active_cars'), value: active, color: 'var(--mantine-color-teal-6)' },
    { name: t('dashboard.maintenance_cars'), value: maintenance, color: 'var(--mantine-color-orange-6)' },
    { name: t('dashboard.inactive_cars'), value: inactive, color: 'var(--mantine-color-gray-6)' },
  ].filter((item) => item.value > 0)

  type CustomLabelProps = {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    percent?: number
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) => {
    if (!cx || !cy || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || percent === undefined) {
      return null
    }
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader />
      </Box>
    )
  }

  if (total === 0) {
    return (
      <Box p="xl" ta="center">
        <Text c="dimmed">{t('dashboard.no_cars_data')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('dashboard.fleet_overview')}</Title>
        <Group gap="xs">
          <IconCar size={20} stroke={1.5} />
          <Text size="sm" c="dimmed">{total} {t('dashboard.cars_total')}</Text>
        </Group>
      </Group>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  )
}

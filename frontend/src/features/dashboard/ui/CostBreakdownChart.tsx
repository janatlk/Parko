import { useState } from 'react'

import {
  ActionIcon,
  Box,
  Checkbox,
  Group,
  Loader,
  Popover,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconBattery,
  IconCar,
  IconGasStation,
  IconSettings,
  IconTool,
  IconTools,
} from '@tabler/icons-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'

import type { CostByMonth } from '../api/dashboardApi'

type CostCategory = 'fuel' | 'spare' | 'insurance' | 'inspection' | 'tires' | 'accumulator'

type CostBreakdownChartProps = {
  data?: CostByMonth[]
  isLoading?: boolean
  monthsRange?: string
  setMonthsRange?: (months: string) => void
  compact?: boolean
}

type ChartData = {
  name: string
  fuel: number
  spare: number
  insurance: number
  inspection: number
  tires: number
  accumulator: number
  total: number
}

const categoryConfig: Record<CostCategory, { color: string; icon: React.ReactNode; label: string }> = {
  fuel: { color: 'var(--mantine-color-blue-filled)', icon: <IconGasStation size={14} />, label: 'dashboard.fuel' },
  spare: { color: 'var(--mantine-color-orange-filled)', icon: <IconTools size={14} />, label: 'dashboard.spare_parts' },
  insurance: { color: 'var(--mantine-color-green-filled)', icon: <IconCar size={14} />, label: 'dashboard.insurance' },
  inspection: { color: 'var(--mantine-color-teal-filled)', icon: <IconTool size={14} />, label: 'dashboard.inspections' },
  tires: { color: 'var(--mantine-color-violet-filled)', icon: <IconCar size={14} />, label: 'dashboard.tires' },
  accumulator: { color: 'var(--mantine-color-pink-filled)', icon: <IconBattery size={14} />, label: 'dashboard.accumulators' },
}

const defaultCategories: Record<CostCategory, boolean> = {
  fuel: true,
  spare: true,
  insurance: true,
  inspection: true,
  tires: true,
  accumulator: true,
}

export function CostBreakdownChart({ data = [], isLoading, monthsRange, setMonthsRange, compact = false }: CostBreakdownChartProps) {
  const { t } = useTranslation()
  const [localMonthsRange, setLocalMonthsRange] = useState<string>('6')
  const [opened, setOpened] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Record<CostCategory, boolean>>(defaultCategories)
  
  const displayMonths = monthsRange ?? localMonthsRange
  const handleMonthsChange = setMonthsRange ?? setLocalMonthsRange

  const getChartData = (): ChartData[] => {
    if (!data || data.length === 0) return []

    return data.map((item) => ({
      name: item.month_name.substring(0, 3),
      fuel: Math.round(item.fuel_cost),
      spare: Math.round(item.spare_cost),
      insurance: Math.round(item.insurance_cost),
      inspection: Math.round(item.inspection_cost),
      tires: Math.round(item.tires_cost),
      accumulator: Math.round(item.accumulator_cost),
      total: Math.round(item.total_cost),
    }))
  }

  const chartData = getChartData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg="var(--mantine-color-body)"
          p="md"
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Text fw={600} mb="xs">{label}</Text>
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null
            return (
              <Group key={index} justify="space-between" gap="lg">
                <Text c={entry.color} size="sm">{entry.name}:</Text>
                <Text fw={600} size="sm">{entry.value.toLocaleString('ru-RU')} с.</Text>
              </Group>
            )
          })}
          <Group justify="space-between" gap="lg" mt="xs" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Text fw={600} size="sm">{t('dashboard.total')}:</Text>
            <Text fw={700} size="sm">{payload[0]?.payload?.total?.toLocaleString('ru-RU') || 0} с.</Text>
          </Group>
        </Box>
      )
    }
    return null
  }

  const handleCategoryToggle = (category: CostCategory) => {
    setVisibleCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
      </Box>
    )
  }

  if (chartData.length === 0) {
    return (
      <Box p="xl" ta="center">
        <Text c="dimmed">{t('dashboard.no_data')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={compact ? 5 : 4}>{t('dashboard.cost_breakdown')}</Title>
        <Group gap="xs">
          <Popover opened={opened} onChange={setOpened} position="bottom-end" withArrow>
            <Popover.Target>
              <ActionIcon
                variant="outline"
                size={compact ? 'sm' : 'md'}
                onClick={() => setOpened(o => !o)}
              >
                <IconSettings size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="xs">
                <Text size="xs" fw={600}>{t('dashboard.visible_categories')}</Text>
                {(Object.keys(categoryConfig) as CostCategory[]).map((cat) => (
                  <Checkbox
                    key={cat}
                    label={t(categoryConfig[cat].label)}
                    checked={visibleCategories[cat]}
                    onChange={() => handleCategoryToggle(cat)}
                    size="xs"
                  />
                ))}
              </Stack>
            </Popover.Dropdown>
          </Popover>
          
          <SegmentedControl
            value={displayMonths}
            onChange={handleMonthsChange}
            data={[
              { label: '3m', value: '3' },
              { label: '6m', value: '6' },
              { label: '12m', value: '12' },
            ]}
            size={compact ? 'xs' : 'sm'}
          />
        </Group>
      </Group>
      <Box style={{ height: compact ? 240 : 300, minHeight: compact ? 240 : 300 }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={compact ? 240 : 300}>
          <BarChart
            data={chartData}
            margin={{ top: compact ? 5 : 10, right: compact ? 5 : 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--mantine-color-default-hover)' }} />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value) => {
                const cat = value as CostCategory
                return t(categoryConfig[cat]?.label || value)
              }}
            />
            {visibleCategories.fuel && (
              <Bar
                dataKey="fuel"
                stackId="cost"
                fill={categoryConfig.fuel.color}
                name={t(categoryConfig.fuel.label)}
                radius={[0, 0, 4, 4]}
              />
            )}
            {visibleCategories.spare && (
              <Bar
                dataKey="spare"
                stackId="cost"
                fill={categoryConfig.spare.color}
                name={t(categoryConfig.spare.label)}
              />
            )}
            {visibleCategories.insurance && (
              <Bar
                dataKey="insurance"
                stackId="cost"
                fill={categoryConfig.insurance.color}
                name={t(categoryConfig.insurance.label)}
              />
            )}
            {visibleCategories.inspection && (
              <Bar
                dataKey="inspection"
                stackId="cost"
                fill={categoryConfig.inspection.color}
                name={t(categoryConfig.inspection.label)}
              />
            )}
            {visibleCategories.tires && (
              <Bar
                dataKey="tires"
                stackId="cost"
                fill={categoryConfig.tires.color}
                name={t(categoryConfig.tires.label)}
              />
            )}
            {visibleCategories.accumulator && (
              <Bar
                dataKey="accumulator"
                stackId="cost"
                fill={categoryConfig.accumulator.color}
                name={t(categoryConfig.accumulator.label)}
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

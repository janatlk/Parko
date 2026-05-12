import type { ReactNode } from 'react'

import { Group, Paper, SimpleGrid, Stack, Text, useMantineColorScheme } from '@mantine/core'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { TrendIndicator } from './TrendIndicator'

type SparklineData = {
  value: number
}

type StatCardProps = {
  icon: ReactNode
  label: string
  value: string | number
  color?: string
  currentValue?: number
  previousValue?: number
  inverseTrend?: boolean
  sparklineData?: SparklineData[]
}

const SPARKLINE_COLOR_LIGHT = '#228be6'
const SPARKLINE_COLOR_DARK = '#4dabf7'

function MiniSparkline({ data, isDark }: { data: SparklineData[]; isDark: boolean }) {
  if (!data || data.length < 2) return null
  const color = isDark ? SPARKLINE_COLOR_DARK : SPARKLINE_COLOR_LIGHT

  return (
    <div style={{ width: '100%', height: 32, marginTop: 6 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={isDark ? 0.25 : 0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#sparklineGrad)"
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip content={() => null} cursor={{ stroke: 'transparent' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatCard({
  icon,
  label,
  value,
  color = '#228be6',
  currentValue,
  previousValue,
  inverseTrend = false,
  sparklineData,
}: StatCardProps) {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        background: isDark ? '#1a1b1e' : '#ffffff',
        borderColor: isDark ? '#2C2E33' : '#e9ecef',
      }}
    >
      <Group justify="space-between" align="flex-start" gap="xs">
        <Stack gap={2} style={{ flex: 1 }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text size="lg" fw={700} style={{ color: isDark ? '#e9ecef' : '#212529', lineHeight: 1.2 }}>
            {value}
          </Text>
          {currentValue !== undefined && previousValue !== undefined && (
            <TrendIndicator
              currentValue={currentValue}
              previousValue={previousValue}
              inverseGood={inverseTrend}
            />
          )}
        </Stack>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isDark ? `${color}18` : `${color}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </Group>
      {sparklineData && sparklineData.length > 1 && (
        <MiniSparkline data={sparklineData} isDark={isDark} />
      )}
    </Paper>
  )
}

type StatsGridProps = {
  stats: Array<{
    icon: ReactNode
    label: string
    value: string | number
    color?: string
    currentValue?: number
    previousValue?: number
    inverseTrend?: boolean
    sparklineData?: SparklineData[]
  }>
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </SimpleGrid>
  )
}

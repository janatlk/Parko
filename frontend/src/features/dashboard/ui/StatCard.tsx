import type { ReactNode } from 'react'

import type { MantineColor } from '@mantine/core'
import { Group, SimpleGrid, Stack, Text, ThemeIcon, useMantineColorScheme } from '@mantine/core'

import { TrendIndicator } from './TrendIndicator'

type StatCardProps = {
  icon: ReactNode
  label: string
  value: string | number
  color?: MantineColor
  currentValue?: number
  previousValue?: number
  inverseTrend?: boolean
  compact?: boolean
}

function getColors(color: string, isDark: boolean) {
  const light: Record<string, { bg: string; border: string; text: string; valueText: string }> = {
    blue: { bg: 'linear-gradient(135deg, #e7f5ff 0%, #d0ebff 100%)', border: '#a5d8ff', text: '#1971c2', valueText: '#1864ab' },
    teal: { bg: 'linear-gradient(135deg, #e6fcf5 0%, #c3fae8 100%)', border: '#96f2d7', text: '#0ca678', valueText: '#099268' },
    green: { bg: 'linear-gradient(135deg, #ebfbee 0%, #d3f9d8 100%)', border: '#b2f2bb', text: '#2f9e44', valueText: '#2b8a3e' },
    cyan: { bg: 'linear-gradient(135deg, #e3fafc 0%, #c5f6fa 100%)', border: '#99e9f2', text: '#1098ad', valueText: '#0c8599' },
    orange: { bg: 'linear-gradient(135deg, #fff4e6 0%, #ffe8cc 100%)', border: '#ffd8a8', text: '#e67700', valueText: '#d9480f' },
    violet: { bg: 'linear-gradient(135deg, #f3f0ff 0%, #e5dbff 100%)', border: '#d0bfff', text: '#7048e8', valueText: '#5f3dc4' },
    red: { bg: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)', border: '#ffc9c9', text: '#e03131', valueText: '#c92a2a' },
  }
  const dark: Record<string, { bg: string; border: string; text: string; valueText: string }> = {
    blue: { bg: 'linear-gradient(135deg, #1c3a5f 0%, #18304a 100%)', border: '#2a5a8f', text: '#74b0f0', valueText: '#91c4f5' },
    teal: { bg: 'linear-gradient(135deg, #1a3a3a 0%, #152e2e 100%)', border: '#2a6a6a', text: '#63d0b8', valueText: '#80e0cc' },
    green: { bg: 'linear-gradient(135deg, #1a3a2a 0%, #152e22 100%)', border: '#2a6a4a', text: '#69db7c', valueText: '#8ce99a' },
    cyan: { bg: 'linear-gradient(135deg, #1a3a4a 0%, #152e3a 100%)', border: '#2a6a8a', text: '#66d9e8', valueText: '#80e5f0' },
    orange: { bg: 'linear-gradient(135deg, #3a2a1a 0%, #2e2215 100%)', border: '#6a4a2a', text: '#ffa94d', valueText: '#ffc078' },
    violet: { bg: 'linear-gradient(135deg, #2a1a4a 0%, #22153a 100%)', border: '#4a2a7a', text: '#b197fc', valueText: '#c8a8ff' },
    red: { bg: 'linear-gradient(135deg, #3a1a1a 0%, #2e1515 100%)', border: '#6a2a2a', text: '#ff8787', valueText: '#ffa8a8' },
  }
  const map = isDark ? dark : light
  return map[color] || map.blue
}

export function StatCard({
  icon,
  label,
  value,
  color = 'blue',
  currentValue,
  previousValue,
  inverseTrend = false,
  compact = false,
}: StatCardProps) {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = getColors(color as string, isDark)

  return (
    <Group
      justify="space-between"
      align="center"
      p={compact ? 'sm' : 'md'}
      style={{
        background: colors.bg,
        borderRadius: 'var(--mantine-radius-md)',
        border: `1px solid ${colors.border}`,
      }}
    >
      <Stack gap={compact ? 2 : 'xs'}>
        <Text size={compact ? 'xs' : 'sm'} fw={500} style={{ color: colors.text }}>
          {label}
        </Text>
        <Text size={compact ? 'lg' : 'xl'} fw={700} style={{ color: colors.valueText }}>
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
      <ThemeIcon
        size={compact ? 40 : 48}
        variant="gradient"
        gradient={{ from: `${color}-4`, to: `${color}-7` }}
        radius="md"
      >
        {icon}
      </ThemeIcon>
    </Group>
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
  }>
  compact?: boolean
}

export function StatsGrid({ stats, compact = false }: StatsGridProps) {
  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 4 }}
      spacing={compact ? 'sm' : 'md'}
    >
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} compact={compact} />
      ))}
    </SimpleGrid>
  )
}

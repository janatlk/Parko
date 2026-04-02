import type { ReactNode } from 'react'

import { Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'

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
  return (
    <Group
      justify="space-between"
      align="center"
      p={compact ? 'sm' : 'md'}
      style={{
        backgroundColor: 'var(--mantine-color-body)',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Stack gap={compact ? 2 : 'xs'}>
        <Text size={compact ? 'xs' : 'sm'} c="dimmed" fw={500}>
          {label}
        </Text>
        <Text size={compact ? 'lg' : 'xl'} fw={700}>
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
        variant="light" 
        color={color}
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

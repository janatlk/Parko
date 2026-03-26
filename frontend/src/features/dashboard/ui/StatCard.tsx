import type { ReactNode } from 'react'

import { Box, Group, RingProgress, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import type { MantineColor } from '@mantine/core'

import { TrendIndicator } from './TrendIndicator'

type StatCardProps = {
  icon: ReactNode
  label: string
  value: string | number
  color?: MantineColor
  currentValue?: number
  previousValue?: number
  inverseTrend?: boolean
  ringValue?: number
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
  ringValue,
  compact = false,
}: StatCardProps) {
  return (
    <Box
      style={{
        backgroundColor: 'var(--mantine-color-body)',
        borderRadius: 'var(--mantine-radius-md)',
        padding: compact ? 'var(--mantine-spacing-sm)' : 'var(--mantine-spacing-md)',
        border: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group justify="space-between" align="flex-start" gap="xl">
        <Stack gap={compact ? 2 : 'xs'}>
          <Text size={compact ? 'xs' : undefined} c="dimmed" fw={500}>
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
        {ringValue !== undefined ? (
          <RingProgress
            size={compact ? 50 : 60}
            thickness={6}
            roundCaps
            sections={[{ value: ringValue, color }]}
            label={
              <ThemeIcon size={compact ? 28 : 34} variant="light" color={color}>
                {icon}
              </ThemeIcon>
            }
          />
        ) : (
          <ThemeIcon size={compact ? 36 : 44} variant="light" color={color}>
            {icon}
          </ThemeIcon>
        )}
      </Group>
    </Box>
  )
}

type StatsGridProps = {
  stats: Array<{
    icon: ReactNode
    label: string
    value: string | number
    color?: MantineColor
    currentValue?: number
    previousValue?: number
    inverseTrend?: boolean
    ringValue?: number
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

import type { ReactNode } from 'react'

import { Box, Group, RingProgress, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import type { MantineColor } from '@mantine/core'

type StatCardProps = {
  icon: ReactNode
  label: string
  value: string | number
  color?: MantineColor
  trend?: {
    value: number
    label: string
  }
  ringValue?: number
}

export function StatCard({ icon, label, value, color = 'blue', trend, ringValue }: StatCardProps) {
  return (
    <Box
      style={{
        backgroundColor: 'var(--mantine-color-body)',
        borderRadius: 'var(--mantine-radius-md)',
        padding: 'var(--mantine-spacing-md)',
        border: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group justify="space-between" align="flex-start" gap="xl">
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={500}>
            {label}
          </Text>
          <Text size="xl" fw={700}>
            {value}
          </Text>
          {trend && (
            <Text size="xs" c={trend.value >= 0 ? 'teal' : 'red'}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </Text>
          )}
        </Stack>
        {ringValue !== undefined ? (
          <RingProgress
            size={60}
            thickness={6}
            roundCaps
            sections={[{ value: ringValue, color }]}
            label={
              <ThemeIcon size={34} variant="light" color={color}>
                {icon}
              </ThemeIcon>
            }
          />
        ) : (
          <ThemeIcon size={44} variant="light" color={color}>
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
    trend?: { value: number; label: string }
    ringValue?: number
  }>
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 4 }}
      spacing="md"
    >
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </SimpleGrid>
  )
}

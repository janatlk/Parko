import { Group, Text } from '@mantine/core'
import { IconArrowDown, IconArrowUp, IconMinus } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

type TrendIndicatorProps = {
  currentValue: number
  previousValue: number
  inverseGood?: boolean // For metrics where higher is worse (e.g., costs)
}

export function TrendIndicator({ currentValue, previousValue, inverseGood = false }: TrendIndicatorProps) {
  const { t } = useTranslation()

  // Handle edge cases
  if (previousValue === 0 && currentValue === 0) {
    return (
      <Group gap="xs" c="dimmed">
        <IconMinus size={16} />
        <Text size="xs">{t('dashboard.no_change')}</Text>
      </Group>
    )
  }

  if (previousValue === 0) {
    return (
      <Group gap="xs" c="green">
        <IconArrowUp size={16} />
        <Text size="xs" fw={500}>{t('dashboard.new')}</Text>
      </Group>
    )
  }

  const change = currentValue - previousValue
  const percentChange = ((change / previousValue) * 100).toFixed(1)
  const isIncrease = change > 0
  const isDecrease = change < 0

  // Determine if the change is "good" or "bad"
  let isGood: boolean
  if (inverseGood) {
    // For costs: decrease is good, increase is bad
    isGood = isDecrease
  } else {
    // For positive metrics: increase is good, decrease is bad
    isGood = isIncrease
  }

  const color = isGood ? 'green' : isIncrease ? 'red' : 'dimmed'
  const Icon = isIncrease ? IconArrowUp : isDecrease ? IconArrowDown : IconMinus

  return (
    <Group gap="xs" c={color}>
      <Icon size={16} />
      <Text size="xs" fw={500}>
        {isIncrease ? '+' : ''}{percentChange}%
      </Text>
    </Group>
  )
}

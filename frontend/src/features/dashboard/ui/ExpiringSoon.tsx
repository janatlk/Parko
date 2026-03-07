import {
  Alert,
  Badge,
  Box,
  Group,
  Progress,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCalendar, IconCar, IconShield, IconShieldCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ExpiringItem } from '../api/dashboardApi'

type ExpiringSoonProps = {
  items?: ExpiringItem[]
  isLoading?: boolean
}

export function ExpiringSoon({ items = [], isLoading }: ExpiringSoonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'red'
    if (days < 7) return 'red'
    if (days < 30) return 'orange'
    return 'yellow'
  }

  const getExpiryStatus = (days: number) => {
    if (days < 0) return t('dashboard.expired')
    if (days < 7) return t('dashboard.critical')
    if (days < 30) return t('dashboard.warning')
    return t('dashboard.soon')
  }

  const handleNavigate = (carId: number, type: string) => {
    navigate(`/cars/${carId}`, { state: { tab: type } })
  }

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Box>
    )
  }

  if (items.length === 0) {
    return (
      <Alert icon={<IconShieldCheck size={20} />} color="teal" title={t('dashboard.all_good')}>
        {t('dashboard.no_expiring_items')}
      </Alert>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('dashboard.expiring_soon')}</Title>
        <Badge color="red" variant="light">
          {items.length} {t('dashboard.items')}
        </Badge>
      </Group>
      <ScrollArea h={350}>
        <Stack gap="md">
          {items.map((item) => {
            const isExpired = item.days_until_expiry < 0
            const color = getExpiryColor(item.days_until_expiry)
            const status = getExpiryStatus(item.days_until_expiry)
            const progressValue = Math.max(0, Math.min(100, (item.days_until_expiry / 30) * 100))

            return (
              <Box
                key={`${item.type}-${item.id}`}
                onClick={() => handleNavigate(item.car_id, item.type)}
                style={{
                  cursor: 'pointer',
                  padding: 'var(--mantine-spacing-sm)',
                  borderRadius: 'var(--mantine-radius-md)',
                  border: '1px solid var(--mantine-color-default-border)',
                  backgroundColor: isExpired
                    ? 'var(--mantine-color-red-light)'
                    : `var(--mantine-color-${color}-light)`,
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <ThemeIcon variant="white" size="sm" color={color}>
                      {item.type === 'insurance' ? <IconShield size={16} /> : <IconCalendar size={16} />}
                    </ThemeIcon>
                    <Text fw={600} size="sm">
                      {item.type === 'insurance' ? t('insurances.title') : t('inspections.title')}
                    </Text>
                  </Group>
                  <Badge color={color} variant="filled" size="sm">
                    {status}
                  </Badge>
                </Group>
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <IconCar size={16} stroke={1.5} />
                    <Text size="sm">{item.car_numplate}</Text>
                  </Group>
                  <Text size="sm" fw={600} c={color}>
                    {item.days_until_expiry < 0
                      ? Math.abs(item.days_until_expiry)
                      : item.days_until_expiry}{' '}
                    {t('dashboard.days')}
                  </Text>
                </Group>
                <Progress value={progressValue} color={color} size="sm" />
              </Box>
            )
          })}
        </Stack>
      </ScrollArea>
    </Box>
  )
}

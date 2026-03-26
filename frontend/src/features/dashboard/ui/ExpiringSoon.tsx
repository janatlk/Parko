import { useState } from 'react'

import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Progress,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCalendar, IconCar, IconChevronDown, IconChevronUp, IconShield, IconShieldCheck, IconExternalLink } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ExpiringItemsResponse } from '../api/dashboardApi'

type ExpiringSoonProps = {
  data?: ExpiringItemsResponse
  isLoading?: boolean
  compact?: boolean
}

export function ExpiringSoon({ data, isLoading, compact = false }: ExpiringSoonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const items = data?.items || []
  const totalRenewalCost = data?.total_renewal_cost || 0
  const displayItems = expanded ? items : items.slice(0, compact ? 2 : 3)

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

  const handleRenewInsurance = () => {
    navigate('/cars', { state: { filter: 'insurance_expiring' } })
  }

  if (isLoading) {
    return (
      <Box p={compact ? 'sm' : 'xl'} ta="center">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Box>
    )
  }

  if (items.length === 0) {
    return (
      <Alert icon={<IconShieldCheck size={20} />} color="teal" title={t('dashboard.all_good')} p={compact ? 'sm' : undefined}>
        {t('dashboard.no_expiring_items')}
      </Alert>
    )
  }

  const criticalCount = items.filter(i => i.days_until_expiry < 7).length
  const warningCount = items.filter(i => i.days_until_expiry >= 7 && i.days_until_expiry < 30).length

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={compact ? 5 : 4}>{t('dashboard.expiring_soon')}</Title>
        <Badge color={criticalCount > 0 ? 'red' : 'orange'} variant="light" size={compact ? 'sm' : undefined}>
          {items.length} {t('dashboard.items')}
        </Badge>
      </Group>

      {/* Summary stats */}
      <Group gap={compact ? 'xs' : 'sm'} mb="md">
        {criticalCount > 0 && (
          <Badge color="red" variant="light" size={compact ? 'sm' : undefined}>
            {criticalCount} {t('dashboard.critical')}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge color="orange" variant="light" size={compact ? 'sm' : undefined}>
            {warningCount} {t('dashboard.warning')}
          </Badge>
        )}
        <Badge color="blue" variant="light" size={compact ? 'sm' : undefined}>
          {totalRenewalCost.toLocaleString('ru-RU')} с.
        </Badge>
      </Group>

      {/* Quick actions */}
      {!compact && (
        <Group gap="xs" mb="md">
          <Button
            variant="outline"
            size="compact-xs"
            onClick={handleRenewInsurance}
            leftSection={<IconExternalLink size={14} />}
          >
            {t('dashboard.renew_insurance')}
          </Button>
        </Group>
      )}

      <ScrollArea h={compact ? 200 : 350} offsetScrollbars>
        <Stack gap="md">
          {displayItems.map((item) => {
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
                  transition: 'background-color 0.15s ease',
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
                {item.cost && (
                  <Text size="xs" c="dimmed" mt="xs">
                    {t('dashboard.last_cost')}: {item.cost.toLocaleString('ru-RU')} с.
                  </Text>
                )}
              </Box>
            )
          })}
        </Stack>
      </ScrollArea>

      {items.length > 3 && (
        <Button
          variant="subtle"
          size="compact-sm"
          fullWidth
          mt="sm"
          onClick={() => setExpanded(!expanded)}
          rightSection={expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        >
          {expanded ? t('common.show_less') : t('common.show_more')}
        </Button>
      )}
    </Box>
  )
}

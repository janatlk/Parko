import { Alert, Badge, Box, Group, Table, Text, useMantineColorScheme } from '@mantine/core'
import { IconShieldCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ExpiringItemsResponse } from '../api/dashboardApi'

type ExpiringTableProps = {
  data?: ExpiringItemsResponse
}

export function ExpiringTable({ data }: ExpiringTableProps) {
  const { t } = useTranslation()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const navigate = useNavigate()
  const items = data?.items || []

  const getStatusColor = (days: number) => {
    if (days < 0) return 'red'
    if (days < 7) return 'red'
    if (days < 30) return 'orange'
    return undefined // neutral
  }

  const getUrgencyLabel = (days: number) => {
    if (days < 0) return t('dashboard.expired')
    if (days < 7) return t('dashboard.critical')
    if (days < 30) return t('dashboard.warning')
    return t('dashboard.soon')
  }

  const handleNavigate = (carId: number) => {
    navigate(`/cars/${carId}`)
  }

  if (items.length === 0) {
    return (
      <Alert icon={<IconShieldCheck size={18} />} color="teal" title={t('dashboard.all_good')} p="sm">
        {t('dashboard.no_expiring_items')}
      </Alert>
    )
  }

  const borderColor = isDark ? '#2C2E33' : '#e9ecef'
  const headerColor = isDark ? '#868e96' : '#868e96'

  return (
    <Box>
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="sm">{t('dashboard.expiring_soon')}</Text>
        <Badge color="red" variant="light" size="sm">
          {items.length}
        </Badge>
      </Group>
      <Table highlightOnHover verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ color: headerColor, borderColor, fontSize: 11, padding: '6px 8px' }}>{t('dashboard.vehicle')}</Table.Th>
            <Table.Th style={{ color: headerColor, borderColor, fontSize: 11, padding: '6px 8px' }}>{t('dashboard.type')}</Table.Th>
            <Table.Th style={{ color: headerColor, borderColor, fontSize: 11, padding: '6px 8px' }}>{t('dashboard.days_left')}</Table.Th>
            <Table.Th style={{ color: headerColor, borderColor, fontSize: 11, padding: '6px 8px' }}>{t('dashboard.cost')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => {
            const statusColor = getStatusColor(item.days_until_expiry)
            return (
              <Table.Tr
                key={`${item.type}-${item.id}`}
                onClick={() => handleNavigate(item.car_id)}
                style={{ cursor: 'pointer' }}
              >
                <Table.Td style={{ borderColor, padding: '6px 8px' }}>
                  <Text size="sm" fw={500}>{item.car_numplate}</Text>
                </Table.Td>
                <Table.Td style={{ borderColor, padding: '6px 8px' }}>
                  <Text size="xs" c="dimmed">
                    {item.type === 'insurance' ? t('insurances.title') : t('inspections.title')}
                  </Text>
                </Table.Td>
                <Table.Td style={{ borderColor, padding: '6px 8px' }}>
                  <Group gap={4}>
                    {statusColor ? (
                      <Badge size="sm" color={statusColor} variant="filled">
                        {getUrgencyLabel(item.days_until_expiry)}
                      </Badge>
                    ) : (
                      <Text size="xs" c="dimmed">{getUrgencyLabel(item.days_until_expiry)}</Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {item.days_until_expiry < 0
                        ? `${Math.abs(item.days_until_expiry)} ${t('dashboard.days_ago')}`
                        : `${item.days_until_expiry} ${t('dashboard.days')}`}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td style={{ borderColor, padding: '6px 8px' }}>
                  <Text size="sm" fw={500}>
                    {item.cost?.toLocaleString('ru-RU')} с.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Box>
  )
}

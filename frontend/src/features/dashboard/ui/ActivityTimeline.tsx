import { Box, Group, Stack, Text, useMantineColorScheme } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ActivityFeedItem } from '../api/dashboardApi'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

type ActivityTimelineProps = {
  items?: ActivityFeedItem[]
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ActivityTimeline({ items = [] }: ActivityTimelineProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const currency = user?.currency || 'KGS'
  const navigate = useNavigate()

  const handleNavigate = (carId: number) => {
    navigate(`/cars/${carId}`)
  }

  if (items.length === 0) {
    return (
      <Box py="sm">
        <Text c="dimmed" size="sm">{t('dashboard.no_recent_activity')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text fw={600} size="sm" mb="xs">{t('dashboard.recent_activity')}</Text>
      <Stack gap="xs">
        {items.map((item) => (
          <Group
            key={`${item.type}-${item.id}`}
            gap="xs"
            align="flex-start"
            onClick={() => handleNavigate(item.car_id)}
            style={{ cursor: 'pointer' }}
          >
            <Box
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#868e96' : '#868e96',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <IconCheck size={12} />
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} lineClamp={1} style={{ color: isDark ? '#e9ecef' : '#212529' }}>
                {item.title}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {item.car_numplate} • {formatRelativeDate(item.date)}
              </Text>
              {item.cost > 0 && (
                <Text size="xs" c="dimmed">
                  {formatPrice(item.cost, currency)}
                </Text>
              )}
            </Box>
          </Group>
        ))}
      </Stack>
    </Box>
  )
}

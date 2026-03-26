import { Box, Group, ScrollArea, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconCar,
  IconFlame,
  IconTools,
  IconPlus,
  IconEdit,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ActivityFeedItem } from '../api/dashboardApi'

type ActivityFeedProps = {
  items?: ActivityFeedItem[]
  isLoading?: boolean
  compact?: boolean
}

function getActivityIcon(type: ActivityFeedItem['type']) {
  switch (type) {
    case 'fuel':
      return <IconFlame size={18} />
    case 'maintenance':
      return <IconTools size={18} />
    case 'car_added':
      return <IconPlus size={18} />
    case 'car_edited':
      return <IconEdit size={18} />
    default:
      return <IconCar size={18} />
  }
}

function getActivityColor(type: ActivityFeedItem['type']) {
  switch (type) {
    case 'fuel':
      return 'blue'
    case 'maintenance':
      return 'orange'
    case 'car_added':
      return 'teal'
    case 'car_edited':
      return 'violet'
    default:
      return 'gray'
  }
}

function getActivityType(type: ActivityFeedItem['type'], t: (key: string) => string) {
  switch (type) {
    case 'fuel':
      return t('dashboard.activity_fuel')
    case 'maintenance':
      return t('dashboard.activity_maintenance')
    case 'car_added':
      return t('dashboard.activity_car_added')
    case 'car_edited':
      return t('dashboard.activity_car_edited')
    default:
      return t('dashboard.activity_fuel')
  }
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

export function ActivityFeed({ items = [], isLoading, compact = false }: ActivityFeedProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleNavigate = (carId: number) => {
    navigate(`/cars/${carId}`)
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
      <Box p={compact ? 'sm' : 'xl'} ta="center">
        <Text c="dimmed">{t('dashboard.no_recent_activity')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={compact ? 5 : 4}>{t('dashboard.recent_activity')}</Title>
      </Group>
      <ScrollArea h={compact ? 240 : 350} offsetScrollbars>
        <Stack gap="md">
          {items.map((item) => (
            <Group
              key={`${item.type}-${item.id}`}
              gap="md"
              align="flex-start"
              onClick={() => handleNavigate(item.car_id)}
              style={{
                cursor: 'pointer',
                padding: 'var(--mantine-spacing-sm)',
                borderRadius: 'var(--mantine-radius-md)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <ThemeIcon
                variant="light"
                color={getActivityColor(item.type)}
                size="md"
                radius="md"
              >
                {getActivityIcon(item.type)}
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {getActivityType(item.type, t)}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {item.description}
                </Text>
                <Group gap="xs" mt={2}>
                  <Text size="xs" c="dimmed">{item.car_numplate}</Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="dimmed">{formatRelativeDate(item.date)}</Text>
                  {item.cost > 0 && (
                    <>
                      <Text size="xs" c="dimmed">•</Text>
                      <Text size="xs" c="dimmed" fw={500}>
                        {item.cost.toLocaleString('ru-RU')} с.
                      </Text>
                    </>
                  )}
                </Group>
              </Stack>
            </Group>
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  )
}

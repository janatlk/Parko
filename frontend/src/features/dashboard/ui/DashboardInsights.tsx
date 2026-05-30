import { useState } from 'react'
import { Alert, Box, Button, Group, Paper, Skeleton, Stack, Text, useMantineColorScheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconBulb, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useDashboardInsights } from '../hooks/useDashboard'

export function DashboardInsights() {
  const { t } = useTranslation()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading, error } = useDashboardInsights()

  if (isLoading) {
    return (
      <Paper withBorder p={isMobile ? 'xs' : 'sm'} radius="md">
        <Skeleton height={18} width={160} mb="xs" />
        <Skeleton height={14} mb={6} />
        <Skeleton height={14} />
      </Paper>
    )
  }

  if (error) {
    return (
      <Alert color="yellow" variant="light" radius="md" p={isMobile ? 'xs' : 'sm'}>
        <Text size="xs">{t('dashboard.insights_error', 'Не удалось загрузить AI-инсайты')}</Text>
      </Alert>
    )
  }

  const insights = data?.insights || []
  const visibleCount = isMobile && !expanded ? 2 : insights.length
  const visible = insights.slice(0, visibleCount)
  const hasMore = insights.length > visibleCount

  return (
    <Paper
      withBorder
      p={isMobile ? 'xs' : 'sm'}
      radius="md"
      bg={isDark ? 'dark.7' : 'blue.0'}
      style={{ borderColor: isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-blue-2)' }}
    >
      <Group gap="xs" mb={isMobile ? 4 : 6}>
        <IconBulb size={isMobile ? 14 : 16} color={isDark ? '#74c0fc' : '#1c7ed6'} />
        <Text fw={600} size={isMobile ? 'xs' : 'sm'} c={isDark ? 'blue.3' : 'blue.7'}>
          {t('dashboard.ai_insights', 'AI-инсайты')}
        </Text>
      </Group>

      <Stack gap={isMobile ? 2 : 4}>
        {visible.map((insight, index) => (
          <Box key={index} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <Text size="xs" c={isDark ? 'blue.4' : 'blue.5'} fw={700} style={{ minWidth: 14, lineHeight: 1.5 }}>
              {index + 1}.
            </Text>
            <Text size={isMobile ? 'xs' : 'sm'} style={{ lineHeight: 1.4 }}>
              {insight}
            </Text>
          </Box>
        ))}
      </Stack>

      {hasMore && (
        <Button
          variant="subtle"
          size="compact-xs"
          mt={4}
          onClick={() => setExpanded((e) => !e)}
          leftSection={expanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
          c={isDark ? 'blue.3' : 'blue.7'}
        >
          {expanded
            ? t('common.collapse', 'Свернуть')
            : t('common.show_more', 'Ещё {{count}}', { count: insights.length - visibleCount })}
        </Button>
      )}
    </Paper>
  )
}

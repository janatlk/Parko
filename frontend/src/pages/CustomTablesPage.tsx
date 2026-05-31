import {
  Alert,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconPlus, IconTable } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useCustomTables } from '@features/custom_tables/hooks/useCustomTables'

export function CustomTablesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: tables, isLoading, error } = useCustomTables()

  if (isLoading) {
    return (
      <Container size="fluid" px="sm" py="sm">
        <Skeleton height={32} width={200} mb="sm" />
        <Grid gutter="sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton height={120} radius="md" />
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="fluid" px="sm" py="sm">
        <Alert color="red" icon={<IconAlertTriangle size={18} />}>
          {t('common.error_loading')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="fluid" px="sm" py="sm">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={3}>{t('custom_tables.title', 'Таблицы')}</Title>
          <Button size="xs" leftSection={<IconPlus size={16} />} onClick={() => navigate('/custom-tables/new')}>
            {t('common.create', 'Создать')}
          </Button>
        </Group>

        <Grid gutter="sm">
          {tables?.map((table) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={table.id}>
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/custom-tables/${table.id}`)}
              >
                <Group gap="xs" mb={4}>
                  <IconTable size={18} />
                  <Text fw={600} size="sm">
                    {table.name}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {table.description || t('custom_tables.no_description', 'Нет описания')}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {t('custom_tables.records_count', 'Записей: {{count}}', { count: table.record_count })}
                </Text>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>

        {!tables?.length && (
          <Paper withBorder p="xl" radius="md" ta="center">
            <Text c="dimmed">{t('custom_tables.empty', 'Нет таблиц. Создайте первую!')}</Text>
          </Paper>
        )}
      </Stack>
    </Container>
  )
}

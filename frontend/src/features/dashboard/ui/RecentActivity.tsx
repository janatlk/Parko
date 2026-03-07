import {
  ActionIcon,
  Badge,
  Box,
  Group,
  ScrollArea,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCar, IconChevronRight, IconFlame } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { RecentFuelEntry } from '../api/dashboardApi'

type RecentActivityProps = {
  fuelEntries?: RecentFuelEntry[]
  isLoading?: boolean
}

export function RecentActivity({ fuelEntries = [], isLoading }: RecentActivityProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleNavigate = (carId: number) => {
    navigate(`/cars/${carId}`)
  }

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('dashboard.recent_activity')}</Title>
      </Group>
      <ScrollArea h={300}>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('dashboard.type')}</Table.Th>
              <Table.Th>{t('dashboard.car')}</Table.Th>
              <Table.Th>{t('dashboard.period')}</Table.Th>
              <Table.Th ta="right">{t('fuel.table.total_cost')}</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fuelEntries.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} ta="center">
                  <Text c="dimmed" size="sm">
                    {t('dashboard.no_recent_activity')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              fuelEntries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <ThemeIcon variant="light" size="sm" color="blue">
                        <IconFlame size={16} />
                      </ThemeIcon>
                      <Text size="sm" fw={500}>
                        {t('fuel.title')}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <IconCar size={16} stroke={1.5} />
                      <Text size="sm">{entry.car_numplate}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light">
                      {entry.month_name} {entry.year}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={500}>
                      {entry.total_cost.toLocaleString('ru-RU')} с.
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      color="gray"
                      onClick={() => handleNavigate(entry.car_id)}
                    >
                      <IconChevronRight size={18} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  )
}

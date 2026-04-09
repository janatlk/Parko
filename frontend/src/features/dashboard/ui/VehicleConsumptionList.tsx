import { useState } from 'react'

import {
  Badge,
  Box,
  Group,
  NumberInput,
  ScrollArea,
  Table,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { IconGasStation, IconTarget } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { VehicleConsumption } from '../api/dashboardApi'

const STORAGE_KEY = 'parko_consumption_goal'

type VehicleConsumptionListProps = {
  items?: VehicleConsumption[]
  isLoading?: boolean
  compact?: boolean
}

export function VehicleConsumptionList({ items = [], isLoading, compact = false }: VehicleConsumptionListProps) {
  const { t } = useTranslation()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const navigate = useNavigate()
  const [consumptionGoal, setConsumptionGoal] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseFloat(stored) : 15
  })

  const handleNavigate = (carId: number) => {
    navigate(`/cars/${carId}`)
  }

  const handleGoalChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(numValue)) {
      setConsumptionGoal(numValue)
      localStorage.setItem(STORAGE_KEY, numValue.toString())
    }
  }

  const getConsumptionColor = (consumption: number) => {
    if (consumption <= consumptionGoal) return 'green'
    return 'red'
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
        <Text c="dimmed">{t('dashboard.no_fuel_data')}</Text>
      </Box>
    )
  }

  const borderColor = isDark ? '#373A40' : '#dee2e6'
  const headerColor = isDark ? '#868e96' : '#495057'
  const textColor = isDark ? '#e9ecef' : 'inherit'

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={compact ? 5 : 4}>{t('dashboard.vehicle_consumption')}</Title>
        <Badge color="blue" variant="light" size={compact ? 'sm' : undefined}>
          {items.length} {t('dashboard.vehicles')}
        </Badge>
      </Group>

      {/* Consumption Goal Input */}
      <Group gap="sm" mb="md" align="flex-end">
        <Box>
          <Text size="xs" c="dimmed" mb={4}>{t('dashboard.consumption_goal')}</Text>
          <NumberInput
            placeholder="15"
            value={consumptionGoal}
            onChange={handleGoalChange}
            min={0}
            max={50}
            step={0.1}
            size="xs"
            style={{ width: 120 }}
            rightSection={<Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>л/100км</Text>}
            leftSection={<IconTarget size={14} />}
          />
        </Box>
        {!compact && (
          <Box style={{ maxWidth: 180, paddingBottom: 4 }}>
            <Text size="xs" c="dimmed">{t('dashboard.consumption_goal_desc')}</Text>
          </Box>
        )}
      </Group>

      <ScrollArea h={compact ? 200 : 300} offsetScrollbars>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ color: headerColor, borderColor }}>{t('dashboard.vehicle')}</Table.Th>
              <Table.Th ta="right" style={{ color: headerColor, borderColor }}>{t('dashboard.avg_consumption')}</Table.Th>
              <Table.Th ta="right" style={{ color: headerColor, borderColor }}>{t('dashboard.total_fuel')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((vehicle) => {
              const isUnderGoal = vehicle.avg_consumption <= consumptionGoal
              const color = getConsumptionColor(vehicle.avg_consumption)

              return (
                <Table.Tr
                  key={vehicle.id}
                  onClick={() => handleNavigate(vehicle.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td style={{ borderColor }}>
                    <Group gap="xs">
                      <ThemeIcon variant="light" size="sm" color="blue">
                        <IconGasStation size={16} />
                      </ThemeIcon>
                      <div>
                        <Text size="sm" fw={500} style={{ color: textColor }}>{vehicle.numplate}</Text>
                        <Text size="xs" c="dimmed">{vehicle.brand} {vehicle.title}</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right" style={{ borderColor }}>
                    <Group gap="xs" justify="flex-end">
                      <Badge
                        size="sm"
                        color={color}
                        variant={isUnderGoal ? 'light' : 'filled'}
                      >
                        {vehicle.avg_consumption.toFixed(1)} л/100км
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right" style={{ borderColor }}>
                    <Text size="sm" c="dimmed">
                      {vehicle.total_fuel_liters.toFixed(0)}л
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  )
}

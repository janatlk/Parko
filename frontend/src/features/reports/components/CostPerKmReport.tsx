import { useTranslation } from 'react-i18next'
import { Box, Group, Paper, SimpleGrid, Stack, Table, Text, Title, Button, Loader } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'

import type { CostPerKmReportResponse } from '@features/reports/api/reportsApi'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

type CostPerKmReportProps = {
  data: CostPerKmReportResponse
  onExport?: (format: 'csv' | 'xlsx') => void
}

export function CostPerKmReport({ data, onExport }: CostPerKmReportProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  if (!data) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
      </Box>
    )
  }

  const { summary, by_vehicle } = data

  return (
    <Stack gap="md">
      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <SummaryCard
          label={t('reports.cost_per_km.total_cost')}
          value={formatPrice(summary.total_cost, currency)}
        />
        <SummaryCard
          label={t('reports.cost_per_km.total_distance')}
          value={`${summary.total_distance.toLocaleString()} km`}
        />
        <SummaryCard
          label={t('reports.cost_per_km.avg_cost_per_km')}
          value={formatPrice(summary.avg_cost_per_km, currency)}
        />
        <SummaryCard
          label={t('reports.cost_per_km.vehicle_count')}
          value={summary.vehicle_count.toString()}
        />
      </SimpleGrid>

      {/* Vehicle Table */}
      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>{t('reports.cost_per_km.vehicle_breakdown')}</Title>
          {onExport && (
            <Group gap="xs">
              <Button
                variant="outline"
                size="xs"
                leftSection={<IconDownload size={14} />}
                onClick={() => onExport('xlsx')}
              >
                XLSX
              </Button>
              <Button
                variant="outline"
                size="xs"
                leftSection={<IconDownload size={14} />}
                onClick={() => onExport('csv')}
              >
                CSV
              </Button>
            </Group>
          )}
        </Group>

        {by_vehicle.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {t('common.no_data')}
          </Text>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('reports.cost_per_km.vehicle')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.fuel_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.maintenance_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.insurance_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.inspection_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.total_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.total_distance')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.cost_per_km')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {by_vehicle.map((vehicle) => (
                <Table.Tr key={vehicle.vehicle_id}>
                  <Table.Td fw={500}>
                    {vehicle.brand} {vehicle.model} ({vehicle.numplate})
                  </Table.Td>
                  <Table.Td>{formatPrice(vehicle.fuel_cost, currency)}</Table.Td>
                  <Table.Td>{formatPrice(vehicle.maintenance_cost, currency)}</Table.Td>
                  <Table.Td>{formatPrice(vehicle.insurance_cost, currency)}</Table.Td>
                  <Table.Td>{formatPrice(vehicle.inspection_cost, currency)}</Table.Td>
                  <Table.Td fw={600}>{formatPrice(vehicle.total_cost, currency)}</Table.Td>
                  <Table.Td>{vehicle.total_distance.toLocaleString()} km</Table.Td>
                  <Table.Td fw={700}>{formatPrice(vehicle.cost_per_km, currency)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="sm" c="dimmed" mb="xs">
        {label}
      </Text>
      <Text size="xl" fw={700}>
        {value}
      </Text>
    </Paper>
  )
}

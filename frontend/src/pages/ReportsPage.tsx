import { useMemo, useState } from 'react'

import { Container, Group, Select, Table, Text, TextInput, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useMaintenanceCostsReportQuery } from '@features/reports/hooks/useReports'
import { canViewReports } from '@shared/lib/permissions'

export function ReportsPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const canView = canViewReports(currentUser)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)

  const [reportType, setReportType] = useState<string>('maintenance-costs')
  const [carFilter, setCarFilter] = useState<string | null>(null)

  const carId = carFilter ? Number(carFilter) : undefined

  const { data: carsData } = useCarsQuery({ page: 1 })
  const carOptions = useMemo(
    () =>
      (carsData?.results ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.numplate} (${c.brand})`,
      })),
    [carsData],
  )

  const { data, isLoading, isError } = useMaintenanceCostsReportQuery({
    from,
    to,
    car: reportType === 'maintenance-costs' ? carId : undefined,
  })

  return (
    <Container>
      <Title order={2} mb="xs">
        {t('reports.title')}
      </Title>

      {!canView && <Text c="dimmed">{t('reports.not_available_for_role')}</Text>}

      {canView && (
        <>
          <Group align="flex-end" mb="md">
            <Select
              label={t('reports.type')}
              data={[
                { value: 'maintenance-costs', label: t('reports.maintenance_costs') },
                { value: 'fuel-consumption', label: t('reports.fuel_consumption') },
                { value: 'insurance-inspection', label: t('reports.insurance_inspection') },
              ]}
              value={reportType}
              onChange={(value) => value && setReportType(value)}
              w={260}
            />
            <TextInput
              label={t('reports.from')}
              placeholder="YYYY-MM-DD"
              value={from}
              onChange={(e) => setFrom(e.currentTarget.value)}
              w={180}
            />
            <TextInput
              label={t('reports.to')}
              placeholder="YYYY-MM-DD"
              value={to}
              onChange={(e) => setTo(e.currentTarget.value)}
              w={180}
            />
            <Select
              label={t('reports.car')}
              placeholder="All"
              data={carOptions}
              value={carFilter}
              onChange={setCarFilter}
              clearable
              searchable
              w={260}
              disabled={reportType !== 'maintenance-costs'}
            />
          </Group>

          {reportType !== 'maintenance-costs' && <Text c="dimmed">{t('reports.not_implemented')}</Text>}

          {reportType === 'maintenance-costs' && isLoading && <Text c="dimmed">{t('common.loading')}</Text>}
          {reportType === 'maintenance-costs' && isError && <Text c="red">Failed to load report</Text>}

          {reportType === 'maintenance-costs' && !isLoading && !isError && data && (
            <>
              <Group justify="space-between" align="center" mb="sm">
                <Text size="sm" c="dimmed">
                  Parts: {data.totals.part_total}
                </Text>
                <Text size="sm" c="dimmed">
                  Jobs: {data.totals.job_total}
                </Text>
                <Text size="sm" fw={600}>
                  Total: {data.totals.total}
                </Text>
              </Group>

              <Table withTableBorder withColumnBorders striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Car</Table.Th>
                    <Table.Th>Parts</Table.Th>
                    <Table.Th>Jobs</Table.Th>
                    <Table.Th>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.by_car.map((row) => (
                    <Table.Tr key={row.car_id}>
                      <Table.Td>{row.car__numplate}</Table.Td>
                      <Table.Td>{row.part_total}</Table.Td>
                      <Table.Td>{row.job_total}</Table.Td>
                      <Table.Td>{row.total}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>
          )}
        </>
      )}
    </Container>
  )
}

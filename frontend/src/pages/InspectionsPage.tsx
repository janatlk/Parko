import { useMemo, useState } from 'react'

import { Button, Container, Group, Pagination, Select, Table, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateInspectionMutation, useInspectionsQuery } from '@features/inspections/hooks/useInspections'
import { InspectionFormModal } from '@features/inspections/ui/InspectionFormModal'

export function InspectionsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [carFilter, setCarFilter] = useState<string | null>(null)

  const { data: carsData } = useCarsQuery({ page: 1 })
  const carOptions = useMemo(
    () =>
      (carsData?.results ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.numplate} (${c.brand})`,
      })),
    [carsData],
  )

  const carId = carFilter ? Number(carFilter) : undefined

  const { data, isLoading, isError } = useInspectionsQuery({ page, car: carId })

  const createMutation = useCreateInspectionMutation()
  const [modalOpened, setModalOpened] = useState(false)

  const records = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs">
        <Title order={2}>{t('inspections.title')}</Title>
        <Button onClick={() => setModalOpened(true)}>{t('inspections.add')}</Button>
      </Group>

      <Group align="flex-end" mb="md">
        <Select
          label="Car"
          placeholder="All"
          data={carOptions}
          value={carFilter}
          onChange={setCarFilter}
          clearable
          searchable
          w={260}
        />
      </Group>

      {isLoading && <Text c="dimmed">{t('common.loading')}</Text>}
      {isError && <Text c="red">{t('common.error_loading')}</Text>}

      {!isLoading && !isError && (
        <>
          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('inspections.table.car')}</Table.Th>
                <Table.Th>{t('inspections.table.number')}</Table.Th>
                <Table.Th>{t('inspections.table.date')}</Table.Th>
                <Table.Th>{t('inspections.table.cost')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.car_numplate ?? r.car}</Table.Td>
                  <Table.Td>{r.number}</Table.Td>
                  <Table.Td>{r.inspected_at}</Table.Td>
                  <Table.Td>{r.cost}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="space-between" align="center" mt="md">
            <Text size="sm" c="dimmed">
              Total: {data?.count ?? 0}
            </Text>
            <Pagination total={totalPages} value={page} onChange={setPage} />
          </Group>
        </>
      )}

      <InspectionFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        isSubmitting={createMutation.isPending}
        onCreate={async (payload) => {
          await createMutation.mutateAsync(payload)
        }}
      />
    </Container>
  )
}

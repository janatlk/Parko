import { useMemo, useState } from 'react'

import { Button, Container, Group, Pagination, Select, Table, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateFuelMutation, useFuelQuery } from '@features/fuel/hooks/useFuel'
import { FuelFormModal } from '@features/fuel/ui/FuelFormModal'

export function FuelPage() {
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

  const { data, isLoading, isError } = useFuelQuery({
    page,
    car: carId,
  })

  const createMutation = useCreateFuelMutation()

  const [modalOpened, setModalOpened] = useState(false)

  const records = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs">
        <Title order={2}>{t('fuel.title')}</Title>
        <Button onClick={() => setModalOpened(true)}>{t('fuel.add')}</Button>
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

      {isLoading && <Text c="dimmed">Loading...</Text>}
      {isError && <Text c="red">Failed to load fuel records</Text>}

      {!isLoading && !isError && (
        <>
          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Car</Table.Th>
                <Table.Th>Period</Table.Th>
                <Table.Th>Liters</Table.Th>
                <Table.Th>Mileage</Table.Th>
                <Table.Th>Consumption</Table.Th>
                <Table.Th>Total cost</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.car_numplate ?? r.car}</Table.Td>
                  <Table.Td>
                    {r.year}-{String(r.month).padStart(2, '0')}
                  </Table.Td>
                  <Table.Td>{r.liters}</Table.Td>
                  <Table.Td>{r.monthly_mileage}</Table.Td>
                  <Table.Td>{r.consumption}</Table.Td>
                  <Table.Td>{r.total_cost}</Table.Td>
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

      <FuelFormModal
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

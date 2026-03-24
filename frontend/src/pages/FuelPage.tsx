import { useMemo, useState } from 'react'

import { ActionIcon, Button, Container, Group, Pagination, Select, Table, Text, Title } from '@mantine/core'
import { IconEdit } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateFuelMutation, useFuelQuery, useUpdateFuelMutation } from '@features/fuel/hooks/useFuel'
import { FuelFormModal } from '@features/fuel/ui/FuelFormModal'
import type { Fuel } from '@entities/fleet/types'

export function FuelPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [carFilter, setCarFilter] = useState<string | null>(null)

  const { data: carsData } = useCarsQuery({ page: 1 })
  const carOptions = useMemo(
    () =>
      (carsData?.results ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.numplate} - ${c.brand} ${c.title}`,
      })),
    [carsData],
  )

  const carId = carFilter ? Number(carFilter) : undefined

  const { data, isLoading, isError } = useFuelQuery({
    page,
    car: carId,
  })

  const createMutation = useCreateFuelMutation()
  const updateMutation = useUpdateFuelMutation()

  const [modalOpened, setModalOpened] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRecord, setSelectedRecord] = useState<Fuel | undefined>(undefined)

  const openCreate = () => {
    setSelectedRecord(undefined)
    setModalMode('create')
    setModalOpened(true)
  }

  const openEdit = (record: Fuel, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRecord(record)
    setModalMode('edit')
    setModalOpened(true)
  }

  const records = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs">
        <Title order={2}>{t('fuel.title')}</Title>
        <Button onClick={openCreate}>{t('fuel.add')}</Button>
      </Group>

      <Group align="flex-end" mb="md">
        <Select
          label={t('fuel.form.car')}
          placeholder={t('common.all') || 'All'}
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
                <Table.Th>{t('fuel.table.car')}</Table.Th>
                <Table.Th>{t('fuel.table.period')}</Table.Th>
                <Table.Th>{t('fuel.table.liters')}</Table.Th>
                <Table.Th>{t('fuel.table.mileage')}</Table.Th>
                <Table.Th>{t('fuel.table.consumption')}</Table.Th>
                <Table.Th>{t('fuel.table.total_cost')}</Table.Th>
                <Table.Th></Table.Th>
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
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="sm"
                      onClick={(e) => openEdit(r, e)}
                      title={t('common.edit')}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Table.Td>
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
        mode={modalMode}
        record={selectedRecord}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onCreate={async (payload) => {
          await createMutation.mutateAsync(payload)
        }}
        onUpdate={async (fuelId, payload) => {
          await updateMutation.mutateAsync({ fuelId, payload })
        }}
      />
    </Container>
  )
}

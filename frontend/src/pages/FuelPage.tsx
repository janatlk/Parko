import { useMemo, useState } from 'react'

import { ActionIcon, Button, Container, Group, Select, Text, Title } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateFuelMutation, useFuelQuery, useUpdateFuelMutation, useDeleteFuelMutation } from '@features/fuel/hooks/useFuel'
import { FuelFormModal } from '@features/fuel/ui/FuelFormModal'
import type { Fuel } from '@entities/fleet/types'
import { ModernTable, ModernTableRow, TableCell } from '@shared/ui/ModernTable'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

export function FuelPage() {
  const { t } = useTranslation()
  const modals = useModals()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [carFilter, setCarFilter] = useState<string | null>(null)

  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

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
    page_size: pageSize,
    car: carId,
  })

  const createMutation = useCreateFuelMutation()
  const updateMutation = useUpdateFuelMutation()
  const deleteMutation = useDeleteFuelMutation()

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

  const confirmDelete = (record: Fuel, e: React.MouseEvent) => {
    e.stopPropagation()
    modals.openConfirmModal({
      title: t('fuel.delete_confirm.title'),
      children: (
        <Text size="sm">
          {t('fuel.delete_confirm.message', { period: `${record.year}-${String(record.month).padStart(2, '0')}` })}
        </Text>
      ),
      labels: {
        confirm: t('common.delete'),
        cancel: t('common.cancel'),
      },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteMutation.mutateAsync(record.id)
        showNotification({
          title: t('fuel.notifications.deleted.title'),
          message: t('fuel.notifications.deleted.message'),
          color: 'green',
        })
      },
    })
  }

  const records = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

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
          <ModernTable
            columns={[
              { key: 'car', title: t('fuel.table.car'), width: 160 },
              { key: 'period', title: t('fuel.table.period'), width: 120 },
              { key: 'liters', title: t('fuel.table.liters'), width: 100 },
              { key: 'mileage', title: t('fuel.table.mileage'), width: 120 },
              { key: 'consumption', title: t('fuel.table.consumption'), width: 130 },
              { key: 'cost', title: t('fuel.table.total_cost'), width: 120 },
              { key: 'actions', title: '', width: 90 },
            ]}
            data={records}
            renderRow={(r) => (
              <ModernTableRow
                key={r.id}
                cells={[
                  <TableCell key="car" fw={500}>{r.car_numplate ?? r.car}</TableCell>,
                  <TableCell key="period">
                    {r.year}-{String(r.month).padStart(2, '0')}
                  </TableCell>,
                  <TableCell key="liters">{r.liters} L</TableCell>,
                  <TableCell key="mileage">{r.monthly_mileage} km</TableCell>,
                  <TableCell key="consumption">{r.consumption} L/100km</TableCell>,
                  <TableCell key="cost" fw={500}>{formatPrice(r.total_cost, currency)}</TableCell>,
                  <TableCell key="actions" align="right">
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={(e) => openEdit(r, e)}
                        title={t('common.edit')}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={(e) => confirmDelete(r, e)}
                        title={t('common.delete')}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </TableCell>,
                ]}
              />
            )}
            emptyMessage={t('fuel.no_data') || 'No fuel records'}
            total={data?.count}
            page={page}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
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

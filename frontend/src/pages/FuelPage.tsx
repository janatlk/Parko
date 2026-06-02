import { useMemo, useState } from 'react'

import { ActionIcon, Badge, Button, Container, Group, Select, Text, Title } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateFuelMutation, useFuelQuery, useUpdateFuelMutation, useDeleteFuelMutation, useBulkDeleteFuelMutation } from '@features/fuel/hooks/useFuel'
import { FuelFormModal } from '@features/fuel/ui/FuelFormModal'
import type { Fuel } from '@entities/fleet/types'
import { ModernTable, ModernTableRow, TableCell, MobileTableCard } from '@shared/ui/ModernTable'
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
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const bulkDeleteMutation = useBulkDeleteFuelMutation()

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
          {t('fuel.delete_confirm.message', { period: record.date })}
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

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSelectAll = () => {
    const allIds = records.map((r) => r.id)
    const allSelected = allIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIds])))
    }
  }

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) return
    modals.openConfirmModal({
      title: t('fuel.bulk_delete.title') || 'Delete selected records',
      children: (
        <Text size="sm">
          {t('fuel.bulk_delete.message', { count: selectedIds.length }) ||
            `Delete ${selectedIds.length} fuel records? This action cannot be undone.`}
        </Text>
      ),
      labels: {
        confirm: t('common.delete'),
        cancel: t('common.cancel'),
      },
      confirmProps: { color: 'red', loading: bulkDeleteMutation.isPending },
      onConfirm: async () => {
        await bulkDeleteMutation.mutateAsync(selectedIds)
        setSelectedIds([])
        showNotification({
          title: t('fuel.notifications.deleted.title'),
          message: t('fuel.notifications.bulk_deleted.message', { count: selectedIds.length }) ||
            `${selectedIds.length} records deleted`,
          color: 'green',
        })
      },
    })
  }

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs" wrap="wrap" gap="sm">
        <Title order={2} style={{ flex: 1, minWidth: 200 }}>{t('fuel.title')}</Title>
        <Button onClick={openCreate} style={{ width: '100%' }}>{t('fuel.add')}</Button>
      </Group>

      <Group align="flex-end" mb="md" wrap="wrap" gap="sm">
        <Select
          label={t('fuel.form.car')}
          placeholder={t('common.all') || 'All'}
          data={carOptions}
          value={carFilter}
          onChange={setCarFilter}
          clearable
          searchable
          style={{ flex: 1, minWidth: 180 }}
        />
      </Group>

      {isLoading && <Text c="dimmed">{t('common.loading')}</Text>}
      {isError && <Text c="red">{t('common.error_loading')}</Text>}

      {!isLoading && !isError && (
        <>
          {selectedIds.length > 0 && (
            <Group mb="sm" gap="sm" wrap="wrap">
              <Badge size="sm" variant="light" color="blue">
                Selected: {selectedIds.length}
              </Badge>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconTrash size={16} />}
                onClick={confirmBulkDelete}
                loading={bulkDeleteMutation.isPending}
              >
                {t('common.delete_selected') || 'Delete selected'}
              </Button>
              <Button size="xs" variant="subtle" onClick={() => setSelectedIds([])}>
                {t('common.clear_selection') || 'Clear'}
              </Button>
            </Group>
          )}
          <ModernTable
            selectable
            selectedIds={selectedIds}
            
            onSelectAll={handleSelectAll}
            columns={[
              { key: 'car', title: t('fuel.table.car'), width: 160 },
              { key: 'date', title: t('fuel.table.date'), width: 120 },
              { key: 'liters', title: t('fuel.table.liters'), width: 100 },
              { key: 'odometer', title: t('fuel.table.odometer'), width: 120 },
              { key: 'mileage', title: t('fuel.table.mileage'), width: 120 },
              { key: 'consumption', title: t('fuel.table.consumption'), width: 130 },
              { key: 'cost', title: t('fuel.table.total_cost'), width: 120 },
              { key: 'actions', title: '', width: 90 },
            ]}
            data={records}
            renderRow={(r) => (
              <ModernTableRow
                key={r.id}
                selectable
                selected={selectedIds.includes(r.id)}
                onSelect={() => handleSelect(r.id)}
                cells={[
                  <TableCell key="car" fw={500}>{r.car_numplate ?? r.car}</TableCell>,
                  <TableCell key="date">{r.date}</TableCell>,
                  <TableCell key="liters">{r.liters} L</TableCell>,
                  <TableCell key="odometer">{r.odometer} km</TableCell>,
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
            renderMobileCard={(r) => (
              <MobileTableCard
                key={r.id}
                selectable
                selected={selectedIds.includes(r.id)}
                onSelect={() => handleSelect(r.id)}
                title={r.car_numplate ?? r.car}
                subtitle={r.date}
                details={[
                  { label: t('fuel.table.liters'), value: `${r.liters} L` },
                  { label: t('fuel.table.odometer'), value: `${r.odometer} km` },
                  { label: t('fuel.table.mileage'), value: `${r.monthly_mileage} km` },
                  { label: t('fuel.table.consumption'), value: `${r.consumption} L/100km` },
                  { label: t('fuel.table.total_cost'), value: formatPrice(r.total_cost, currency) },
                ]}
                actions={
                  <Group gap="xs" wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(r, e)
                      }}
                      title={t('common.edit')}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDelete(r, e)
                      }}
                      title={t('common.delete')}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                }
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

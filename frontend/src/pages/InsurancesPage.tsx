import { useMemo, useState } from 'react'

import { ActionIcon, Badge, Button, Container, Group, Select, Text, Title } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateInsuranceMutation, useInsurancesQuery, useUpdateInsuranceMutation, useDeleteInsuranceMutation, useBulkDeleteInsurancesMutation } from '@features/insurance/hooks/useInsurance'
import { InsuranceFormModal } from '@features/insurance/ui/InsuranceFormModal'
import type { Insurance } from '@entities/fleet/types'
import { ModernTable, ModernTableRow, TableCell, TableCellBadge, MobileTableCard } from '@shared/ui/ModernTable'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

export function InsurancesPage() {
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

  const { data, isLoading, isError } = useInsurancesQuery({ page, page_size: pageSize, car: carId })

  const createMutation = useCreateInsuranceMutation()
  const updateMutation = useUpdateInsuranceMutation()
  const deleteMutation = useDeleteInsuranceMutation()

  const [modalOpened, setModalOpened] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRecord, setSelectedRecord] = useState<Insurance | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const bulkDeleteMutation = useBulkDeleteInsurancesMutation()

  const openEdit = (record: Insurance, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRecord(record)
    setModalMode('edit')
    setModalOpened(true)
  }

  const confirmDelete = (record: Insurance, e: React.MouseEvent) => {
    e.stopPropagation()
    modals.openConfirmModal({
      title: t('insurances.delete_confirm.title'),
      children: (
        <Text size="sm">
          {t('insurances.delete_confirm.message', { number: record.number })}
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
          title: t('insurances.notifications.deleted.title'),
          message: t('insurances.notifications.deleted.message'),
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
      title: t('insurances.bulk_delete.title') || 'Delete selected records',
      children: (
        <Text size="sm">
          {t('insurances.bulk_delete.message', { count: selectedIds.length }) ||
            `Delete ${selectedIds.length} insurance records? This action cannot be undone.`}
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
          title: t('insurances.notifications.deleted.title'),
          message: t('insurances.notifications.bulk_deleted.message', { count: selectedIds.length }) ||
            `${selectedIds.length} records deleted`,
          color: 'green',
        })
      },
    })
  }

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs" wrap="wrap" gap="sm">
        <Title order={2} style={{ flex: 1, minWidth: 200 }}>{t('insurances.title')}</Title>
        <Button onClick={() => setModalOpened(true)} style={{ width: '100%' }}>{t('insurances.add')}</Button>
      </Group>

      <Group align="flex-end" mb="md" wrap="wrap" gap="sm">
        <Select
          label={t('insurances.form.car')}
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
              { key: 'car', title: t('insurances.table.car'), width: 160 },
              { key: 'type', title: t('insurances.table.type'), width: 120 },
              { key: 'number', title: t('insurances.table.number'), width: 140 },
              { key: 'start', title: t('insurances.table.start'), width: 120 },
              { key: 'end', title: t('insurances.table.end'), width: 120 },
              { key: 'cost', title: t('insurances.table.cost'), width: 110 },
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
                  <TableCellBadge key="type" color="blue">{r.insurance_type}</TableCellBadge>,
                  <TableCell key="number" fw={500}>{r.number}</TableCell>,
                  <TableCell key="start">{r.start_date}</TableCell>,
                  <TableCell key="end">{r.end_date}</TableCell>,
                  <TableCell key="cost" fw={500}>{formatPrice(r.cost, currency)}</TableCell>,
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
                title={r.number}
                subtitle={r.car_numplate ?? r.car}
                badges={[{ label: r.insurance_type, color: 'blue' }]}
                details={[
                  { label: t('insurances.table.start'), value: r.start_date },
                  { label: t('insurances.table.end'), value: r.end_date },
                  { label: t('insurances.table.cost'), value: formatPrice(r.cost, currency) },
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
            emptyMessage={t('insurances.no_data') || 'No insurance records'}
            total={data?.count}
            page={page}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      <InsuranceFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        mode={modalMode}
        record={selectedRecord}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onCreate={async (payload) => {
          await createMutation.mutateAsync(payload)
        }}
        onUpdate={async (insuranceId, payload) => {
          await updateMutation.mutateAsync({ insuranceId, payload })
        }}
      />
    </Container>
  )
}

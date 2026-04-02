import { useMemo, useState } from 'react'

import { ActionIcon, Button, Container, Group, Select, Text, Title } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateInspectionMutation, useInspectionsQuery, useUpdateInspectionMutation, useDeleteInspectionMutation } from '@features/inspections/hooks/useInspections'
import { InspectionFormModal } from '@features/inspections/ui/InspectionFormModal'
import type { Inspection } from '@entities/fleet/types'
import { ModernTable, ModernTableRow, TableCell } from '@shared/ui/ModernTable'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

export function InspectionsPage() {
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

  const { data, isLoading, isError } = useInspectionsQuery({ page, page_size: pageSize, car: carId })

  const createMutation = useCreateInspectionMutation()
  const updateMutation = useUpdateInspectionMutation()
  const deleteMutation = useDeleteInspectionMutation()

  const [modalOpened, setModalOpened] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRecord, setSelectedRecord] = useState<Inspection | undefined>(undefined)

  const openEdit = (record: Inspection, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRecord(record)
    setModalMode('edit')
    setModalOpened(true)
  }

  const confirmDelete = (record: Inspection, e: React.MouseEvent) => {
    e.stopPropagation()
    modals.openConfirmModal({
      title: t('inspections.delete_confirm.title'),
      children: (
        <Text size="sm">
          {t('inspections.delete_confirm.message', { number: record.number })}
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
          title: t('inspections.notifications.deleted.title'),
          message: t('inspections.notifications.deleted.message'),
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
        <Title order={2}>{t('inspections.title')}</Title>
        <Button onClick={() => setModalOpened(true)}>{t('inspections.add')}</Button>
      </Group>

      <Group align="flex-end" mb="md">
        <Select
          label={t('inspections.form.car')}
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
              { key: 'car', title: t('inspections.table.car'), width: 160 },
              { key: 'number', title: t('inspections.table.number'), width: 140 },
              { key: 'date', title: t('inspections.table.date'), width: 130 },
              { key: 'cost', title: t('inspections.table.cost'), width: 110 },
              { key: 'actions', title: '', width: 90 },
            ]}
            data={records}
            renderRow={(r) => (
              <ModernTableRow
                key={r.id}
                cells={[
                  <TableCell key="car" fw={500}>{r.car_numplate ?? r.car}</TableCell>,
                  <TableCell key="number" fw={500}>{r.number}</TableCell>,
                  <TableCell key="date">{r.inspected_at}</TableCell>,
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
            emptyMessage={t('inspections.no_data') || 'No inspection records'}
            total={data?.count}
            page={page}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      <InspectionFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        mode={modalMode}
        record={selectedRecord}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onCreate={async (payload) => {
          await createMutation.mutateAsync(payload)
        }}
        onUpdate={async (inspectionId, payload) => {
          await updateMutation.mutateAsync({ inspectionId, payload })
        }}
      />
    </Container>
  )
}

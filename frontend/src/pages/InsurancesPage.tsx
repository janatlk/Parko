import { useMemo, useState } from 'react'

import { ActionIcon, Button, Container, Group, Select, Text, Title } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useCreateInsuranceMutation, useInsurancesQuery, useUpdateInsuranceMutation, useDeleteInsuranceMutation } from '@features/insurance/hooks/useInsurance'
import { InsuranceFormModal } from '@features/insurance/ui/InsuranceFormModal'
import type { Insurance } from '@entities/fleet/types'
import { ModernTable, ModernTableRow, TableCell, TableCellBadge } from '@shared/ui/ModernTable'
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

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs">
        <Title order={2}>{t('insurances.title')}</Title>
        <Button onClick={() => setModalOpened(true)}>{t('insurances.add')}</Button>
      </Group>

      <Group align="flex-end" mb="md">
        <Select
          label={t('insurances.form.car')}
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

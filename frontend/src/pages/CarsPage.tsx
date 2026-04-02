import { useMemo, useState } from 'react'

import { ActionIcon, Button, Container, Group, Select, Text, TextInput, Title, Box } from '@mantine/core'
import { IconEdit, IconTrash, IconAlertTriangle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useCarsQuery, useCreateCarMutation, useUpdateCarMutation, useDeleteCarMutation } from '@features/cars/hooks/useCars'
import { useCarRelatedStats } from '@features/cars/hooks/useCarDetail'
import { CarFormModal } from '@features/cars/ui/CarFormModal'
import type { Car, CarStatus } from '@entities/car/types'
import { CAR_STATUSES } from '@entities/car/types'
import { canEditCars } from '@shared/lib/permissions'
import { PermissionGuard } from '@shared/ui/PermissionGuard'
import { ModernTable, ModernTableRow, TableCell, TableCellBadge } from '@shared/ui/ModernTable'

export function CarsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const modals = useModals()
  const { user: currentUser } = useAuth()
  const canEdit = canEditCars(currentUser)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const createMutation = useCreateCarMutation()
  const updateMutation = useUpdateCarMutation()
  const deleteMutation = useDeleteCarMutation()

  const [modalOpened, setModalOpened] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedCar, setSelectedCar] = useState<Car | undefined>(undefined)

  const openCreate = () => {
    setSelectedCar(undefined)
    setModalMode('create')
    setModalOpened(true)
  }

  const openEdit = (car: Car, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCar(car as Car)
    setModalMode('edit')
    setModalOpened(true)
  }

  const confirmDelete = (car: Car, e: React.MouseEvent) => {
    e.stopPropagation()
    
    modals.openConfirmModal({
      title: (
        <Group gap="sm" c="red">
          <IconAlertTriangle size={20} />
          <Text fw={500}>{t('cars.delete_confirm.title')}</Text>
        </Group>
      ),
      children: (
        <Box>
          <Text size="sm" mb="md">
            {t('cars.delete_confirm.message', { numplate: car.numplate, brand: car.brand })}
          </Text>
          <Text size="sm" c="yellow" fw={500} mb="xs">
            ⚠️ {t('cars.delete_confirm.warning')}
          </Text>
          <DeleteWarningContent carId={car.id} />
        </Box>
      ),
      labels: {
        confirm: t('common.delete'),
        cancel: t('common.cancel'),
      },
      confirmProps: { color: 'red', loading: deleteMutation.isPending },
      onConfirm: async () => {
        await deleteMutation.mutateAsync(car.id)
        showNotification({
          title: t('cars.notifications.deleted.title'),
          message: t('cars.notifications.deleted.message'),
          color: 'green',
        })
      },
    })
  }

  const { data, isLoading, isError } = useCarsQuery({
    page,
    page_size: pageSize,
    search: search.trim() ? search.trim() : undefined,
    status: statusFilter ? (statusFilter as CarStatus) : undefined,
  })

  const cars = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1

  const statusOptions = useMemo(
    () => CAR_STATUSES.map((s) => ({ value: s, label: s })),
    []
  )

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs">
        <Title order={2}>{t('cars.title')}</Title>

        <PermissionGuard canAccess={canEdit} mode="disable">
          <Button onClick={openCreate}>{t('cars.add')}</Button>
        </PermissionGuard>
      </Group>

      <Group align="flex-end" mb="md">
        <TextInput
          label={t('cars.search')}
          placeholder={t('cars.search_placeholder') || 'Numplate, VIN, driver...'}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={320}
        />
        <Select
          label={t('cars.status')}
          placeholder={t('common.all') || 'All'}
          data={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          w={200}
        />
      </Group>

      {isLoading && <Text c="dimmed">{t('common.loading')}</Text>}
      {isError && <Text c="red">{t('cars.loading_error')}</Text>}

      {!isLoading && !isError && (
        <>
          <ModernTable
            columns={[
              { key: 'id', title: t('cars.table.id'), width: 80 },
              { key: 'numplate', title: t('cars.table.numplate'), width: 120 },
              { key: 'brand', title: t('cars.table.brand'), width: 140 },
              { key: 'title', title: t('cars.table.title'), width: 180 },
              { key: 'driver', title: t('cars.table.driver'), width: 180 },
              { key: 'status', title: t('cars.table.status'), width: 140 },
              { key: 'actions', title: '', width: 100 },
            ]}
            data={cars}
            renderRow={(c) => (
              <ModernTableRow
                key={c.id}
                cells={[
                  <TableCell key="id" align="center" fw={500} c="var(--mantine-color-blue-6)">
                    #{c.id}
                  </TableCell>,
                  <TableCell key="numplate" fw={500}>
                    {c.numplate}
                  </TableCell>,
                  <TableCell key="brand">{c.brand}</TableCell>,
                  <TableCell key="title">{c.title}</TableCell>,
                  <TableCell key="driver">{c.driver}</TableCell>,
                  <TableCellBadge
                    key="status"
                    color={c.status === 'ACTIVE' ? 'green' : c.status === 'MAINTENANCE' ? 'yellow' : 'gray'}
                  >
                    {c.status}
                  </TableCellBadge>,
                  <TableCell key="actions" align="right">
                    <Group gap="xs" justify="flex-end">
                      <PermissionGuard canAccess={canEdit} mode="disable">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          onClick={(e) => openEdit(c as Car, e)}
                          title={t('cars.edit')}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </PermissionGuard>
                      <PermissionGuard canAccess={canEdit} mode="disable">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={(e) => confirmDelete(c as Car, e)}
                          title={t('common.delete')}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </PermissionGuard>
                    </Group>
                  </TableCell>,
                ]}
                onClick={() => navigate(`/cars/${c.id}`)}
              />
            )}
            emptyMessage={t('cars.no_data') || 'No vehicles found'}
            total={data?.count}
            page={page}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      <CarFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        mode={modalMode}
        car={selectedCar}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onCreate={async (payload) => {
          await createMutation.mutateAsync(payload)
        }}
        onUpdate={async (carId, payload) => {
          await updateMutation.mutateAsync({ carId, payload })
        }}
      />
    </Container>
  )
}

function DeleteWarningContent({ carId }: { carId: number }) {
  const { data: stats, isLoading } = useCarRelatedStats(carId)

  if (isLoading) {
    return <Text size="sm" c="dimmed">Loading...</Text>
  }

  if (!stats) {
    return null
  }

  const items = [
    { label: '⛽ Fuel', count: stats.fuel_records },
    { label: '🔧 Spares', count: stats.spares },
    { label: '📋 Insurances', count: stats.insurances },
    { label: '✅ Inspections', count: stats.inspections },
    { label: '🛞 Tires', count: stats.tires },
    { label: '🔋 Accumulators', count: stats.accumulators },
    { label: '📸 Photos', count: stats.photos },
  ].filter(item => item.count > 0)

  if (items.length === 0) {
    return <Text size="sm" c="green">✓ No related records will be deleted</Text>
  }

  return (
    <Box style={{ 
      backgroundColor: 'var(--mantine-color-red-light)', 
      padding: 'var(--mantine-spacing-sm)', 
      borderRadius: 'var(--mantine-radius-md)',
      marginTop: 'var(--mantine-spacing-sm)'
    }}>
      {items.map(item => (
        <Text key={item.label} size="sm" c="red">
          • {item.label}: <b>{item.count}</b>
        </Text>
      ))}
      <Text size="xs" c="red" mt="xs" fw={500}>
        Total: {stats.total} records will be permanently deleted
      </Text>
    </Box>
  )
}

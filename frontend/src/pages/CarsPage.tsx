import { useMemo, useState } from 'react'

import { ActionIcon, Button, Container, Group, Pagination, Select, Table, Text, TextInput, Title } from '@mantine/core'
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useCarsQuery, useCreateCarMutation, useUpdateCarMutation, useDeleteCarMutation } from '@features/cars/hooks/useCars'
import { CarFormModal } from '@features/cars/ui/CarFormModal'
import type { Car, CarStatus } from '@entities/car/types'
import { CAR_STATUSES } from '@entities/car/types'
import { canEditCars } from '@shared/lib/permissions'
import { PermissionGuard } from '@shared/ui/PermissionGuard'

export function CarsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const modals = useModals()
  const { user: currentUser } = useAuth()
  const canEdit = canEditCars(currentUser)

  const [page, setPage] = useState(1)
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
      title: t('cars.delete_confirm.title'),
      children: (
        <Text size="sm">
          {t('cars.delete_confirm.message', { numplate: car.numplate, brand: car.brand })}
        </Text>
      ),
      labels: {
        confirm: t('common.delete'),
        cancel: t('common.cancel'),
      },
      confirmProps: { color: 'red' },
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
    search: search.trim() ? search.trim() : undefined,
    status: statusFilter ? (statusFilter as CarStatus) : undefined,
  })

  const cars = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1

  const statusOptions = useMemo(
    () => CAR_STATUSES.map((s) => ({ value: s, label: s })),
    []
  )

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
          <Text size="sm" c="dimmed" mb="xs">
            💡 {t('cars.click_hint') || 'Click on a row to view car details'}
          </Text>
          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('cars.table.id')}</Table.Th>
                <Table.Th>{t('cars.table.numplate')}</Table.Th>
                <Table.Th>{t('cars.table.brand')}</Table.Th>
                <Table.Th>{t('cars.table.title')}</Table.Th>
                <Table.Th>{t('cars.table.driver')}</Table.Th>
                <Table.Th>{t('cars.table.status')}</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {cars.map((c) => (
                <Table.Tr
                  key={c.id}
                  onClick={() => navigate(`/cars/${c.id}`)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-blue-light)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Table.Td>
                    <Group gap="xs">
                      <IconEye size={16} color="var(--mantine-color-blue-6)" />
                      {c.id}
                    </Group>
                  </Table.Td>
                  <Table.Td>{c.numplate}</Table.Td>
                  <Table.Td>{c.brand}</Table.Td>
                  <Table.Td>{c.title}</Table.Td>
                  <Table.Td>{c.driver}</Table.Td>
                  <Table.Td>{c.status}</Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Group gap="xs">
                      <PermissionGuard canAccess={canEdit} mode="disable">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="sm"
                          onClick={(e) => openEdit(c as Car, e)}
                          title={t('cars.edit')}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </PermissionGuard>
                      <PermissionGuard canAccess={canEdit} mode="disable">
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="sm"
                          onClick={(e) => confirmDelete(c as Car, e)}
                          title={t('common.delete')}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </PermissionGuard>
                    </Group>
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

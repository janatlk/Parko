import { useMemo, useState } from 'react'

import { Button, Container, Group, Pagination, Select, Table, Text, TextInput, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useCarsQuery, useCreateCarMutation } from '@features/cars/hooks/useCars'
import { CarFormModal } from '@features/cars/ui/CarFormModal'
import type { CarStatus } from '@entities/car/types'
import { CAR_STATUSES } from '@entities/car/types'
import { canEditCars } from '@shared/lib/permissions'
import { PermissionGuard } from '@shared/ui/PermissionGuard'

export function CarsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const canEdit = canEditCars(currentUser)

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const createMutation = useCreateCarMutation()
  const [modalOpened, setModalOpened] = useState(false)

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
          <Button onClick={() => setModalOpened(true)}>{t('cars.add')}</Button>
        </PermissionGuard>
      </Group>

      <Group align="flex-end" mb="md">
        <TextInput
          label={t('cars.search')}
          placeholder="Numplate, VIN, driver..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={320}
        />
        <Select
          label={t('cars.status')}
          placeholder="All"
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
          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('cars.table.id')}</Table.Th>
                <Table.Th>{t('cars.table.numplate')}</Table.Th>
                <Table.Th>{t('cars.table.brand')}</Table.Th>
                <Table.Th>{t('cars.table.title')}</Table.Th>
                <Table.Th>{t('cars.table.driver')}</Table.Th>
                <Table.Th>{t('cars.table.status')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {cars.map((c) => (
                <Table.Tr
                  key={c.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/cars/${c.id}`)}
                >
                  <Table.Td>{c.id}</Table.Td>
                  <Table.Td>{c.numplate}</Table.Td>
                  <Table.Td>{c.brand}</Table.Td>
                  <Table.Td>{c.title}</Table.Td>
                  <Table.Td>{c.driver}</Table.Td>
                  <Table.Td>{c.status}</Table.Td>
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
        isSubmitting={createMutation.isPending}
        onCreate={async (payload) => {
          await createMutation.mutateAsync(payload)
        }}
      />
    </Container>
  )
}

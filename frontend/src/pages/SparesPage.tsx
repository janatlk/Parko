import { useMemo, useState } from 'react'

import { ActionIcon, Button, Container, Group, Pagination, Select, Table, Text, TextInput, Title } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import { useSparesQuery, useCreateSpareMutation, useUpdateSpareMutation, useDeleteSpareMutation } from '@features/spares/hooks/useSpares'
import { SpareFormModal } from '@features/spares/ui/SpareFormModal'
import type { Spare } from '@entities/fleet/types'

export function SparesPage() {
  const { t } = useTranslation()
  const modals = useModals()
  const [page, setPage] = useState(1)
  const [carFilter, setCarFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState<string | null>(null)

  const { data: carsData } = useCarsQuery({ page: 1 })
  const carOptions = useMemo(
    () =>
      (carsData?.results ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.numplate} - ${c.brand} ${c.title}`,
      })),
    [carsData],
  )

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 10 }, (_, i) => currentYear - i).map((year) => ({
      value: String(year),
      label: String(year),
    }))
  }, [])

  const monthOptions = useMemo(() => {
    const months = [
      { value: '1', label: t('common.january') },
      { value: '2', label: t('common.february') },
      { value: '3', label: t('common.march') },
      { value: '4', label: t('common.april') },
      { value: '5', label: t('common.may') },
      { value: '6', label: t('common.june') },
      { value: '7', label: t('common.july') },
      { value: '8', label: t('common.august') },
      { value: '9', label: t('common.september') },
      { value: '10', label: t('common.october') },
      { value: '11', label: t('common.november') },
      { value: '12', label: t('common.december') },
    ]
    return months
  }, [t])

  const carId = carFilter ? Number(carFilter) : undefined
  const year = yearFilter ? Number(yearFilter) : undefined
  const month = monthFilter ? Number(monthFilter) : undefined

  const { data, isLoading, isError } = useSparesQuery({
    page,
    car: carId,
    search: search.trim() ? search.trim() : undefined,
    installed_at__year: year,
    installed_at__month: month,
  })

  const createMutation = useCreateSpareMutation()
  const updateMutation = useUpdateSpareMutation()
  const deleteMutation = useDeleteSpareMutation()

  const [modalOpened, setModalOpened] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRecord, setSelectedRecord] = useState<Spare | undefined>(undefined)

  const openCreate = () => {
    setSelectedRecord(undefined)
    setModalMode('create')
    setModalOpened(true)
  }

  const openEdit = (record: Spare, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRecord(record)
    setModalMode('edit')
    setModalOpened(true)
  }

  const confirmDelete = (record: Spare, e: React.MouseEvent) => {
    e.stopPropagation()
    modals.openConfirmModal({
      title: t('spares.delete_confirm.title'),
      children: (
        <Text size="sm">
          {t('spares.delete_confirm.message', { title: record.title })}
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
          title: t('spares.notifications.deleted.title'),
          message: t('spares.notifications.deleted.message'),
          color: 'green',
        })
      },
    })
  }

  const handleCreate = async (payload: Partial<Spare>) => {
    await createMutation.mutateAsync(payload)
    showNotification({
      title: t('spares.notifications.created.title'),
      message: t('spares.notifications.created.message'),
      color: 'green',
    })
    setModalOpened(false)
  }

  const handleUpdate = async (spareId: number, payload: Partial<Spare>) => {
    await updateMutation.mutateAsync({ id: spareId, data: payload })
    showNotification({
      title: t('spares.notifications.updated.title'),
      message: t('spares.notifications.updated.message'),
      color: 'green',
    })
    setModalOpened(false)
  }

  const records = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs">
        <Title order={2}>{t('spares.title')}</Title>
        <Button onClick={openCreate}>{t('spares.add')}</Button>
      </Group>

      <Group align="flex-end" mb="md" gap="sm">
        <Select
          label={t('spares.form.car')}
          placeholder={t('common.all')}
          data={carOptions}
          value={carFilter}
          onChange={setCarFilter}
          clearable
          searchable
          w={260}
        />

        <Select
          label={t('spares.form.year')}
          placeholder={t('common.all')}
          data={yearOptions}
          value={yearFilter}
          onChange={setYearFilter}
          clearable
          w={120}
        />

        <Select
          label={t('spares.form.month')}
          placeholder={t('common.all')}
          data={monthOptions}
          value={monthFilter}
          onChange={setMonthFilter}
          clearable
          w={140}
        />

        <TextInput
          label={t('spares.form.search')}
          placeholder={t('spares.form.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          w={200}
        />
      </Group>

      {isLoading && <Text c="dimmed">{t('common.loading')}</Text>}
      {isError && <Text c="red">{t('common.error_loading')}</Text>}

      {!isLoading && !isError && (
        <>
          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('spares.table.car')}</Table.Th>
                <Table.Th>{t('spares.table.title')}</Table.Th>
                <Table.Th>{t('spares.table.description')}</Table.Th>
                <Table.Th>{t('spares.table.part_price')}</Table.Th>
                <Table.Th>{t('spares.table.job')}</Table.Th>
                <Table.Th>{t('spares.table.job_price')}</Table.Th>
                <Table.Th>{t('spares.table.total')}</Table.Th>
                <Table.Th>{t('spares.table.date')}</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((record) => (
                <Table.Tr key={record.id}>
                  <Table.Td>{record.car_numplate ?? record.car}</Table.Td>
                  <Table.Td>{record.title}</Table.Td>
                  <Table.Td>{record.description || '—'}</Table.Td>
                  <Table.Td>{record.part_price} с.</Table.Td>
                  <Table.Td>{record.job_description || '—'}</Table.Td>
                  <Table.Td>{record.job_price} с.</Table.Td>
                  <Table.Td fw={700}>{record.part_price + record.job_price} с.</Table.Td>
                  <Table.Td>{record.installed_at}</Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        onClick={(e) => openEdit(record, e)}
                        title={t('common.edit')}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={(e) => confirmDelete(record, e)}
                        title={t('common.delete')}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {records.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              {t('spares.no_data')}
            </Text>
          )}

          {totalPages > 1 && (
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              mt="md"
            />
          )}
        </>
      )}

      <SpareFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        mode={modalMode}
        record={selectedRecord}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </Container>
  )
}

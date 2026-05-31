import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ActionIcon,
  Alert,
  Button,
  Checkbox,
  Container,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAlertTriangle, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { DateInput } from '@mantine/dates'

import {
  useCustomTable,
  useCustomRecords,
  useCreateCustomRecord,
  useUpdateCustomRecord,
  useDeleteCustomRecord,
} from '@features/custom_tables/hooks/useCustomTables'
import { useCarsQuery } from '@features/cars/hooks/useCars'
import type { ColumnSchema } from '@features/custom_tables/api/customTablesApi'

export function CustomTableDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const tableId = Number(id)
  const [opened, { open, close }] = useDisclosure(false)
  const [editingRecord, setEditingRecord] = useState<number | null>(null)

  const { data: table, isLoading: tableLoading } = useCustomTable(tableId)
  const { data: records, isLoading: recordsLoading } = useCustomRecords(tableId)
  const { data: carsData } = useCarsQuery({ page: 1 })
  const cars = carsData?.results
  const createRecord = useCreateCustomRecord()
  const updateRecord = useUpdateCustomRecord()
  const deleteRecord = useDeleteCustomRecord()

  const columns = useMemo(() => table?.schema?.columns || [], [table])
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [carId, setCarId] = useState<string | null>(null)

  useEffect(() => {
    if (!opened) {
      setFormData({})
      setCarId(null)
      setEditingRecord(null)
    }
  }, [opened])

  const handleEdit = (record: any) => {
    setEditingRecord(record.id)
    setFormData({ ...record.data })
    setCarId(record.car ? String(record.car) : null)
    open()
  }

  const handleSubmit = () => {
    const payload = {
      table: tableId,
      car: carId ? Number(carId) : null,
      data: formData,
    }
    if (editingRecord) {
      updateRecord.mutate({ id: editingRecord, payload }, { onSuccess: close })
    } else {
      createRecord.mutate(payload, { onSuccess: close })
    }
  }

  const handleDelete = (recordId: number) => {
    if (confirm(t('common.confirm_delete', 'Удалить?'))) {
      deleteRecord.mutate(recordId)
    }
  }

  if (tableLoading) {
    return (
      <Container size="fluid" px="sm" py="sm">
        <Skeleton height={32} width={250} mb="sm" />
        <Skeleton height={200} radius="md" />
      </Container>
    )
  }

  if (!table) {
    return (
      <Container size="fluid" px="sm" py="sm">
        <Alert color="red" icon={<IconAlertTriangle size={18} />}>
          {t('common.not_found', 'Не найдено')}
        </Alert>
      </Container>
    )
  }

  const carOptions = cars?.map((c: any) => ({ value: String(c.id), label: `${c.brand} ${c.title} (${c.numplate})` })) || []

  return (
    <Container size="fluid" px="sm" py="sm">
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Title order={3}>{table.name}</Title>
            {table.description && (
              <Text size="xs" c="dimmed">
                {table.description}
              </Text>
            )}
          </div>
          <Button size="xs" leftSection={<IconPlus size={16} />} onClick={open}>
            {t('common.add', 'Добавить')}
          </Button>
        </Group>

        <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
          <Table highlightOnHover striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('custom_tables.car', 'Авто')}</Table.Th>
                {columns.map((col: ColumnSchema) => (
                  <Table.Th key={col.name}>
                    {col.name}
                  </Table.Th>
                ))}
                <Table.Th style={{ width: 80 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recordsLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + 2}>
                    <Skeleton height={40} />
                  </Table.Td>
                </Table.Tr>
              ) : (
                records?.map((record: any) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>
                      {record.car_numplate ? `${record.car_brand} ${record.car_title} (${record.car_numplate})` : '—'}
                    </Table.Td>
                    {columns.map((col: ColumnSchema) => (
                      <Table.Td key={col.name}>
                        {renderCellValue(record.data?.[col.name], col.type)}
                      </Table.Td>
                    ))}
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="subtle" size="sm" onClick={() => handleEdit(record)}>
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" size="sm" color="red" onClick={() => handleDelete(record.id)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>

          {!records?.length && !recordsLoading && (
            <Paper p="xl" ta="center">
              <Text c="dimmed" size="sm">
                {t('custom_tables.no_records', 'Нет записей')}
              </Text>
            </Paper>
          )}
        </Paper>
      </Stack>

      <Modal opened={opened} onClose={close} title={editingRecord ? t('common.edit', 'Редактировать') : t('common.add', 'Добавить')} size="lg">
        <Stack gap="sm">
          <Select
            label={t('custom_tables.car', 'Авто')}
            data={carOptions}
            value={carId}
            onChange={setCarId}
            clearable
            size="xs"
          />
          {columns.map((col: ColumnSchema) => (
            <DynamicField
              key={col.name}
              column={col}
              value={formData[col.name]}
              onChange={(val) => setFormData((prev) => ({ ...prev, [col.name]: val }))}
            />
          ))}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" size="xs" onClick={close}>
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button size="xs" onClick={handleSubmit} loading={createRecord.isPending || updateRecord.isPending}>
              {t('common.save', 'Сохранить')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}

function renderCellValue(value: unknown, type: string) {
  if (value === null || value === undefined || value === '') return '—'
  if (type === 'checkbox') return value ? '✓' : '—'
  if (type === 'file' && typeof value === 'string') {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer">
        📎
      </a>
    )
  }
  return String(value)
}

function DynamicField({
  column,
  value,
  onChange,
}: {
  column: ColumnSchema
  value: unknown
  onChange: (val: unknown) => void
}) {
  const { t } = useTranslation()

  switch (column.type) {
    case 'number':
    case 'price':
      return (
        <NumberInput
          label={column.name}
          value={typeof value === 'number' ? value : undefined}
          onChange={(val) => onChange(val)}
          required={column.required}
          size="xs"
          hideControls
        />
      )
    case 'date':
      return (
        <DateInput
          label={column.name}
          value={value ? new Date(String(value)) : undefined}
          onChange={(val) => onChange(val ? String(val).split('T')[0] : null)}
          required={column.required}
          size="xs"
          valueFormat="YYYY-MM-DD"
        />
      )
    case 'select':
      return (
        <Select
          label={column.name}
          data={column.options || []}
          value={typeof value === 'string' ? value : null}
          onChange={(val) => onChange(val)}
          required={column.required}
          size="xs"
          clearable
        />
      )
    case 'checkbox':
      return (
        <Checkbox
          label={column.name}
          checked={!!value}
          onChange={(e) => onChange(e.currentTarget.checked)}
          size="xs"
        />
      )
    case 'file':
      return (
        <TextInput
          label={column.name}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={t('custom_tables.file_url', 'URL файла')}
          required={column.required}
          size="xs"
        />
      )
    case 'text':
    default:
      return (
        <TextInput
          label={column.name}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={column.required}
          size="xs"
        />
      )
  }
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ActionIcon,
  Button,
  Container,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  TagsInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconGripVertical, IconPlus, IconTrash } from '@tabler/icons-react'

import {
  useCustomTable,
  useCreateCustomTable,
  useUpdateCustomTable,
} from '@features/custom_tables/hooks/useCustomTables'
import type { ColumnType, ColumnSchema } from '@features/custom_tables/api/customTablesApi'

const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число' },
  { value: 'price', label: 'Цена' },
  { value: 'date', label: 'Дата' },
  { value: 'select', label: 'Выбор' },
  { value: 'checkbox', label: 'Галочка' },
  { value: 'file', label: 'Файл (URL)' },
]

export function CustomTableBuilderPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id && id !== 'new'
  const tableId = isEdit ? Number(id) : 0

  const { data: existingTable } = useCustomTable(tableId)
  const createTable = useCreateCustomTable()
  const updateTable = useUpdateCustomTable()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [columns, setColumns] = useState<ColumnSchema[]>([])

  useEffect(() => {
    if (existingTable) {
      setName(existingTable.name)
      setDescription(existingTable.description)
      setColumns(existingTable.schema?.columns || [])
    }
  }, [existingTable])

  const addColumn = () => {
    setColumns((prev) => [...prev, { name: '', type: 'text', required: false }])
  }

  const removeColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index))
  }

  const updateColumn = (index: number, field: keyof ColumnSchema, value: any) => {
    setColumns((prev) => prev.map((col, i) => (i === index ? { ...col, [field]: value } : col)))
  }

  const handleSubmit = () => {
    const payload = {
      name,
      description,
      icon: 'table',
      schema: { columns },
    }
    if (isEdit) {
      updateTable.mutate({ id: tableId, payload }, { onSuccess: () => navigate('/custom-tables') })
    } else {
      createTable.mutate(payload, { onSuccess: () => navigate('/custom-tables') })
    }
  }

  return (
    <Container size="fluid" px="sm" py="sm">
      <Stack gap="sm">
        <Title order={3}>{isEdit ? t('common.edit', 'Редактировать') : t('common.create', 'Создать')} {t('custom_tables.table', 'таблицу')}</Title>

        <Paper withBorder p="sm" radius="md">
          <Stack gap="sm">
            <TextInput label={t('custom_tables.name', 'Название')} value={name} onChange={(e) => setName(e.currentTarget.value)} required size="xs" />
            <TextInput
              label={t('custom_tables.description', 'Описание')}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              size="xs"
            />
          </Stack>
        </Paper>

        <Paper withBorder p="sm" radius="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">
              {t('custom_tables.columns', 'Колонки')}
            </Text>
            <Button size="xs" leftSection={<IconPlus size={14} />} variant="light" onClick={addColumn}>
              {t('common.add', 'Добавить')}
            </Button>
          </Group>

          <Stack gap="xs">
            {columns.map((col, index) => (
              <Group key={index} gap="xs" align="flex-end">
                <IconGripVertical size={16} color="var(--mantine-color-dimmed)" />
                <TextInput
                  placeholder={t('custom_tables.column_name', 'Имя колонки')}
                  value={col.name}
                  onChange={(e) => updateColumn(index, 'name', e.currentTarget.value)}
                  size="xs"
                  style={{ flex: 1 }}
                />
                <Select
                  data={COLUMN_TYPES}
                  value={col.type}
                  onChange={(val) => updateColumn(index, 'type', val)}
                  size="xs"
                  style={{ width: 140 }}
                />
                <Switch
                  label={t('custom_tables.required', 'Обяз.')}
                  checked={col.required}
                  onChange={(e) => updateColumn(index, 'required', e.currentTarget.checked)}
                  size="xs"
                />
                {col.type === 'select' && (
                  <TagsInput
                    placeholder="Варианты"
                    value={col.options || []}
                    onChange={(val) => updateColumn(index, 'options', val)}
                    size="xs"
                    style={{ width: 200 }}
                  />
                )}
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeColumn(index)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ))}
            {!columns.length && (
              <Text c="dimmed" size="xs" ta="center">
                {t('custom_tables.no_columns', 'Нет колонок')}
              </Text>
            )}
          </Stack>
        </Paper>

        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={() => navigate('/custom-tables')}>
            {t('common.cancel', 'Отмена')}
          </Button>
          <Button size="xs" onClick={handleSubmit} loading={createTable.isPending || updateTable.isPending} disabled={!name || !columns.length}>
            {t('common.save', 'Сохранить')}
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}

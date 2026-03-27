import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { Spare } from '@entities/fleet/types'

type Mode = 'create' | 'edit'

type Props = {
  opened: boolean
  onClose: () => void
  mode: Mode
  record?: Spare
  onCreate: (payload: Partial<Spare>) => Promise<void>
  onUpdate: (spareId: number, payload: Partial<Spare>) => Promise<void>
  isSubmitting?: boolean
}

export function SpareFormModal({
  opened,
  onClose,
  mode,
  record,
  onCreate,
  onUpdate,
  isSubmitting,
}: Props) {
  const { t } = useTranslation()
  const initial = useMemo(
    () => ({
      car: record ? String(record.car) : null as string | null,
      title: record?.title ?? '',
      description: record?.description ?? '',
      part_price: record?.part_price ?? 0,
      job_description: record?.job_description ?? '',
      job_price: record?.job_price ?? 0,
      installed_at: record?.installed_at ? new Date(record.installed_at) : (new Date() as Date | string),
    }),
    [record],
  )

  const [form, setForm] = useState<typeof initial>(initial)

  useEffect(() => {
    if (opened) setForm(initial)
  }, [initial, opened])

  const { data: carsData, isLoading: isCarsLoading, isError: isCarsError } = useCarsQuery({ page: 1 })
  const carOptions = useMemo(
    () =>
      (carsData?.results ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.numplate} - ${c.brand} ${c.title}`,
      })),
    [carsData],
  )

  const submit = async () => {
    const carId = form.car ? Number(form.car) : NaN
    if (!carId || Number.isNaN(carId)) return
    if (!form.installed_at) return

    const dateObj = form.installed_at instanceof Date ? form.installed_at : new Date(form.installed_at)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    const installedAt = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    if (mode === 'edit' && record) {
      await onUpdate(record.id, {
        car: carId,
        title: form.title,
        description: form.description,
        part_price: form.part_price,
        job_description: form.job_description,
        job_price: form.job_price,
        installed_at: installedAt,
      })
      onClose()
      return
    }

    const payload: Partial<Spare> = {
      car: carId,
      title: form.title,
      description: form.description,
      part_price: form.part_price,
      job_description: form.job_description,
      job_price: form.job_price,
      installed_at: installedAt,
    }

    await onCreate(payload)
    onClose()
  }

  const totalCost = form.part_price + form.job_price

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? t('spares.form.title') : t('spares.form.edit_title')}
      centered
      size="md"
    >
      <Stack>
        {isCarsLoading && <Text c="dimmed">{t('common.loading')}</Text>}
        {isCarsError && <Text c="red">{t('spares.form.failed_to_load_cars')}</Text>}

        <Select
          label={t('spares.form.car')}
          data={carOptions}
          value={form.car}
          onChange={(value) => setForm((s) => ({ ...s, car: value }))}
          required
          searchable
          disabled={isCarsLoading || isCarsError}
        />

        <TextInput
          label={t('spares.form.name')}
          value={form.title}
          onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          required
        />

        <TextInput
          label={t('spares.form.description')}
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
        />

        <NumberInput
          label={t('spares.form.part_price')}
          value={form.part_price}
          onChange={(value) => setForm((s) => ({ ...s, part_price: Number(value || 0) }))}
          min={0}
          required
        />

        <TextInput
          label={t('spares.form.job_description')}
          value={form.job_description}
          onChange={(e) => setForm((s) => ({ ...s, job_description: e.target.value }))}
        />

        <NumberInput
          label={t('spares.form.job_price')}
          value={form.job_price}
          onChange={(value) => setForm((s) => ({ ...s, job_price: Number(value || 0) }))}
          min={0}
          required
        />

        <Group gap="xs" align="flex-end">
          <Text size="sm" fw={500}>{t('spares.form.total_cost')}</Text>
          <Text size="sm" fw={700}>{totalCost} с.</Text>
        </Group>

        <DatePickerInput
          label={t('spares.form.installed_at')}
          value={form.installed_at}
          onChange={(value) => {
            if (value) {
              setForm((s) => ({ ...s, installed_at: value }))
            }
          }}
          required
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit()} loading={isSubmitting}>
            {mode === 'create' ? t('common.create') : t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { InspectionCreatePayload, InspectionUpdatePayload } from '../api/inspectionsApi'
import type { Inspection } from '@entities/fleet/types'

type Mode = 'create' | 'edit'

type Props = {
  opened: boolean
  onClose: () => void
  mode: Mode
  record?: Inspection
  onCreate: (payload: InspectionCreatePayload) => Promise<void>
  onUpdate: (inspectionId: number, payload: InspectionUpdatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function InspectionFormModal({
  opened,
  onClose,
  mode,
  record,
  onCreate,
  onUpdate,
  isSubmitting,
}: Props) {
  const { t } = useTranslation()
  const today = useMemo(() => new Date(), [])
  const initial = useMemo(
    () => ({
      car: record ? String(record.car) : null as string | null,
      number: record?.number ?? '',
      inspected_at: record?.inspected_at
        ? new Date(record.inspected_at)
        : (today as Date | string),
      cost: record?.cost ?? 0,
    }),
    [record, today],
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
    if (!form.number.trim()) return

    const dateObj = form.inspected_at instanceof Date ? form.inspected_at : new Date(form.inspected_at)

    if (mode === 'edit' && record) {
      await onUpdate(record.id, {
        car: carId,
        number: form.number.trim(),
        inspected_at: dateObj.toISOString().slice(0, 10),
        cost: form.cost,
      })
      onClose()
      return
    }

    const payload: InspectionCreatePayload = {
      car: carId,
      number: form.number.trim(),
      inspected_at: dateObj.toISOString().slice(0, 10),
      cost: form.cost,
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? t('inspections.form.title') : t('inspections.form.edit_title')}
      centered
    >
      <Stack>
        {isCarsLoading && <Text c="dimmed">{t('common.loading')}</Text>}
        {isCarsError && <Text c="red">{t('inspections.form.failed_to_load_cars')}</Text>}

        <Select
          label={t('inspections.form.car')}
          data={carOptions}
          value={form.car}
          onChange={(value) => setForm((s) => ({ ...s, car: value }))}
          required
          searchable
          disabled={isCarsLoading || isCarsError}
        />

        <TextInput
          label={t('inspections.form.number')}
          value={form.number}
          onChange={(e) => setForm((s) => ({ ...s, number: e.target.value }))}
          required
        />

        <DateInput
          label={t('inspections.form.inspected_at')}
          placeholder={t('inspections.form.inspected_at_placeholder')}
          value={form.inspected_at}
          onChange={(value) => {
            if (value) {
              setForm((s) => ({ ...s, inspected_at: value }))
            }
          }}
          required
        />

        <NumberInput
          label={t('inspections.form.cost')}
          value={form.cost}
          onChange={(value) => setForm((s) => ({ ...s, cost: Number(value || 0) }))}
          min={0}
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

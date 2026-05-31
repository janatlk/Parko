import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { FuelCreatePayload, FuelUpdatePayload } from '../api/fuelApi'
import type { Fuel } from '@entities/fleet/types'

type Mode = 'create' | 'edit'

type FormState = {
  car: string | null
  date: string
  liters: number
  total_cost: number
  odometer: number
}

type Props = {
  opened: boolean
  onClose: () => void
  mode: Mode
  record?: Fuel
  onCreate: (payload: FuelCreatePayload) => Promise<void>
  onUpdate: (fuelId: number, payload: FuelUpdatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function FuelFormModal({
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
      car: record ? String(record.car) : (null as string | null),
      date: record?.date ? String(record.date).split('T')[0] : new Date().toISOString().split('T')[0],
      liters: record?.liters ?? 0,
      total_cost: record?.total_cost ?? 0,
      odometer: record?.odometer ?? 0,
    }),
    [record],
  )

  const [form, setForm] = useState<FormState>(initial)

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
    if (!form.date) return

    const dateStr = form.date

    if (mode === 'edit' && record) {
      await onUpdate(record.id, {
        car: carId,
        date: dateStr,
        liters: form.liters,
        total_cost: form.total_cost,
        odometer: form.odometer,
      })
      onClose()
      return
    }

    const payload: FuelCreatePayload = {
      car: carId,
      date: dateStr,
      liters: form.liters,
      total_cost: form.total_cost,
      odometer: form.odometer,
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? t('fuel.form.title') : t('fuel.form.edit_title')}
      centered
    >
      <Stack>
        {isCarsLoading && <Text c="dimmed">{t('common.loading')}</Text>}
        {isCarsError && <Text c="red">{t('fuel.form.failed_to_load_cars')}</Text>}

        <Select
          label={t('fuel.form.car')}
          data={carOptions}
          value={form.car}
          onChange={(value) => setForm((s) => ({ ...s, car: value }))}
          required
          searchable
          disabled={isCarsLoading || isCarsError}
        />

        <DatePickerInput
          label={t('fuel.form.date')}
          placeholder={t('fuel.form.select_date')}
          value={form.date}
          onChange={(value) => {
            if (value) {
              setForm((s) => ({ ...s, date: String(value) }))
            }
          }}
          required
        />

        <NumberInput
          label={t('fuel.form.liters')}
          value={form.liters}
          onChange={(value) => setForm((s) => ({ ...s, liters: Number(value || 0) }))}
          min={0}
          required
        />

        <NumberInput
          label={t('fuel.form.total_cost')}
          value={form.total_cost}
          onChange={(value) => setForm((s) => ({ ...s, total_cost: Number(value || 0) }))}
          min={0}
          required
        />

        <NumberInput
          label={t('fuel.form.odometer')}
          value={form.odometer}
          onChange={(value) => setForm((s) => ({ ...s, odometer: Number(value || 0) }))}
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

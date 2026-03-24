import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core'
import { MonthPickerInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { FuelCreatePayload, FuelUpdatePayload } from '../api/fuelApi'
import type { Fuel } from '@entities/fleet/types'

type Mode = 'create' | 'edit'

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
  const now = useMemo(() => new Date(), [])
  const initial = useMemo(
    () => ({
      car: record ? String(record.car) : null as string | null,
      date: record
        ? new Date(record.year, (record.month || 1) - 1)
        : (now as Date | string),
      liters: record?.liters ?? 0,
      total_cost: record?.total_cost ?? 0,
      monthly_mileage: record?.monthly_mileage ?? 0,
    }),
    [record, now],
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
    if (!form.date) return

    const dateObj = form.date instanceof Date ? form.date : new Date(form.date)

    if (mode === 'edit' && record) {
      await onUpdate(record.id, {
        car: carId,
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        liters: form.liters,
        total_cost: form.total_cost,
        monthly_mileage: form.monthly_mileage,
      })
      onClose()
      return
    }

    const payload: FuelCreatePayload = {
      car: carId,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      liters: form.liters,
      total_cost: form.total_cost,
      monthly_mileage: form.monthly_mileage,
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

        <MonthPickerInput
          label={t('fuel.form.period')}
          placeholder={t('fuel.form.select_period')}
          value={form.date}
          onChange={(value) => {
            if (value) {
              setForm((s) => ({ ...s, date: value }))
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
          label={t('fuel.form.monthly_mileage')}
          value={form.monthly_mileage}
          onChange={(value) => setForm((s) => ({ ...s, monthly_mileage: Number(value || 0) }))}
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

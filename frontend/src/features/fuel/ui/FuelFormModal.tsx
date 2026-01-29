import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core'
import { MonthPickerInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { FuelCreatePayload } from '../api/fuelApi'

type Props = {
  opened: boolean
  onClose: () => void
  onCreate: (payload: FuelCreatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function FuelFormModal({ opened, onClose, onCreate, isSubmitting }: Props) {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const initial = useMemo(
    () => ({
      car: null as string | null,
      date: now,
      liters: 0,
      total_cost: 0,
      monthly_mileage: 0,
    }),
    [now],
  )

  const [form, setForm] = useState(initial)

  useEffect(() => {
    if (opened) setForm(initial)
  }, [initial, opened])

  const { data: carsData, isLoading: isCarsLoading, isError: isCarsError } = useCarsQuery({ page: 1 })
  const carOptions = useMemo(
    () =>
      (carsData?.results ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.numplate} (${c.brand})`,
      })),
    [carsData],
  )

  const submit = async () => {
    const carId = form.car ? Number(form.car) : NaN
    if (!carId || Number.isNaN(carId)) return
    if (!form.date) return

    const payload: FuelCreatePayload = {
      car: carId,
      year: form.date.getFullYear(),
      month: form.date.getMonth() + 1,
      liters: form.liters,
      total_cost: form.total_cost,
      monthly_mileage: form.monthly_mileage,
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('fuel.form.title')} centered>
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
          onChange={(value) => value && setForm((s) => ({ ...s, date: value }))}
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
            {t('common.create')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

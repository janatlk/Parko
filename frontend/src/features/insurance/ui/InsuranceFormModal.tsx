import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { InsuranceCreatePayload } from '../api/insuranceApi'

type Props = {
  opened: boolean
  onClose: () => void
  onCreate: (payload: InsuranceCreatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function InsuranceFormModal({ opened, onClose, onCreate, isSubmitting }: Props) {
  const { t } = useTranslation()
  const today = useMemo(() => new Date(), [])
  const initial = useMemo(
    () => ({
      car: null as string | null,
      insurance_type: 'OSAGO',
      number: '',
      start_date: today,
      end_date: today,
      cost: 0,
    }),
    [today],
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
    if (!form.number.trim()) return

    const payload: InsuranceCreatePayload = {
      car: carId,
      insurance_type: form.insurance_type,
      number: form.number.trim(),
      start_date: form.start_date.toISOString().slice(0, 10),
      end_date: form.end_date.toISOString().slice(0, 10),
      cost: form.cost,
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('insurances.form.title')} centered>
      <Stack>
        {isCarsLoading && <Text c="dimmed">{t('common.loading')}</Text>}
        {isCarsError && <Text c="red">{t('insurances.form.failed_to_load_cars')}</Text>}

        <Select
          label={t('insurances.form.car')}
          data={carOptions}
          value={form.car}
          onChange={(value) => setForm((s) => ({ ...s, car: value }))}
          required
          searchable
          disabled={isCarsLoading || isCarsError}
        />

        <Select
          label={t('insurances.form.type')}
          data={[
            { value: 'OSAGO', label: 'OSAGO' },
            { value: 'KASKO', label: 'KASKO' },
          ]}
          value={form.insurance_type}
          onChange={(value) => value && setForm((s) => ({ ...s, insurance_type: value }))}
          required
        />

        <TextInput
          label={t('insurances.form.number')}
          value={form.number}
          onChange={(e) => setForm((s) => ({ ...s, number: e.target.value }))}
          required
        />

        <DateInput
          label={t('insurances.form.start_date')}
          placeholder={t('insurances.form.start_date')}
          value={form.start_date}
          onChange={(value) => value && setForm((s) => ({ ...s, start_date: value }))}
          required
        />

        <DateInput
          label={t('insurances.form.end_date')}
          placeholder={t('insurances.form.end_date')}
          value={form.end_date}
          onChange={(value) => value && setForm((s) => ({ ...s, end_date: value }))}
          required
        />

        <NumberInput
          label={t('insurances.form.cost')}
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
            {t('common.create')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

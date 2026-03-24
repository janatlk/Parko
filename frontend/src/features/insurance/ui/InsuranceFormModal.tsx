import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { InsuranceCreatePayload, InsuranceUpdatePayload } from '../api/insuranceApi'
import type { Insurance } from '@entities/fleet/types'

type Mode = 'create' | 'edit'

type Props = {
  opened: boolean
  onClose: () => void
  mode: Mode
  record?: Insurance
  onCreate: (payload: InsuranceCreatePayload) => Promise<void>
  onUpdate: (insuranceId: number, payload: InsuranceUpdatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function InsuranceFormModal({
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
      insurance_type: record?.insurance_type ?? 'OSAGO',
      number: record?.number ?? '',
      start_date: record?.start_date
        ? new Date(record.start_date)
        : (today as Date | string),
      end_date: record?.end_date ? new Date(record.end_date) : (today as Date | string),
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

    const startDateObj = form.start_date instanceof Date ? form.start_date : new Date(form.start_date)
    const endDateObj = form.end_date instanceof Date ? form.end_date : new Date(form.end_date)

    if (mode === 'edit' && record) {
      await onUpdate(record.id, {
        car: carId,
        insurance_type: form.insurance_type,
        number: form.number.trim(),
        start_date: startDateObj.toISOString().slice(0, 10),
        end_date: endDateObj.toISOString().slice(0, 10),
        cost: form.cost,
      })
      onClose()
      return
    }

    const payload: InsuranceCreatePayload = {
      car: carId,
      insurance_type: form.insurance_type,
      number: form.number.trim(),
      start_date: startDateObj.toISOString().slice(0, 10),
      end_date: endDateObj.toISOString().slice(0, 10),
      cost: form.cost,
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? t('insurances.form.title') : t('insurances.form.edit_title')}
      centered
    >
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
          placeholder={t('insurances.form.start_date_placeholder')}
          value={form.start_date}
          onChange={(value) => {
            if (value) {
              setForm((s) => ({ ...s, start_date: value }))
            }
          }}
          required
        />

        <DateInput
          label={t('insurances.form.end_date')}
          placeholder={t('insurances.form.end_date_placeholder')}
          value={form.end_date}
          onChange={(value) => {
            if (value) {
              setForm((s) => ({ ...s, end_date: value }))
            }
          }}
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
            {mode === 'create' ? t('common.create') : t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

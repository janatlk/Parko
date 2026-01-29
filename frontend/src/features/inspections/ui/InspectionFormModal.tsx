import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { InspectionCreatePayload } from '../api/inspectionsApi'

type Props = {
  opened: boolean
  onClose: () => void
  onCreate: (payload: InspectionCreatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function InspectionFormModal({ opened, onClose, onCreate, isSubmitting }: Props) {
  const { t } = useTranslation()
  const today = useMemo(() => new Date(), [])
  const initial = useMemo(
    () => ({
      car: null as string | null,
      number: '',
      inspected_at: today,
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

    const payload: InspectionCreatePayload = {
      car: carId,
      number: form.number.trim(),
      inspected_at: form.inspected_at.toISOString().slice(0, 10),
      cost: form.cost,
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('inspections.form.title')} centered>
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
          placeholder={t('inspections.form.inspected_at')}
          value={form.inspected_at}
          onChange={(value) => value && setForm((s) => ({ ...s, inspected_at: value }))}
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
            {t('common.create')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

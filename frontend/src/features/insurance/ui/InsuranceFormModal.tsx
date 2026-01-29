import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { InsuranceCreatePayload } from '../api/insuranceApi'

type Props = {
  opened: boolean
  onClose: () => void
  onCreate: (payload: InsuranceCreatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function InsuranceFormModal({ opened, onClose, onCreate, isSubmitting }: Props) {
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
    <Modal opened={opened} onClose={onClose} title="Add insurance" centered>
      <Stack>
        {isCarsLoading && <Text c="dimmed">Loading cars...</Text>}
        {isCarsError && <Text c="red">Failed to load cars</Text>}

        <Select
          label="Car"
          data={carOptions}
          value={form.car}
          onChange={(value) => setForm((s) => ({ ...s, car: value }))}
          required
          searchable
          disabled={isCarsLoading || isCarsError}
        />

        <Select
          label="Type"
          data={[
            { value: 'OSAGO', label: 'OSAGO' },
            { value: 'KASKO', label: 'KASKO' },
          ]}
          value={form.insurance_type}
          onChange={(value) => value && setForm((s) => ({ ...s, insurance_type: value }))}
          required
        />

        <TextInput
          label="Number"
          value={form.number}
          onChange={(e) => setForm((s) => ({ ...s, number: e.target.value }))}
          required
        />

        <DateInput
          label="Start date"
          placeholder="Select date"
          value={form.start_date}
          onChange={(value) => value && setForm((s) => ({ ...s, start_date: value }))}
          required
        />

        <DateInput
          label="End date"
          placeholder="Select date"
          value={form.end_date}
          onChange={(value) => value && setForm((s) => ({ ...s, end_date: value }))}
          required
        />

        <NumberInput
          label="Cost"
          value={form.cost}
          onChange={(value) => setForm((s) => ({ ...s, cost: Number(value || 0) }))}
          min={0}
          required
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={isSubmitting}>
            Create
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

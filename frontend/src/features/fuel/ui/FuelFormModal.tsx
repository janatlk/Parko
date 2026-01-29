import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core'

import { useCarsQuery } from '@features/cars/hooks/useCars'

import type { FuelCreatePayload } from '../api/fuelApi'

type Props = {
  opened: boolean
  onClose: () => void
  onCreate: (payload: FuelCreatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function FuelFormModal({ opened, onClose, onCreate, isSubmitting }: Props) {
  const now = useMemo(() => new Date(), [])
  const initial = useMemo(
    () => ({
      car: null as string | null,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
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
    if (!form.year || !form.month) return

    const payload: FuelCreatePayload = {
      car: carId,
      year: form.year,
      month: form.month,
      liters: form.liters,
      total_cost: form.total_cost,
      monthly_mileage: form.monthly_mileage,
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add fuel record" centered>
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

        <NumberInput
          label="Year"
          value={form.year}
          onChange={(value) => setForm((s) => ({ ...s, year: Number(value || 0) }))}
          min={2000}
          max={2100}
          required
        />

        <NumberInput
          label="Month"
          value={form.month}
          onChange={(value) => setForm((s) => ({ ...s, month: Number(value || 0) }))}
          min={1}
          max={12}
          required
        />

        <NumberInput
          label="Liters"
          value={form.liters}
          onChange={(value) => setForm((s) => ({ ...s, liters: Number(value || 0) }))}
          min={0}
          required
        />

        <NumberInput
          label="Total cost"
          value={form.total_cost}
          onChange={(value) => setForm((s) => ({ ...s, total_cost: Number(value || 0) }))}
          min={0}
          required
        />

        <NumberInput
          label="Monthly mileage"
          value={form.monthly_mileage}
          onChange={(value) => setForm((s) => ({ ...s, monthly_mileage: Number(value || 0) }))}
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

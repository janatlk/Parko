import { useEffect, useMemo, useState } from 'react'

import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'

import type { Car, CarStatus } from '@entities/car/types'
import { CAR_STATUSES } from '@entities/car/types'

import type { CarCreatePayload } from '../api/carsApi'

type Props = {
  opened: boolean
  onClose: () => void
  onCreate: (payload: CarCreatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function CarFormModal({ opened, onClose, onCreate, isSubmitting }: Props) {
  const getInputValue = (valueOrEvent: unknown): string => {
    if (typeof valueOrEvent === 'string') return valueOrEvent
    if (valueOrEvent && typeof valueOrEvent === 'object') {
      const record = valueOrEvent as Record<string, unknown>
      const currentTarget = record.currentTarget as { value?: unknown } | undefined
      if (typeof currentTarget?.value === 'string') return currentTarget.value
      const target = record.target as { value?: unknown } | undefined
      if (typeof target?.value === 'string') return target.value
    }
    return ''
  }

  const initial = useMemo(
    () => ({
      region: '',
      brand: '',
      title: '',
      numplate: '',
      fueltype: '',
      type: '',
      driver: '-',
      fuel_card: '-',
      status: 'ACTIVE' as CarStatus,
    }),
    [],
  )

  const [form, setForm] = useState(initial)

  useEffect(() => {
    if (opened) setForm(initial)
  }, [initial, opened])

  const submit = async () => {
    if (!form.region.trim()) return
    if (!form.brand.trim()) return
    if (!form.title.trim()) return
    if (!form.numplate.trim()) return
    if (!form.fueltype.trim()) return
    if (!form.type.trim()) return

    const payload: CarCreatePayload = {
      region: form.region.trim(),
      brand: form.brand.trim(),
      title: form.title.trim(),
      numplate: form.numplate.trim(),
      fueltype: form.fueltype.trim(),
      type: form.type.trim(),
      driver: form.driver?.trim() ? form.driver.trim() : '-',
      fuel_card: form.fuel_card?.trim() ? form.fuel_card.trim() : '-',
      status: form.status as Car['status'],
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add car" centered>
      <Stack>
        <TextInput
          label="Region"
          value={form.region}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, region: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label="Brand"
          value={form.brand}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, brand: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label="Title"
          value={form.title}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, title: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label="Numplate"
          value={form.numplate}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, numplate: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label="Fuel type"
          value={form.fueltype}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, fueltype: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label="Vehicle type"
          value={form.type}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, type: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label="Driver"
          value={form.driver}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, driver: getInputValue(valueOrEvent) }))}
        />
        <TextInput
          label="Fuel card"
          value={form.fuel_card}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, fuel_card: getInputValue(valueOrEvent) }))}
        />
        <Select
          label="Status"
          data={CAR_STATUSES.map((s) => ({ value: s, label: s }))}
          value={form.status}
          onChange={(value) => value && setForm((s) => ({ ...s, status: value as CarStatus }))}
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

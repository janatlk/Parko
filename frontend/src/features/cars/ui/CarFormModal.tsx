import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'

import type { Car, CarStatus } from '@entities/car/types'
import { CAR_STATUSES } from '@entities/car/types'

import type { CarCreatePayload, CarUpdatePayload } from '../api/carsApi'

type Mode = 'create' | 'edit'

type Props = {
  opened: boolean
  onClose: () => void
  mode: Mode
  car?: Car
  onCreate: (payload: CarCreatePayload) => Promise<void>
  onUpdate: (carId: number, payload: CarUpdatePayload) => Promise<void>
  isSubmitting?: boolean
}

export function CarFormModal({
  opened,
  onClose,
  mode,
  car,
  onCreate,
  onUpdate,
  isSubmitting,
}: Props) {
  const { t } = useTranslation()
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
      region: car?.region ?? '',
      brand: car?.brand ?? '',
      title: car?.title ?? '',
      numplate: car?.numplate ?? '',
      fueltype: car?.fueltype ?? '',
      type: car?.type ?? '',
      driver: car?.driver ?? '-',
      fuel_card: car?.fuel_card ?? '-',
      status: car?.status ?? 'ACTIVE',
    }),
    [car],
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

    if (mode === 'edit' && car) {
      await onUpdate(car.id, {
        region: form.region.trim(),
        brand: form.brand.trim(),
        title: form.title.trim(),
        numplate: form.numplate.trim(),
        fueltype: form.fueltype.trim(),
        type: form.type.trim(),
        driver: form.driver?.trim() ? form.driver.trim() : '-',
        fuel_card: form.fuel_card?.trim() ? form.fuel_card.trim() : '-',
        status: form.status as Car['status'],
      })
      onClose()
      return
    }

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
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? t('cars.add') : t('cars.edit')}
      centered
    >
      <Stack>
        <TextInput
          label={t('cars.form.region')}
          value={form.region}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, region: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label={t('cars.form.brand')}
          value={form.brand}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, brand: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label={t('cars.form.title')}
          value={form.title}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, title: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label={t('cars.form.numplate')}
          value={form.numplate}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, numplate: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label={t('cars.form.fueltype')}
          value={form.fueltype}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, fueltype: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label={t('cars.form.type')}
          value={form.type}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, type: getInputValue(valueOrEvent) }))}
          required
        />
        <TextInput
          label={t('cars.form.driver')}
          value={form.driver}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, driver: getInputValue(valueOrEvent) }))}
        />
        <TextInput
          label={t('cars.form.fuel_card')}
          value={form.fuel_card}
          onChange={(valueOrEvent) => setForm((s) => ({ ...s, fuel_card: getInputValue(valueOrEvent) }))}
        />
        <Select
          label={t('cars.form.status')}
          data={CAR_STATUSES.map((s) => ({ value: s, label: s }))}
          value={form.status}
          onChange={(value) => value && setForm((s) => ({ ...s, status: value as CarStatus }))}
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

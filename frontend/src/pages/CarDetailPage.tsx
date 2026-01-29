import { useMemo } from 'react'

import { Badge, Container, Group, Tabs, Text, Title } from '@mantine/core'
import { useParams } from 'react-router-dom'

import { useCarQuery } from '@features/cars/hooks/useCars'

export function CarDetailPage() {
  const params = useParams()
  const carId = useMemo(() => Number(params.id), [params.id])

  const { data: car, isLoading, isError } = useCarQuery(carId)

  return (
    <Container>
      {isLoading && <Text c="dimmed">Loading...</Text>}
      {isError && <Text c="red">Failed to load car</Text>}

      {car && (
        <>
          <Group justify="space-between" align="center" mb="xs">
            <Title order={2}>
              {car.numplate} {car.brand} {car.title}
            </Title>
            <Badge>{car.status}</Badge>
          </Group>

          <Group gap="xl" mb="md">
            <Text size="sm" c="dimmed">
              Driver: {car.driver}
            </Text>
            <Text size="sm" c="dimmed">
              Region: {car.region}
            </Text>
            <Text size="sm" c="dimmed">
              Fuel type: {car.fueltype}
            </Text>
            <Text size="sm" c="dimmed">
              Vehicle type: {car.type}
            </Text>
          </Group>

          <Tabs defaultValue="info">
            <Tabs.List>
              <Tabs.Tab value="info">Info</Tabs.Tab>
              <Tabs.Tab value="fuel">Fuel</Tabs.Tab>
              <Tabs.Tab value="insurances">Insurances</Tabs.Tab>
              <Tabs.Tab value="inspections">Inspections</Tabs.Tab>
              <Tabs.Tab value="spares">Spares</Tabs.Tab>
              <Tabs.Tab value="tires">Tires</Tabs.Tab>
              <Tabs.Tab value="accumulators">Accumulators</Tabs.Tab>
              <Tabs.Tab value="photos">Photos</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="info" pt="sm">
              <Text c="dimmed">TODO: car details (FE-060.2)</Text>
            </Tabs.Panel>
            <Tabs.Panel value="fuel" pt="sm">
              <Text c="dimmed">TODO: fuel history</Text>
            </Tabs.Panel>
            <Tabs.Panel value="insurances" pt="sm">
              <Text c="dimmed">TODO: insurances</Text>
            </Tabs.Panel>
            <Tabs.Panel value="inspections" pt="sm">
              <Text c="dimmed">TODO: inspections</Text>
            </Tabs.Panel>
            <Tabs.Panel value="spares" pt="sm">
              <Text c="dimmed">TODO: spares</Text>
            </Tabs.Panel>
            <Tabs.Panel value="tires" pt="sm">
              <Text c="dimmed">TODO: tires</Text>
            </Tabs.Panel>
            <Tabs.Panel value="accumulators" pt="sm">
              <Text c="dimmed">TODO: accumulators</Text>
            </Tabs.Panel>
            <Tabs.Panel value="photos" pt="sm">
              <Text c="dimmed">TODO: photos</Text>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Container>
  )
}

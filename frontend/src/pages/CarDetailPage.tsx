import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Badge,
  Container,
  Group,
  Tabs,
  Text,
  Title,
  Table,
  ActionIcon,
  Paper,
  SimpleGrid,
  Image,
  Modal,
  Box,
  Button,
} from '@mantine/core'
import { IconTrash, IconDownload, IconExternalLink } from '@tabler/icons-react'
import { useParams } from 'react-router-dom'

import { useCarQuery } from '@features/cars/hooks/useCars'
import {
  useCarFuelQuery,
  useCarInsurancesQuery,
  useCarInspectionsQuery,
  useCarSparesQuery,
  useCarTiresQuery,
  useCarAccumulatorsQuery,
  useCarPhotosQuery,
  useDeletePhotoMutation,
} from '@features/cars/hooks/useCarDetail'

export function CarDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const carId = Number(params.id)

  const { data: car, isLoading: carLoading, isError: carError } = useCarQuery(carId)
  const { data: fuelData } = useCarFuelQuery(carId, 1)
  const { data: insuranceData } = useCarInsurancesQuery(carId, 1)
  const { data: inspectionData } = useCarInspectionsQuery(carId, 1)
  const { data: sparesData } = useCarSparesQuery(carId, 1)
  const { data: tiresData } = useCarTiresQuery(carId, 1)
  const { data: accumulatorsData } = useCarAccumulatorsQuery(carId, 1)
  const { data: photosData } = useCarPhotosQuery(carId)
  const deletePhoto = useDeletePhotoMutation(carId)

  const [activeTab, setActiveTab] = useState<string | null>('info')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green'
      case 'INACTIVE': return 'gray'
      case 'MAINTENANCE': return 'yellow'
      default: return 'gray'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDeletePhoto = (photoId: number) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      deletePhoto.mutate(photoId)
    }
  }

  if (carLoading) {
    return (
      <Container py="xl">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Container>
    )
  }

  if (carError || !car) {
    return (
      <Container py="xl">
        <Text c="red">{t('cars.loading_error') || 'Failed to load car'}</Text>
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" align="center" mb="lg">
        <div>
          <Title order={2}>
            {car.numplate} - {car.brand} {car.title}
          </Title>
          <Text size="sm" c="dimmed" mt="xs">
            VIN: {car.vin || 'N/A'} | Year: {car.year || 'N/A'}
          </Text>
        </div>
        <Badge color={getStatusColor(car.status)} size="lg" variant="filled">
          {car.status}
        </Badge>
      </Group>

      {/* Quick Info Cards */}
      <Paper withBorder shadow="sm" radius="md" p="md" mb="lg">
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
          <Box>
            <Text size="xs" c="dimmed">Driver</Text>
            <Text fw={500}>{car.driver || '-'}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">Region</Text>
            <Text fw={500}>{car.region}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">Fuel Type</Text>
            <Text fw={500}>{car.fueltype}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">Type</Text>
            <Text fw={500}>{car.type}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">Fuel Card</Text>
            <Text fw={500}>{car.fuel_card || '-'}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">Commissioned</Text>
            <Text fw={500}>{car.commissioned_at ? formatDate(car.commissioned_at) : 'N/A'}</Text>
          </Box>
        </SimpleGrid>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="info">{t('carDetail.info') || 'Info'}</Tabs.Tab>
          <Tabs.Tab value="fuel">{t('carDetail.fuel') || 'Fuel'}</Tabs.Tab>
          <Tabs.Tab value="insurances">{t('carDetail.insurances') || 'Insurances'}</Tabs.Tab>
          <Tabs.Tab value="inspections">{t('carDetail.inspections') || 'Inspections'}</Tabs.Tab>
          <Tabs.Tab value="spares">{t('carDetail.spares') || 'Spares'}</Tabs.Tab>
          <Tabs.Tab value="tires">{t('carDetail.tires') || 'Tires'}</Tabs.Tab>
          <Tabs.Tab value="accumulators">{t('carDetail.accumulators') || 'Accumulators'}</Tabs.Tab>
          <Tabs.Tab value="photos">{t('carDetail.photos') || 'Photos'}</Tabs.Tab>
        </Tabs.List>

        {/* Info Tab */}
        <Tabs.Panel value="info" pt="md">
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Title order={4} mb="md">{t('carDetail.general_info') || 'General Information'}</Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <InfoRow label={t('carDetail.numplate') || 'Numplate'} value={car.numplate} />
              <InfoRow label={t('carDetail.brand') || 'Brand'} value={car.brand} />
              <InfoRow label={t('carDetail.title') || 'Model'} value={car.title} />
              <InfoRow label={t('carDetail.year') || 'Year'} value={car.year?.toString() || 'N/A'} />
              <InfoRow label={t('carDetail.vin') || 'VIN'} value={car.vin || 'N/A'} />
              <InfoRow label={t('carDetail.fueltype') || 'Fuel Type'} value={car.fueltype} />
              <InfoRow label={t('carDetail.type') || 'Vehicle Type'} value={car.type} />
              <InfoRow label={t('carDetail.status') || 'Status'} value={car.status} />
              <InfoRow label={t('carDetail.driver') || 'Driver'} value={car.driver || '-'} />
              <InfoRow label={t('carDetail.drivers_phone') || 'Driver Phone'} value={car.drivers_phone || '-'} />
              <InfoRow label={t('carDetail.fuel_card') || 'Fuel Card'} value={car.fuel_card || '-'} />
              <InfoRow label={t('carDetail.region') || 'Region'} value={car.region} />
              <InfoRow label={t('carDetail.commissioned') || 'Commissioned'} value={car.commissioned_at ? formatDate(car.commissioned_at) : 'N/A'} />
            </SimpleGrid>
          </Paper>
        </Tabs.Panel>

        {/* Fuel Tab */}
        <Tabs.Panel value="fuel" pt="md">
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>{t('carDetail.fuel') || 'Fuel'}</Title>
              <Button
                component={Link}
                to="/fuel"
                variant="outline"
                size="xs"
                rightSection={<IconExternalLink size={14} />}
              >
                {t('common.see_all') || 'See all'}
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('fuel.table.period') || 'Period'}</Table.Th>
                  <Table.Th>{t('fuel.table.liters') || 'Liters'}</Table.Th>
                  <Table.Th>{t('fuel.table.mileage') || 'Mileage'}</Table.Th>
                  <Table.Th>{t('fuel.table.consumption') || 'Consumption'}</Table.Th>
                  <Table.Th>{t('fuel.table.total_cost') || 'Cost'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(fuelData?.results ?? []).map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>
                      {record.year}-{String(record.month).padStart(2, '0')} {record.month_name && `(${record.month_name})`}
                    </Table.Td>
                    <Table.Td>{record.liters} L</Table.Td>
                    <Table.Td>{record.monthly_mileage} km</Table.Td>
                    <Table.Td>{record.consumption} L/100km</Table.Td>
                    <Table.Td>{record.total_cost} som</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(!fuelData?.results || fuelData.results.length === 0) && (
              <Text c="dimmed" ta="center" py="xl">No fuel records</Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Insurances Tab */}
        <Tabs.Panel value="insurances" pt="md">
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>{t('carDetail.insurances') || 'Insurances'}</Title>
              <Button
                component={Link}
                to="/insurances"
                variant="outline"
                size="xs"
                rightSection={<IconExternalLink size={14} />}
              >
                {t('common.see_all') || 'See all'}
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('insurances.table.type') || 'Type'}</Table.Th>
                  <Table.Th>{t('insurances.table.number') || 'Number'}</Table.Th>
                  <Table.Th>{t('insurances.table.start') || 'Start'}</Table.Th>
                  <Table.Th>{t('insurances.table.end') || 'End'}</Table.Th>
                  <Table.Th>{t('insurances.table.cost') || 'Cost'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(insuranceData?.results ?? []).map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>{record.insurance_type}</Table.Td>
                    <Table.Td>{record.number}</Table.Td>
                    <Table.Td>{formatDate(record.start_date)}</Table.Td>
                    <Table.Td>{formatDate(record.end_date)}</Table.Td>
                    <Table.Td>{record.cost} som</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(!insuranceData?.results || insuranceData.results.length === 0) && (
              <Text c="dimmed" ta="center" py="xl">No insurance records</Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Inspections Tab */}
        <Tabs.Panel value="inspections" pt="md">
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>{t('carDetail.inspections') || 'Inspections'}</Title>
              <Button
                component={Link}
                to="/inspections"
                variant="outline"
                size="xs"
                rightSection={<IconExternalLink size={14} />}
              >
                {t('common.see_all') || 'See all'}
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('inspections.table.number') || 'Number'}</Table.Th>
                  <Table.Th>{t('inspections.table.date') || 'Date'}</Table.Th>
                  <Table.Th>{t('inspections.table.cost') || 'Cost'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(inspectionData?.results ?? []).map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>{record.number}</Table.Td>
                    <Table.Td>{formatDate(record.inspected_at)}</Table.Td>
                    <Table.Td>{record.cost} som</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(!inspectionData?.results || inspectionData.results.length === 0) && (
              <Text c="dimmed" ta="center" py="xl">No inspection records</Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Spares Tab */}
        <Tabs.Panel value="spares" pt="md">
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>{t('carDetail.spares') || 'Spares'}</Title>
              <Button
                component={Link}
                to="/spares"
                variant="outline"
                size="xs"
                rightSection={<IconExternalLink size={14} />}
              >
                {t('common.see_all') || 'See all'}
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('spares.table.title') || 'Part'}</Table.Th>
                  <Table.Th>{t('spares.table.description') || 'Description'}</Table.Th>
                  <Table.Th>{t('spares.table.part_price') || 'Part Price'}</Table.Th>
                  <Table.Th>{t('spares.table.job') || 'Job'}</Table.Th>
                  <Table.Th>{t('spares.table.job_price') || 'Job Price'}</Table.Th>
                  <Table.Th>{t('spares.table.total') || 'Total'}</Table.Th>
                  <Table.Th>{t('spares.table.date') || 'Installed'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(sparesData?.results ?? []).map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>{record.title}</Table.Td>
                    <Table.Td>{record.description || '-'}</Table.Td>
                    <Table.Td>{record.part_price} som</Table.Td>
                    <Table.Td>{record.job_description || '-'}</Table.Td>
                    <Table.Td>{record.job_price} som</Table.Td>
                    <Table.Td>{record.part_price + record.job_price} som</Table.Td>
                    <Table.Td>{formatDate(record.installed_at)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(!sparesData?.results || sparesData.results.length === 0) && (
              <Text c="dimmed" ta="center" py="xl">No spare parts records</Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Tires Tab */}
        <Tabs.Panel value="tires" pt="md">
          <Paper withBorder shadow="sm" radius="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('tires.table.model') || 'Model'}</Table.Th>
                  <Table.Th>{t('tires.table.size') || 'Size'}</Table.Th>
                  <Table.Th>{t('tires.table.price') || 'Price'}</Table.Th>
                  <Table.Th>{t('tires.table.installed') || 'Installed'}</Table.Th>
                  <Table.Th>{t('tires.table.expires') || 'Expires'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(tiresData?.results ?? []).map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>{record.model}</Table.Td>
                    <Table.Td>{record.size}</Table.Td>
                    <Table.Td>{record.price} som</Table.Td>
                    <Table.Td>{formatDate(record.installed_at)}</Table.Td>
                    <Table.Td>{record.expires_at ? formatDate(record.expires_at) : 'N/A'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(!tiresData?.results || tiresData.results.length === 0) && (
              <Text c="dimmed" ta="center" py="xl">No tire records</Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Accumulators Tab */}
        <Tabs.Panel value="accumulators" pt="md">
          <Paper withBorder shadow="sm" radius="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('accumulators.table.model') || 'Model'}</Table.Th>
                  <Table.Th>{t('accumulators.table.serial') || 'Serial'}</Table.Th>
                  <Table.Th>{t('accumulators.table.capacity') || 'Capacity'}</Table.Th>
                  <Table.Th>{t('accumulators.table.price') || 'Price'}</Table.Th>
                  <Table.Th>{t('accumulators.table.installed') || 'Installed'}</Table.Th>
                  <Table.Th>{t('accumulators.table.expires') || 'Expires'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(accumulatorsData?.results ?? []).map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>{record.model}</Table.Td>
                    <Table.Td>{record.serial_number || '-'}</Table.Td>
                    <Table.Td>{record.capacity}</Table.Td>
                    <Table.Td>{record.price} som</Table.Td>
                    <Table.Td>{formatDate(record.installed_at)}</Table.Td>
                    <Table.Td>{record.expires_at ? formatDate(record.expires_at) : 'N/A'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(!accumulatorsData?.results || accumulatorsData.results.length === 0) && (
              <Text c="dimmed" ta="center" py="xl">No accumulator records</Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Photos Tab */}
        <Tabs.Panel value="photos" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {(photosData ?? []).map((photo) => (
              <Paper key={photo.id} withBorder shadow="sm" radius="md" p="xs">
                <Image
                  src={photo.image}
                  alt={photo.comment || 'Car photo'}
                  height={200}
                  fit="cover"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedPhoto(photo.image)}
                />
                {photo.comment && (
                  <Text size="sm" mt="xs" ta="center">{photo.comment}</Text>
                )}
                <Group justify="center" mt="sm">
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => handleDeletePhoto(photo.id)}
                    loading={deletePhoto.isPending}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    component="a"
                    href={photo.image}
                    target="_blank"
                  >
                    <IconDownload size={16} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
          {(!photosData || photosData.length === 0) && (
            <Text c="dimmed" ta="center" py="xl">No photos</Text>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Photo Modal */}
      <Modal
        opened={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        size="auto"
        centered
      >
        {selectedPhoto && <Image src={selectedPhoto} alt="Full size" />}
      </Modal>
    </Container>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text fw={500}>{value}</Text>
    </Box>
  )
}

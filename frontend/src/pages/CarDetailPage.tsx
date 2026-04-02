import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
  rem,
} from '@mantine/core'
import {
  IconCar,
  IconGasStation,
  IconFileDescription,
  IconClipboardCheck,
  IconTools,
  IconPhoto,
  IconEdit,
  IconExternalLink,
} from '@tabler/icons-react'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useCarQuery, useUpdateCarMutation } from '@features/cars/hooks/useCars'
import {
  useCarFuelQuery,
  useCarInsurancesQuery,
  useCarInspectionsQuery,
  useCarSparesQuery,
  useCarPhotosQuery,
  useDeletePhotoMutation,
} from '@features/cars/hooks/useCarDetail'
import { CarFormModal } from '@features/cars/ui/CarFormModal'
import type { Car } from '@entities/car/types'
import { canEditCars } from '@shared/lib/permissions'
import { PermissionGuard } from '@shared/ui/PermissionGuard'
import { ModernTable, ModernTableRow, TableCell, TableCellBadge } from '@shared/ui/ModernTable'
import { formatPrice } from '@shared/utils/formatPrice'

export function CarDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const carId = Number(params.id)
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'
  const canEdit = canEditCars(user)

  const { data: car, isLoading: carLoading, isError: carError } = useCarQuery(carId)
  const { data: fuelData } = useCarFuelQuery(carId, 1)
  const { data: insuranceData } = useCarInsurancesQuery(carId, 1)
  const { data: inspectionData } = useCarInspectionsQuery(carId, 1)
  const { data: sparesData } = useCarSparesQuery(carId, 1)
  const { data: photosData } = useCarPhotosQuery(carId)
  const deletePhoto = useDeletePhotoMutation(carId)
  const updateCarMutation = useUpdateCarMutation()

  const [activeTab, setActiveTab] = useState<string>('info')
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | undefined>(undefined)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green'
      case 'INACTIVE':
        return 'gray'
      case 'MAINTENANCE':
        return 'yellow'
      default:
        return 'gray'
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

  const openEditModal = () => {
    if (car) {
      setSelectedCar(car)
      setEditModalOpened(true)
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
      <Group justify="space-between" align="flex-start" mb="xl">
        <Stack gap="xs">
          <Group gap="md" wrap="nowrap">
            <Title order={1} style={{ whiteSpace: 'nowrap' }}>
              {car.numplate}
            </Title>
            <Text size="xl" c="dimmed">
              {car.brand} {car.title}
            </Text>
          </Group>
          <Group gap="lg">
            <Text size="sm" c="dimmed">
              VIN: {car.vin || '—'}
            </Text>
            <Text size="sm" c="dimmed">
              {t('carDetail.year')}: {car.year || '—'}
            </Text>
            <Text size="sm" c="dimmed">
              {t('carDetail.commissioned')}: {car.commissioned_at ? formatDate(car.commissioned_at) : '—'}
            </Text>
          </Group>
        </Stack>

        <Group gap="sm">
          <PermissionGuard canAccess={canEdit} mode="disable">
            <Button
              variant="outline"
              leftSection={<IconEdit size={rem(18)} />}
              onClick={openEditModal}
            >
              {t('common.edit')}
            </Button>
          </PermissionGuard>
          <Badge color={getStatusColor(car.status)} size="lg" variant="filled">
            {car.status}
          </Badge>
        </Group>
      </Group>

      {/* Info Cards */}
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="md" mb="xl">
        <InfoCard label={t('carDetail.region')} value={car.region} />
        <InfoCard label={t('carDetail.driver')} value={car.driver || '—'} />
        <InfoCard label={t('carDetail.fueltype')} value={car.fueltype} />
        <InfoCard label={t('carDetail.type')} value={car.type} />
        <InfoCard label={t('carDetail.fuel_card')} value={car.fuel_card || '—'} />
        <InfoCard label={t('carDetail.drivers_phone')} value={car.drivers_phone || '—'} />
      </SimpleGrid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'info')}>
        <Tabs.List grow>
          <Tabs.Tab value="info" leftSection={<IconCar size={16} />}>
            {t('carDetail.info')}
          </Tabs.Tab>
          <Tabs.Tab
            value="fuel"
            leftSection={<IconGasStation size={16} />}
            rightSection={
              fuelData?.count ? (
                <Badge size="sm" variant="light">
                  {fuelData.count}
                </Badge>
              ) : null
            }
          >
            {t('carDetail.fuel')}
          </Tabs.Tab>
          <Tabs.Tab
            value="insurances"
            leftSection={<IconFileDescription size={16} />}
            rightSection={
              insuranceData?.count ? (
                <Badge size="sm" variant="light">
                  {insuranceData.count}
                </Badge>
              ) : null
            }
          >
            {t('carDetail.insurances')}
          </Tabs.Tab>
          <Tabs.Tab
            value="inspections"
            leftSection={<IconClipboardCheck size={16} />}
            rightSection={
              inspectionData?.count ? (
                <Badge size="sm" variant="light">
                  {inspectionData.count}
                </Badge>
              ) : null
            }
          >
            {t('carDetail.inspections')}
          </Tabs.Tab>
          <Tabs.Tab
            value="spares"
            leftSection={<IconTools size={16} />}
            rightSection={
              sparesData?.count ? (
                <Badge size="sm" variant="light">
                  {sparesData.count}
                </Badge>
              ) : null
            }
          >
            {t('carDetail.spares')}
          </Tabs.Tab>
          <Tabs.Tab
            value="photos"
            leftSection={<IconPhoto size={16} />}
            rightSection={
              photosData?.length ? (
                <Badge size="sm" variant="light">
                  {photosData.length}
                </Badge>
              ) : null
            }
          >
            {t('carDetail.photos')}
          </Tabs.Tab>
        </Tabs.List>

        {/* Info Tab */}
        <Tabs.Panel value="info" pt="md">
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Title order={4} mb="md">
              {t('carDetail.general_info')}
            </Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <InfoRow label={t('carDetail.numplate')} value={car.numplate} />
              <InfoRow label={t('carDetail.brand')} value={car.brand} />
              <InfoRow label={t('carDetail.title')} value={car.title} />
              <InfoRow label={t('carDetail.year')} value={car.year?.toString() || '—'} />
              <InfoRow label={t('carDetail.vin')} value={car.vin || '—'} />
              <InfoRow label={t('carDetail.fueltype')} value={car.fueltype} />
              <InfoRow label={t('carDetail.type')} value={car.type} />
              <InfoRow label={t('carDetail.status')} value={car.status} />
              <InfoRow label={t('carDetail.driver')} value={car.driver || '—'} />
              <InfoRow label={t('carDetail.drivers_phone')} value={car.drivers_phone || '—'} />
              <InfoRow label={t('carDetail.fuel_card')} value={car.fuel_card || '—'} />
              <InfoRow label={t('carDetail.region')} value={car.region} />
              <InfoRow label={t('carDetail.commissioned')} value={car.commissioned_at ? formatDate(car.commissioned_at) : '—'} />
            </SimpleGrid>
          </Paper>
        </Tabs.Panel>

        {/* Fuel Tab */}
        <Tabs.Panel value="fuel" pt="md">
          <FuelTable data={fuelData} />
        </Tabs.Panel>

        {/* Insurances Tab */}
        <Tabs.Panel value="insurances" pt="md">
          <InsurancesTable data={insuranceData} />
        </Tabs.Panel>

        {/* Inspections Tab */}
        <Tabs.Panel value="inspections" pt="md">
          <InspectionsTable data={inspectionData} />
        </Tabs.Panel>

        {/* Spares Tab */}
        <Tabs.Panel value="spares" pt="md">
          <SparesTable data={sparesData} />
        </Tabs.Panel>

        {/* Photos Tab */}
        <Tabs.Panel value="photos" pt="md">
          <PhotosTable data={photosData} deletePhoto={deletePhoto} handleDeletePhoto={handleDeletePhoto} />
        </Tabs.Panel>
      </Tabs>

      {/* Edit Car Modal */}
      <CarFormModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        mode="edit"
        car={selectedCar}
        onCreate={async () => {}}
        onUpdate={async (carId, payload) => {
          await updateCarMutation.mutateAsync({ carId, payload })
          setEditModalOpened(false)
        }}
        isSubmitting={updateCarMutation.isPending}
      />
    </Container>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Text size="xs" c="dimmed" mb="xs">
        {label}
      </Text>
      <Text fw={500} size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </Text>
    </Paper>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" mb={4}>
        {label}
      </Text>
      <Text fw={500} size="sm">
        {value}
      </Text>
    </Box>
  )
}

function FuelTable({ data }: { data: any }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('carDetail.fuel')}</Title>
        <Button
          component={Link}
          to="/fuel"
          variant="outline"
          size="xs"
          rightSection={<IconExternalLink size={14} />}
        >
          {t('common.see_all')}
        </Button>
      </Group>
      <ModernTable
        columns={[
          { key: 'period', title: t('fuel.table.period'), width: 140 },
          { key: 'liters', title: t('fuel.table.liters'), width: 100 },
          { key: 'mileage', title: t('fuel.table.mileage'), width: 120 },
          { key: 'consumption', title: t('fuel.table.consumption'), width: 130 },
          { key: 'cost', title: t('fuel.table.total_cost'), width: 120 },
        ]}
        data={data?.results ?? []}
        renderRow={(record) => (
          <ModernTableRow
            key={record.id}
            cells={[
              <TableCell key="period" fw={500}>
                {record.year}-{String(record.month).padStart(2, '0')}{' '}
                {record.month_name && <Text component="span" c="dimmed" size="xs">({record.month_name})</Text>}
              </TableCell>,
              <TableCell key="liters">{record.liters} L</TableCell>,
              <TableCell key="mileage">{record.monthly_mileage} km</TableCell>,
              <TableCell key="consumption">{record.consumption} L/100km</TableCell>,
              <TableCell key="cost" fw={500}>{formatPrice(record.total_cost, currency)}</TableCell>,
            ]}
          />
        )}
        emptyMessage={t('common.no_data')}
      />
    </Paper>
  )
}

function InsurancesTable({ data }: { data: any }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('carDetail.insurances')}</Title>
        <Button
          component={Link}
          to="/insurances"
          variant="outline"
          size="xs"
          rightSection={<IconExternalLink size={14} />}
        >
          {t('common.see_all')}
        </Button>
      </Group>
      <ModernTable
        columns={[
          { key: 'type', title: t('insurances.table.type'), width: 140 },
          { key: 'number', title: t('insurances.table.number'), width: 140 },
          { key: 'start', title: t('insurances.table.start'), width: 130 },
          { key: 'end', title: t('insurances.table.end'), width: 130 },
          { key: 'cost', title: t('insurances.table.cost'), width: 120 },
        ]}
        data={data?.results ?? []}
        renderRow={(record) => (
          <ModernTableRow
            key={record.id}
            cells={[
              <TableCellBadge key="type" color="blue">{record.insurance_type}</TableCellBadge>,
              <TableCell key="number" fw={500}>{record.number}</TableCell>,
              <TableCell key="start">{formatDate(record.start_date)}</TableCell>,
              <TableCell key="end">{formatDate(record.end_date)}</TableCell>,
              <TableCell key="cost" fw={500}>{formatPrice(record.cost, currency)}</TableCell>,
            ]}
          />
        )}
        emptyMessage={t('common.no_data')}
      />
    </Paper>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function InspectionsTable({ data }: { data: any }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('carDetail.inspections')}</Title>
        <Button
          component={Link}
          to="/inspections"
          variant="outline"
          size="xs"
          rightSection={<IconExternalLink size={14} />}
        >
          {t('common.see_all')}
        </Button>
      </Group>
      <ModernTable
        columns={[
          { key: 'number', title: t('inspections.table.number'), width: 140 },
          { key: 'date', title: t('inspections.table.date'), width: 140 },
          { key: 'cost', title: t('inspections.table.cost'), width: 120 },
        ]}
        data={data?.results ?? []}
        renderRow={(record) => (
          <ModernTableRow
            key={record.id}
            cells={[
              <TableCell key="number" fw={500}>{record.number}</TableCell>,
              <TableCell key="date">{formatDate(record.inspected_at)}</TableCell>,
              <TableCell key="cost" fw={500}>{formatPrice(record.cost, currency)}</TableCell>,
            ]}
          />
        )}
        emptyMessage={t('common.no_data')}
      />
    </Paper>
  )
}

function SparesTable({ data }: { data: any }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('carDetail.spares')}</Title>
        <Button
          component={Link}
          to="/spares"
          variant="outline"
          size="xs"
          rightSection={<IconExternalLink size={14} />}
        >
          {t('common.see_all')}
        </Button>
      </Group>
      <ModernTable
        columns={[
          { key: 'title', title: t('spares.table.title'), width: 180 },
          { key: 'description', title: t('spares.table.description'), width: 200 },
          { key: 'part_price', title: t('spares.table.part_price'), width: 100 },
          { key: 'job', title: t('spares.table.job'), width: 140 },
          { key: 'job_price', title: t('spares.table.job_price'), width: 100 },
          { key: 'total', title: t('spares.table.total'), width: 100 },
          { key: 'date', title: t('spares.table.date'), width: 120 },
        ]}
        data={data?.results ?? []}
        renderRow={(record) => (
          <ModernTableRow
            key={record.id}
            cells={[
              <TableCell key="title" fw={500}>{record.title}</TableCell>,
              <TableCell key="description">{record.description || '—'}</TableCell>,
              <TableCell key="part_price">{formatPrice(record.part_price, currency)}</TableCell>,
              <TableCell key="job">{record.job_description || '—'}</TableCell>,
              <TableCell key="job_price">{formatPrice(record.job_price, currency)}</TableCell>,
              <TableCell key="total" fw={500}>{formatPrice(record.part_price + record.job_price, currency)}</TableCell>,
              <TableCell key="date">{formatDate(record.installed_at)}</TableCell>,
            ]}
          />
        )}
        emptyMessage={t('common.no_data')}
      />
    </Paper>
  )
}

function PhotosTable({ data, deletePhoto, handleDeletePhoto }: { data: any; deletePhoto: any; handleDeletePhoto: (id: number) => void }) {
  const { t } = useTranslation()

  if (!data || data.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl" style={{ textAlign: 'center' }}>
        <Text c="dimmed" size="sm">
          {t('common.no_data')}
        </Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>{t('carDetail.photos')}</Title>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
        {data.map((photo: any) => (
          <Paper key={photo.id} withBorder radius="md" p="xs">
            <Box
              component="img"
              src={photo.image}
              alt={photo.comment || 'Car photo'}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            />
            {photo.comment && (
              <Text size="sm" mt="xs" ta="center" c="dimmed">
                {photo.comment}
              </Text>
            )}
            <Group justify="center" mt="sm" gap="xs">
              <Button
                variant="light"
                color="red"
                size="compact-sm"
                onClick={() => handleDeletePhoto(photo.id)}
                loading={deletePhoto.isPending}
              >
                Delete
              </Button>
              <Button
                variant="light"
                color="blue"
                size="compact-sm"
                component="a"
                href={photo.image}
                target="_blank"
              >
                Download
              </Button>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </Paper>
  )
}

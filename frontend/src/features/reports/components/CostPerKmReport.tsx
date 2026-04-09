import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Loader,
  Alert,
} from '@mantine/core'
import {
  IconDownload,
  IconDeviceFloppy,
  IconFileDescription,
  IconFileExport,
  IconFileCode,
  IconShare,
  IconAt,
  IconAlertCircle,
  IconCheck,
  IconTable,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import type {
  CostPerKmReportResponse,
  CostPerKmVehicle,
  CostPerKmParams,
} from '@features/reports/api/reportsApi'
import {
  getCostPerKmReport,
  createSavedReport,
  shareReportViaEmail,
} from '@features/reports/api/reportsApi'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

const COST_COLORS = {
  fuel: '#3b82f6',
  maintenance: '#14b8a6',
  insurance: '#8b5cf6',
  inspection: '#f97316',
  total: '#10b981',
}

type CostPerKmReportProps = {
  data: CostPerKmReportResponse
  onExport?: (format: 'csv' | 'xlsx' | 'pdf') => void
}

export function CostPerKmReport({ data, onExport }: CostPerKmReportProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  const [saveModalOpened, setSaveModalOpened] = useState(false)
  const [shareModalOpened, setShareModalOpened] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { summary, by_vehicle } = data

  const handleSave = async () => {
    if (!data) return
    setIsSaving(true)
    try {
      await createSavedReport({
        name: `Cost per Km — ${summary.vehicle_count} vehicles`,
        report_type: 'cost_per_km',
        from_date: data.filters.start_date || '',
        to_date: data.filters.end_date || '',
        car_ids: data.filters.vehicle_ids,
        filters: {},
        summary: {
          total_cost: summary.total_cost,
          total_distance: summary.total_distance,
          avg_cost_per_km: summary.avg_cost_per_km,
          vehicle_count: summary.vehicle_count,
        },
      })
      notifications.show({
        title: t('reports.report_saved') || 'Report Saved',
        message: t('reports.report_saved_message') || 'Your report has been saved successfully',
        icon: <IconCheck />,
        color: 'green',
      })
      setSaveModalOpened(false)
    } catch {
      notifications.show({
        title: t('reports.save_failed') || 'Save Failed',
        message: t('reports.save_failed_message') || 'Failed to save the report',
        icon: <IconAlertCircle />,
        color: 'red',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (onExport) {
      onExport(format)
      return
    }
    setIsExporting(true)
    try {
      const params: CostPerKmParams = {
        start_date: data.filters.start_date || undefined,
        end_date: data.filters.end_date || undefined,
        vehicle_ids: data.filters.vehicle_ids?.join(','),
        export: format as 'csv' | 'xlsx',
      }
      const result = await getCostPerKmReport(params)
      const ext = format === 'xlsx' ? 'xlsx' : format === 'csv' ? 'csv' : 'json'
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cost_per_km_${Date.now()}.${ext}`
      link.click()
      window.URL.revokeObjectURL(url)
      notifications.show({
        title: t('reports.export_success') || 'Export Successful',
        message: t('reports.export_success_message') || 'Your report has been downloaded',
        icon: <IconCheck />,
        color: 'green',
      })
    } catch {
      notifications.show({
        title: t('reports.export_failed') || 'Export Failed',
        message: t('reports.export_failed_message') || 'Failed to export the report',
        icon: <IconAlertCircle />,
        color: 'red',
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (!data) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
      </Box>
    )
  }

  return (
    <Stack gap="md">
      {/* Action Buttons */}
      <Group justify="flex-end">
        <Button
          variant="outline"
          size="sm"
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={() => setSaveModalOpened(true)}
        >
          {t('reports.save_report') || 'Save Report'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftSection={<IconShare size={16} />}
          onClick={() => setShareModalOpened(true)}
        >
          {t('reports.share_email') || 'Share'}
        </Button>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconFileExport size={16} />}
              loading={isExporting}
            >
              {t('reports.export_as') || 'Export As'}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconFileCode size={16} />}
              onClick={() => handleExport('csv')}
            >
              {t('reports.export_csv') || 'CSV'}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload size={16} />}
              onClick={() => handleExport('xlsx')}
            >
              {t('reports.export_xlsx') || 'Excel (XLSX)'}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFileDescription size={16} />}
              onClick={() => handleExport('pdf')}
            >
              {t('reports.export_pdf') || 'PDF'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <SummaryCard
          label={t('reports.cost_per_km.total_cost')}
          value={formatPrice(summary.total_cost, currency)}
        />
        <SummaryCard
          label={t('reports.cost_per_km.total_distance')}
          value={`${summary.total_distance.toLocaleString()} km`}
        />
        <SummaryCard
          label={t('reports.cost_per_km.avg_cost_per_km')}
          value={formatPrice(summary.avg_cost_per_km, currency)}
        />
        <SummaryCard
          label={t('reports.cost_per_km.vehicle_count')}
          value={summary.vehicle_count.toString()}
        />
      </SimpleGrid>

      {/* Charts */}
      {by_vehicle.length > 0 && (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          <CostBreakdownChart vehicles={by_vehicle} currency={currency} t={t} />
          <CostPerKmChart vehicles={by_vehicle} currency={currency} t={t} />
        </SimpleGrid>
      )}

      {/* Vehicle Table */}
      <Paper withBorder radius="md" p="md" shadow="sm">
        <Group justify="space-between" mb="md">
          <Title order={4}>{t('reports.cost_per_km.vehicle_breakdown')}</Title>
          <IconTable size={20} color="#666" />
        </Group>

        {by_vehicle.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {t('common.no_data')}
          </Text>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('reports.cost_per_km.vehicle')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.fuel_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.maintenance_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.insurance_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.inspection_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.total_cost')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.total_distance')}</Table.Th>
                <Table.Th>{t('reports.cost_per_km.cost_per_km')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {by_vehicle.map((vehicle) => (
                <Table.Tr key={vehicle.vehicle_id}>
                  <Table.Td fw={500}>
                    {vehicle.brand} {vehicle.model} ({vehicle.numplate})
                  </Table.Td>
                  <Table.Td>{formatPrice(vehicle.fuel_cost, currency)}</Table.Td>
                  <Table.Td>{formatPrice(vehicle.maintenance_cost, currency)}</Table.Td>
                  <Table.Td>{formatPrice(vehicle.insurance_cost, currency)}</Table.Td>
                  <Table.Td>{formatPrice(vehicle.inspection_cost, currency)}</Table.Td>
                  <Table.Td fw={600}>{formatPrice(vehicle.total_cost, currency)}</Table.Td>
                  <Table.Td>{vehicle.total_distance.toLocaleString()} km</Table.Td>
                  <Table.Td fw={700}>{formatPrice(vehicle.cost_per_km, currency)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Save Report Modal */}
      <SaveModal
        opened={saveModalOpened}
        onClose={() => setSaveModalOpened(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Share Report Modal */}
      <ShareModal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        data={data}
      />
    </Stack>
  )
}

/* ------------------------------------------------------------------ */
/* Chart 1: Stacked bar — cost breakdown by vehicle                   */
/* ------------------------------------------------------------------ */

function CostBreakdownChart({
  vehicles,
  currency,
  t,
}: {
  vehicles: CostPerKmVehicle[]
  currency: string
  t: (key: string) => string
}) {
  const chartData = vehicles.map((v) => ({
    name: `${v.brand} ${v.numplate}`,
    [t('reports.cost_per_km.fuel_cost')]: v.fuel_cost,
    [t('reports.cost_per_km.maintenance_cost')]: v.maintenance_cost,
    [t('reports.cost_per_km.insurance_cost')]: v.insurance_cost,
    [t('reports.cost_per_km.inspection_cost')]: v.inspection_cost,
  }))

  const fuelKey = t('reports.cost_per_km.fuel_cost')
  const maintKey = t('reports.cost_per_km.maintenance_cost')
  const insKey = t('reports.cost_per_km.insurance_cost')
  const inspKey = t('reports.cost_per_km.inspection_cost')

  return (
    <Paper withBorder radius="md" p="md" shadow="sm">
      <Title order={5} mb="md" ta="center">
        {t('reports.cost_per_km.cost_breakdown') || 'Cost Breakdown'}
      </Title>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatPriceShort(v, currency)} />
          <Tooltip
            formatter={(value) => formatPrice(value as number, currency)}
            cursor={{ fill: 'rgba(59,130,246,0.06)' }}
          />
          <Legend />
          <Bar dataKey={fuelKey} stackId="a" fill={COST_COLORS.fuel} name={fuelKey} radius={[0, 0, 0, 0]} />
          <Bar dataKey={maintKey} stackId="a" fill={COST_COLORS.maintenance} name={maintKey} />
          <Bar dataKey={insKey} stackId="a" fill={COST_COLORS.insurance} name={insKey} />
          <Bar dataKey={inspKey} stackId="a" fill={COST_COLORS.inspection} name={inspKey} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  )
}

/* ------------------------------------------------------------------ */
/* Chart 2: Cost per km for each vehicle                              */
/* ------------------------------------------------------------------ */

function CostPerKmChart({
  vehicles,
  currency,
  t,
}: {
  vehicles: CostPerKmVehicle[]
  currency: string
  t: (key: string) => string
}) {
  const chartData = vehicles.map((v) => ({
    name: `${v.brand} ${v.numplate}`,
    [t('reports.cost_per_km.cost_per_km')]: v.cost_per_km,
  }))

  const cpkKey = t('reports.cost_per_km.cost_per_km')

  return (
    <Paper withBorder radius="md" p="md" shadow="sm">
      <Title order={5} mb="md" ta="center">
        {t('reports.cost_per_km.cost_per_km_chart') || 'Cost per Kilometer'}
      </Title>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatPriceShort(v, currency)} />
          <Tooltip
            formatter={(value) => formatPrice(value as number, currency)}
            cursor={{ fill: 'rgba(59,130,246,0.06)' }}
          />
          <Legend />
          <Bar dataKey={cpkKey} fill={COST_COLORS.total} name={cpkKey} radius={[6, 6, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index % 4 === 0 ? '#3b82f6' :
                  index % 4 === 1 ? '#14b8a6' :
                  index % 4 === 2 ? '#8b5cf6' :
                  '#f97316'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  )
}

/* ------------------------------------------------------------------ */
/* Save Modal (inline, no external dependency)                        */
/* ------------------------------------------------------------------ */

function SaveModal({
  opened,
  onClose,
  onSave,
  isSaving,
}: {
  opened: boolean
  onClose: () => void
  onSave: () => void
  isSaving: boolean
}) {
  const { t } = useTranslation()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('reports.save_report_title') || 'Save Report'}
      centered
    >
      <Stack>
        <Alert variant="light" color="blue" icon={<IconDeviceFloppy size={16} />}>
          <Text size="sm">{t('reports.cost_per_km.title') || 'Cost per Km Report'}</Text>
        </Alert>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSave}
            loading={isSaving}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            {t('reports.save_report') || 'Save Report'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Share Modal (inline)                                               */
/* ------------------------------------------------------------------ */

function ShareModal({
  opened,
  onClose,
  data,
}: {
  opened: boolean
  onClose: () => void
  data: CostPerKmReportResponse
}) {
  const { t } = useTranslation()
  const [recipientEmail, setRecipientEmail] = useState('')
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleShare = async () => {
    if (!recipientEmail) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      notifications.show({
        title: t('reports.invalid_email') || 'Invalid Email',
        message: 'Please enter a valid email address',
        icon: <IconAlertCircle />,
        color: 'orange',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await shareReportViaEmail({
        report_type: 'cost_per_km',
        from_date: data.filters.start_date || '',
        to_date: data.filters.end_date || '',
        recipient_email: recipientEmail,
        format,
      })
      notifications.show({
        title: t('reports.share_email_success') || 'Report Sent',
        message: `Report sent to ${recipientEmail}`,
        icon: <IconShare />,
        color: 'green',
      })
      setRecipientEmail('')
      onClose()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('reports.share_email_failed') || 'Failed to send report'
      notifications.show({
        title: t('reports.share_email_failed') || 'Failed to Send',
        message,
        icon: <IconAlertCircle />,
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => { setRecipientEmail(''); onClose() }}
      title={t('reports.share_email_title') || 'Share Report via Email'}
      centered
    >
      <Stack>
        <Alert variant="light" color="blue" icon={<IconAt size={16} />}>
          <Text size="sm" fw={500}>{t('reports.cost_per_km.title') || 'Cost per Km Report'}</Text>
          <Text size="xs" c="dimmed" mt="xs">
            {data.filters.start_date || '—'} — {data.filters.end_date || '—'}
          </Text>
        </Alert>

        <TextInput
          label={t('reports.share_email') || 'Recipient Email'}
          placeholder={t('reports.share_email_placeholder') || 'Enter recipient email'}
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.currentTarget.value)}
          type="email"
          leftSection={<IconAt size={16} />}
          required
        />

        <SimpleGrid cols={3} spacing="xs">
          {(['csv', 'xlsx', 'pdf'] as const).map((f) => (
            <Button
              key={f}
              variant={format === f ? 'filled' : 'outline'}
              size="xs"
              fullWidth
              onClick={() => setFormat(f)}
            >
              {f.toUpperCase()}
            </Button>
          ))}
        </SimpleGrid>

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => { setRecipientEmail(''); onClose() }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleShare}
            loading={isSubmitting}
            leftSection={<IconShare size={16} />}
            disabled={!recipientEmail}
          >
            {t('reports.share_email') || 'Send Report'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* SummaryCard                                                        */
/* ------------------------------------------------------------------ */

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder radius="md" p="md" shadow="sm">
      <Text size="sm" c="dimmed" mb="xs">
        {label}
      </Text>
      <Text size="xl" fw={700}>
        {value}
      </Text>
    </Paper>
  )
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPriceShort(value: number, currency: string): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return formatPrice(value, currency)
}

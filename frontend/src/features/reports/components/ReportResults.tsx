import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Badge,
  Divider,
  Tooltip as MantineTooltip,
} from '@mantine/core'
import {
  IconFileCode,
  IconFileSpreadsheet,
  IconFileDescription,
  IconShare,
  IconDeviceFloppy,
  IconTable,
  IconCalendar,
  IconCar,
  IconChartBar,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import dayjs from 'dayjs'

import type { ChartData, ReportResponse } from '../api/reportsApi'
import { ShareReportModal } from './ShareReportModal'
import { SaveReportModal } from './SaveReportModal'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

interface ReportResultsProps {
  report: ReportResponse
  onExport: (format: 'json' | 'csv' | 'xlsx' | 'pdf') => void
  onSave?: (name: string) => void
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const SUMMARY_COLORS = ['blue', 'green', 'yellow', 'red', 'violet', 'pink', 'teal', 'orange']

const reportTypeLabels: Record<string, string> = {
  fuel_consumption: 'reports.type_fuel',
  maintenance_costs: 'reports.type_maintenance',
  insurance_inspection: 'reports.type_insurance_inspection',
  vehicle_utilization: 'reports.type_utilization',
  cost_analysis: 'reports.type_cost_analysis',
  cost_per_km: 'reports.type_cost_per_km',
}

function ChartRenderer({ chart }: { chart: ChartData }) {
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'
  const { type, title, data } = chart

  if (type === 'bar') {
    return (
      <Paper p="md" withBorder>
        <Title order={5} mb="md" ta="center">
          {title}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={prepareBarChartData(data)} style={{ background: 'transparent' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-6)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets?.map((dataset, idx) => (
              <Bar
                key={idx}
                dataKey={dataset.label}
                fill={dataset.backgroundColor as string}
                name={dataset.label}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    )
  }

  if (type === 'line') {
    return (
      <Paper p="md" withBorder>
        <Title order={5} mb="md" ta="center">
          {title}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={prepareLineChartData(data)} style={{ background: 'transparent' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-6)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets?.map((dataset, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor as string}
                fill={dataset.backgroundColor as string}
                name={dataset.label}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    )
  }

  if (type === 'pie' || type === 'doughnut') {
    return (
      <Paper p="md" withBorder>
        <Title order={5} mb="md" ta="center">
          {title}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart style={{ background: 'transparent' }}>
            <Pie
              data={preparePieChartData(data)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${formatPrice(value as number, currency)}`}
              outerRadius={type === 'doughnut' ? 80 : 100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              activeShape={false}
              isAnimationActive={false}
            >
              {preparePieChartData(data).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatPrice(value as number, currency)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    )
  }

  return null
}

function prepareBarChartData(data: ChartData['data']) {
  if (!data.labels || !data.datasets) return []
  return data.labels.map((label, idx) => {
    const entry: Record<string, string | number | null> = { name: label }
    data.datasets?.forEach((dataset) => {
      entry[dataset.label] = dataset.data?.[idx] ?? null
    })
    return entry
  })
}

function prepareLineChartData(data: ChartData['data']) {
  return prepareBarChartData(data)
}

function preparePieChartData(data: ChartData['data']) {
  if (!data.data || !data.labels) return []
  return data.labels.map((label, idx) => ({
    name: label,
    value: data.data?.[idx] ?? 0,
    fill: data.backgroundColor?.[idx] || COLORS[idx % COLORS.length],
  }))
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(1)
}

const MONETARY_KEYS = [
  'fuel_cost',
  'maintenance_cost',
  'insurance_cost',
  'inspection_cost',
  'total_cost',
  'parts_cost',
  'labor_cost',
  'total_fuel_cost',
  'total_maintenance_cost',
  'total_insurance_cost',
  'total_inspection_cost',
  'grand_total',
  'total_parts_cost',
  'total_labor_cost',
  'avg_cost_per_km',
  'fuel_cost_per_km',
  'maintenance_cost_per_km',
]

function SummaryCard({ label, value, t, currency, color, fieldKey }: { label: string; value: string | number; t: (key: string) => string; currency?: string; color?: string; fieldKey?: string }) {
  const translatedLabel = label.startsWith('reports.') ? t(label) : label
  const curr = currency || 'KGS'
  const isMonetary = fieldKey ? MONETARY_KEYS.includes(fieldKey) : true
  const displayValue = typeof value === 'number'
    ? (isMonetary ? formatPrice(value, curr) : value.toLocaleString())
    : value
  return (
    <Paper p="md" withBorder style={{ borderTop: `3px solid var(--mantine-color-${color || 'blue'}-filled)` }}>
      <Text size="sm" c="dimmed">
        {translatedLabel}
      </Text>
      <Text size="xl" fw={700} c={`${color || 'blue'}.6`}>
        {displayValue}
      </Text>
    </Paper>
  )
}

export function ReportResults({ report, onExport, onSave }: ReportResultsProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'
  const { data, summary, charts, report_type, from_date, to_date } = report
  const [shareModalOpened, setShareModalOpened] = useState(false)
  const [saveModalOpened, setSaveModalOpened] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = (name: string) => {
    if (!onSave) return
    setIsSaving(true)
    onSave(name)
    setTimeout(() => setIsSaving(false), 1000)
  }

  const hasData = data && data.length > 0
  const hasCharts = charts && charts.length > 0
  const hasSummary = summary && Object.keys(summary).length > 0

  if (!hasData) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed" ta="center">
          {t('reports.no_data')}
        </Text>
      </Paper>
    )
  }

  const tableKeys = Object.keys(data[0])

  return (
    <Stack gap="md">
      {/* Metadata & Actions Bar */}
      <Paper p="md" withBorder>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap="xs">
            <Group gap="xs">
              <IconChartBar size={18} color="var(--mantine-color-blue-filled)" />
              <Title order={5}>
                {t(reportTypeLabels[report_type] || 'reports.unknown')}
              </Title>
              <Badge variant="light" color="blue">
                {data.length} {t('reports.records')}
              </Badge>
            </Group>
            <Group gap="md">
              <Group gap={4}>
                <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm" c="dimmed">
                  {dayjs(from_date).format('DD.MM.YYYY')} — {dayjs(to_date).format('DD.MM.YYYY')}
                </Text>
              </Group>
              <Group gap={4}>
                <IconCar size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm" c="dimmed">
                  {t('reports.generated_at')} {dayjs().format('DD.MM.YYYY HH:mm')}
                </Text>
              </Group>
            </Group>
          </Stack>

          <Group gap="xs">
            {onSave && (
              <MantineTooltip label={t('reports.save_report')}>
                <Button
                  variant="light"
                  size="sm"
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={() => setSaveModalOpened(true)}
                >
                  {t('common.save')}
                </Button>
              </MantineTooltip>
            )}
            <MantineTooltip label={t('reports.share_email')}>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconShare size={16} />}
                onClick={() => setShareModalOpened(true)}
              >
                {t('reports.share')}
              </Button>
            </MantineTooltip>
          </Group>
        </Group>

        <Divider my="sm" />

        {/* Export Buttons */}
        <Group gap="xs">
          <Text size="sm" fw={500}>
            {t('reports.export_as')}:
          </Text>
          <MantineTooltip label="JSON">
            <Button variant="default" size="xs" leftSection={<IconFileCode size={14} />} onClick={() => onExport('json')}>
              JSON
            </Button>
          </MantineTooltip>
          <MantineTooltip label="CSV">
            <Button variant="default" size="xs" leftSection={<IconFileDescription size={14} />} onClick={() => onExport('csv')}>
              CSV
            </Button>
          </MantineTooltip>
          <MantineTooltip label="Excel">
            <Button variant="default" size="xs" leftSection={<IconFileSpreadsheet size={14} />} onClick={() => onExport('xlsx')}>
              Excel
            </Button>
          </MantineTooltip>
          <MantineTooltip label="PDF">
            <Button variant="default" size="xs" leftSection={<IconFileDescription size={14} />} onClick={() => onExport('pdf')}>
              PDF
            </Button>
          </MantineTooltip>
        </Group>
      </Paper>

      {/* Share Modal */}
      <ShareReportModal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        report={report}
      />

      {/* Save Report Modal */}
      <SaveReportModal
        opened={saveModalOpened}
        onClose={() => setSaveModalOpened(false)}
        report={report}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Summary Cards */}
      {hasSummary && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {Object.entries(summary).slice(0, 4).map(([key, value], idx) => (
            <SummaryCard
              key={key}
              label={formatLabel(key)}
              value={value as number}
              t={t}
              currency={currency}
              color={SUMMARY_COLORS[idx % SUMMARY_COLORS.length]}
              fieldKey={key}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Charts */}
      {hasCharts && (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {charts?.map((chart, idx) => (
            <ChartRenderer key={idx} chart={chart} />
          ))}
        </SimpleGrid>
      )}

      {/* Data Table */}
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>{t('reports.data_table')}</Title>
          <ActionIcon variant="subtle">
            <IconTable size={18} />
          </ActionIcon>
        </Group>

        <div style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                {tableKeys.map((key) => (
                  <Table.Th key={key}>{translateLabel(formatLabel(key), t)}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, idx) => (
                <Table.Tr key={idx}>
                  {Object.values(row).map((value, i) => (
                    <Table.Td key={i}>
                      {typeof value === 'number' ? formatNumber(value) : String(value)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>
    </Stack>
  )
}

function formatLabel(key: string): string {
  const translationMap: Record<string, string> = {
    car_numplate: 'reports.car',
    fuel_cost: 'reports.fuel_cost',
    maintenance_cost: 'reports.maintenance_costs',
    insurance_cost: 'reports.insurance_cost',
    inspection_cost: 'reports.inspection_cost',
    total_cost: 'reports.total_cost',
    parts_cost: 'reports.parts_cost',
    labor_cost: 'reports.labor_cost',
    total_vehicles: 'reports.total_vehicles',
    total_liters: 'reports.total_liters',
    total_mileage: 'reports.total_mileage',
    avg_consumption: 'reports.avg_consumption',
    total_fuel_cost: 'reports.total_parts_cost',
    total_maintenance_cost: 'reports.total_labor_cost',
    total_insurance_cost: 'reports.insurance_cost',
    total_inspection_cost: 'reports.inspection_cost',
    grand_total: 'reports.grand_total',
    total_parts_cost: 'reports.total_parts_cost',
    total_labor_cost: 'reports.total_labor_cost',
    total_distance: 'reports.cost_per_km.total_distance',
    avg_cost_per_km: 'reports.cost_per_km.avg_cost_per_km',
    vehicle_count: 'reports.cost_per_km.vehicle_count',
    fuel_cost_per_km: 'reports.cost_per_km.fuel_cost',
    maintenance_cost_per_km: 'reports.cost_per_km.maintenance_cost',
    type: 'reports.type_label',
    status: 'reports.status',
    number: 'reports.number',
    start_date: 'reports.start_date',
    end_date: 'reports.end_date',
    car_id: 'reports.car',
  }

  return translationMap[key] || key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
}

function translateLabel(label: string, t: (key: string) => string): string {
  if (label.startsWith('reports.')) {
    return t(label)
  }
  return label
}

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
  Menu,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconDownload, IconFileExport, IconFileDescription, IconTable, IconFileCode } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import type { ChartData, ReportResponse } from '../api/reportsApi'

interface ReportResultsProps {
  report: ReportResponse
  onExport: (format: 'json' | 'csv' | 'xlsx' | 'pdf') => void
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

/**
 * Render different chart types based on data
 */
function ChartRenderer({ chart }: { chart: ChartData }) {
  const { type, title, data } = chart

  if (type === 'bar') {
    return (
      <Paper p="md" withBorder>
        <Title order={5} mb="md" ta="center">
          {title}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={prepareBarChartData(data)}>
            <CartesianGrid strokeDasharray="3 3" />
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
          <LineChart data={prepareLineChartData(data)}>
            <CartesianGrid strokeDasharray="3 3" />
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
          <PieChart>
            <Pie
              data={preparePieChartData(data)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${formatNumber(value)}`}
              outerRadius={type === 'doughnut' ? 80 : 100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {preparePieChartData(data).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(value as number)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    )
  }

  return null
}

/**
 * Prepare data for bar charts
 */
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

/**
 * Prepare data for line charts
 */
function prepareLineChartData(data: ChartData['data']) {
  return prepareBarChartData(data)
}

/**
 * Prepare data for pie charts
 */
function preparePieChartData(data: ChartData['data']) {
  if (!data.data || !data.labels) return []

  return data.labels.map((label, idx) => ({
    name: label,
    value: data.data?.[idx] ?? 0,
    fill: data.backgroundColor?.[idx] || COLORS[idx % COLORS.length],
  }))
}

/**
 * Format large numbers for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toFixed(1)
}

/**
 * Summary Card Component
 */
function SummaryCard({ label, value, t }: { label: string; value: string | number; t: (key: string) => string }) {
  const translatedLabel = label.startsWith('reports.') ? t(label) : label
  return (
    <Paper p="md" withBorder>
      <Text size="sm" c="dimmed">
        {translatedLabel}
      </Text>
      <Text size="xl" fw={700}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </Text>
    </Paper>
  )
}

export function ReportResults({ report, onExport }: ReportResultsProps) {
  const { t } = useTranslation()
  const { data, summary, charts } = report

  const hasData = data && data.length > 0
  const hasCharts = charts && charts.length > 0
  const hasSummary = summary && Object.keys(summary).length > 0

  if (!hasData) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed" ta="center">
          {t('reports.no_data') || 'No data available for selected criteria'}
        </Text>
      </Paper>
    )
  }

  return (
    <Stack gap="md">
      {/* Export Actions */}
      <Group justify="flex-end">
        <Text size="sm" c="dimmed" mr="sm">
          {t('reports.export') || 'Export:'}
        </Text>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button variant="outline" size="sm" leftSection={<IconFileExport size={16} />}>
              {t('reports.export_as') || 'Export As'}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconFileCode size={16} />}
              onClick={() => onExport('json')}
            >
              JSON
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload size={16} />}
              onClick={() => onExport('csv')}
            >
              CSV
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload size={16} />}
              onClick={() => onExport('xlsx')}
            >
              Excel (XLSX)
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFileDescription size={16} />}
              onClick={() => onExport('pdf')}
            >
              PDF
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Summary Cards */}
      {hasSummary && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {Object.entries(summary).slice(0, 4).map(([key, value]) => (
            <SummaryCard key={key} label={formatLabel(key)} value={value as number} t={t} />
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
          <Title order={4}>
            {t('reports.data_table') || 'Data Table'}
          </Title>
          <ActionIcon variant="subtle">
            <IconTable size={18} />
          </ActionIcon>
        </Group>

        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              {Object.keys(data[0]).map((key) => (
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
      </Paper>
    </Stack>
  )
}

/**
 * Format camelCase/snake_case labels to readable text
 */
function formatLabel(key: string): string {
  // Translation map for report labels
  const translationMap: Record<string, string> = {
    // Cost Analysis
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
    // Insurance/Inspection
    type: 'reports.type_label',
    status: 'reports.status',
    number: 'reports.number',
    start_date: 'reports.start_date',
    end_date: 'reports.end_date',
    // Common
    car_id: 'reports.car',
  }

  // Return translation key if exists, otherwise format normally
  return translationMap[key] || key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
}

/**
 * Translate label if it's a translation key
 */
function translateLabel(label: string, t: (key: string) => string): string {
  if (label.startsWith('reports.')) {
    return t(label)
  }
  return label
}

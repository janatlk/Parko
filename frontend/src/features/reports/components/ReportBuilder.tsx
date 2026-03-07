import { useState } from 'react'

import {
  Button,
  Checkbox,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar, IconCar, IconFileAnalytics } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import type { ReportType } from '../api/reportsApi'

interface ReportBuilderProps {
  carOptions: { value: string; label: string }[]
  onGenerate: (params: GenerateParams) => void
  isLoading?: boolean
}

interface GenerateParams {
  report_type: ReportType
  from_date: string
  to_date: string
  car_ids: number[] | null
  save_report: boolean
  report_name?: string
}

const reportTypes = [
  { value: 'fuel_consumption', label: 'reports.type_fuel' },
  { value: 'maintenance_costs', label: 'reports.type_maintenance' },
  { value: 'insurance_inspection', label: 'reports.type_insurance_inspection' },
  { value: 'vehicle_utilization', label: 'reports.type_utilization' },
  { value: 'cost_analysis', label: 'reports.type_cost_analysis' },
] as const

export function ReportBuilder({ carOptions, onGenerate, isLoading }: ReportBuilderProps) {
  const { t } = useTranslation()
  const [reportType, setReportType] = useState<ReportType | null>(null)
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null])
  const [selectedCars, setSelectedCars] = useState<string[]>([])
  const [saveReport, setSaveReport] = useState(false)
  const [reportName, setReportName] = useState('')

  const handleGenerate = () => {
    if (!reportType || !dateRange[0] || !dateRange[1]) return

    onGenerate({
      report_type: reportType,
      from_date: dateRange[0],
      to_date: dateRange[1],
      car_ids: selectedCars.length > 0 ? selectedCars.map(Number) : null,
      save_report: saveReport,
      report_name: saveReport ? reportName || undefined : undefined,
    })
  }

  const isFormValid = reportType && dateRange[0] && dateRange[1]

  return (
    <Paper p="md" shadow="xs">
      <Title order={3} mb="md">
        {t('reports.builder_title') || 'Report Builder'}
      </Title>

      <Stack gap="md">
        {/* Report Type */}
        <Select
          label={
            <Group gap="xs">
              <IconFileAnalytics size={18} />
              <Text>{t('reports.type') || 'Report Type'}</Text>
            </Group>
          }
          placeholder={t('reports.select_type') || 'Select report type'}
          data={reportTypes.map((type) => ({
            value: type.value,
            label: t(type.label),
          }))}
          value={reportType}
          onChange={(value) => setReportType(value as ReportType)}
          clearable
          required
        />

        {/* Date Range */}
        <DatePickerInput
          type="range"
          label={
            <Group gap="xs">
              <IconCalendar size={18} />
              <Text>{t('reports.date_range') || 'Date Range'}</Text>
            </Group>
          }
          placeholder={t('reports.select_period') || 'Select period'}
          value={dateRange}
          onChange={setDateRange}
          clearable
          required
        />

        {/* Vehicles */}
        <MultiSelect
          label={
            <Group gap="xs">
              <IconCar size={18} />
              <Text>{t('reports.vehicles') || 'Vehicles'}</Text>
            </Group>
          }
          placeholder={t('reports.select_vehicles') || 'Select vehicles or leave empty for all'}
          data={carOptions}
          value={selectedCars}
          onChange={setSelectedCars}
          searchable
          clearable
          maxDropdownHeight={250}
        />

        {/* Save Report */}
        <Paper p="md" bg="gray.0" radius="sm">
          <Stack gap="sm">
            <Checkbox
              label={t('reports.save_report') || 'Save this report for later'}
              checked={saveReport}
              onChange={(event) => setSaveReport(event.currentTarget.checked)}
            />

            {saveReport && (
              <TextInput
                label={t('reports.report_name') || 'Report Name'}
                placeholder={t('reports.enter_report_name') || 'Enter a name for this report'}
                value={reportName}
                onChange={(event) => setReportName(event.currentTarget.value)}
                required={saveReport}
              />
            )}
          </Stack>
        </Paper>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          loading={isLoading}
          disabled={!isFormValid}
          size="md"
          fullWidth
        >
          {t('reports.generate') || 'Generate Report'}
        </Button>
      </Stack>
    </Paper>
  )
}

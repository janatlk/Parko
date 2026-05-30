import { useState } from 'react'

import {
  Button,
  Checkbox,
  Group,
  MultiSelect,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  SimpleGrid,
  ThemeIcon,
  Badge,
  Box,
  Divider,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import {
  IconGasStation,
  IconTool,
  IconShieldCheck,
  IconGauge,
  IconChartPie,
  IconRoad,
  IconCalendar,
  IconCar,
  IconSparkles,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

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

interface ReportTypeCard {
  value: ReportType
  labelKey: string
  descKey: string
  icon: React.ElementType
  color: string
}

const reportTypes: ReportTypeCard[] = [
  {
    value: 'fuel_consumption',
    labelKey: 'reports.type_fuel',
    descKey: 'reports.type_fuel_desc',
    icon: IconGasStation,
    color: 'blue',
  },
  {
    value: 'maintenance_costs',
    labelKey: 'reports.type_maintenance',
    descKey: 'reports.type_maintenance_desc',
    icon: IconTool,
    color: 'orange',
  },
  {
    value: 'insurance_inspection',
    labelKey: 'reports.type_insurance_inspection',
    descKey: 'reports.type_insurance_inspection_desc',
    icon: IconShieldCheck,
    color: 'green',
  },
  {
    value: 'vehicle_utilization',
    labelKey: 'reports.type_utilization',
    descKey: 'reports.type_utilization_desc',
    icon: IconGauge,
    color: 'cyan',
  },
  {
    value: 'cost_analysis',
    labelKey: 'reports.type_cost_analysis',
    descKey: 'reports.type_cost_analysis_desc',
    icon: IconChartPie,
    color: 'violet',
  },
  {
    value: 'cost_per_km',
    labelKey: 'reports.type_cost_per_km',
    descKey: 'reports.type_cost_per_km_desc',
    icon: IconRoad,
    color: 'teal',
  },
]

const datePresets = [
  { labelKey: 'reports.preset_this_month', get: () => [dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()] as [Date, Date] },
  { labelKey: 'reports.preset_last_month', get: () => [dayjs().subtract(1, 'month').startOf('month').toDate(), dayjs().subtract(1, 'month').endOf('month').toDate()] as [Date, Date] },
  { labelKey: 'reports.preset_this_quarter', get: () => [dayjs().startOf('month').toDate(), dayjs().add(2, 'month').endOf('month').toDate()] as [Date, Date] },
  { labelKey: 'reports.preset_ytd', get: () => [dayjs().startOf('year').toDate(), dayjs().toDate()] as [Date, Date] },
]

export function ReportBuilder({ carOptions, onGenerate, isLoading }: ReportBuilderProps) {
  const { t } = useTranslation()
  const [reportType, setReportType] = useState<ReportType | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])

  const handleDateChange = (value: unknown) => {
    const dates = value as [Date | null, Date | null] | null
    setDateRange(dates ?? [null, null])
  }
  const [selectedCars, setSelectedCars] = useState<string[]>([])
  const [saveReport, setSaveReport] = useState(false)
  const [reportName, setReportName] = useState('')

  const handleGenerate = () => {
    if (!reportType || !dateRange[0] || !dateRange[1]) return

    onGenerate({
      report_type: reportType,
      from_date: dayjs(dateRange[0]).format('YYYY-MM-DD'),
      to_date: dayjs(dateRange[1]).format('YYYY-MM-DD'),
      car_ids: selectedCars.length > 0 ? selectedCars.map(Number) : null,
      save_report: saveReport,
      report_name: saveReport ? reportName || undefined : undefined,
    })
  }

  const isFormValid = reportType && dateRange[0] && dateRange[1]

  const selectedType = reportTypes.find((r) => r.value === reportType)

  return (
    <Stack gap="lg">
      {/* Report Type Cards */}
      <Box>
        <Group gap="xs" mb="md">
          <ThemeIcon variant="light" color="blue" radius="md">
            <IconSparkles size={18} />
          </ThemeIcon>
          <Title order={4}>{t('reports.select_type') || 'Select Report Type'}</Title>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {reportTypes.map((type) => {
            const Icon = type.icon
            const isSelected = reportType === type.value
            return (
              <Paper
                key={type.value}
                withBorder
                p="md"
                radius="md"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: isSelected ? `var(--mantine-color-${type.color}-filled)` : undefined,
                  background: isSelected ? `var(--mantine-color-${type.color}-light)` : undefined,
                }}
                onClick={() => setReportType(type.value)}
              >
                <Group gap="sm" align="flex-start">
                  <ThemeIcon variant={isSelected ? 'filled' : 'light'} color={type.color} size="lg" radius="md">
                    <Icon size={22} />
                  </ThemeIcon>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Text fw={600} size="sm">
                      {t(type.labelKey)}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {t(type.descKey) || ''}
                    </Text>
                  </Stack>
                  {isSelected && (
                    <Badge color={type.color} variant="filled" size="xs">
                      {t('reports.selected') || 'Selected'}
                    </Badge>
                  )}
                </Group>
              </Paper>
            )
          })}
        </SimpleGrid>
      </Box>

      {/* Configuration Panel */}
      {selectedType && (
        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Group gap="xs">
              <selectedType.icon size={20} color={`var(--mantine-color-${selectedType.color}-filled)`} />
              <Title order={5}>{t(selectedType.labelKey)}</Title>
            </Group>

            <Divider />

            {/* Date Range with Presets */}
            <Box>
              <Group gap="xs" mb="xs">
                <IconCalendar size={18} color="var(--mantine-color-dimmed)" />
                <Text fw={500} size="sm">
                  {t('reports.date_range') || 'Date Range'}
                </Text>
              </Group>

              <Group gap="xs" mb="md">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.labelKey}
                    variant="light"
                    size="xs"
                    onClick={() => setDateRange(preset.get())}
                  >
                    {t(preset.labelKey)}
                  </Button>
                ))}
              </Group>

              <DatePickerInput
                type="range"
                placeholder={t('reports.select_period') || 'Select period'}
                value={dateRange}
                onChange={handleDateChange}
                clearable
                required
              />
            </Box>

            {/* Vehicles */}
            <Box>
              <Group gap="xs" mb="xs">
                <IconCar size={18} color="var(--mantine-color-dimmed)" />
                <Text fw={500} size="sm">
                  {t('reports.vehicles') || 'Vehicles'}
                </Text>
              </Group>
              <MultiSelect
                placeholder={t('reports.select_vehicles') || 'Select vehicles or leave empty for all'}
                data={carOptions}
                value={selectedCars}
                onChange={setSelectedCars}
                searchable
                clearable
                maxDropdownHeight={250}
              />
              {selectedCars.length === 0 && (
                <Text size="xs" c="dimmed" mt={4}>
                  {t('reports.all_vehicles_hint') || 'Leaving empty will include all vehicles'}
                </Text>
              )}
            </Box>

            {/* Save Report */}
            <Paper p="md" radius="sm">
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
              leftSection={<IconSparkles size={18} />}
              fullWidth
            >
              {t('reports.generate') || 'Generate Report'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

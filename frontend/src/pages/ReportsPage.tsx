import { useState } from 'react'

import {
  Button,
  Container,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

import { useCarsQuery } from '@features/cars/hooks/useCars'

type ReportType = 'fuel_consumption' | 'maintenance_costs' | 'insurance_inspection' | 'vehicle_utilization' | 'cost_analysis'

export function ReportsPage() {
  const { t } = useTranslation()
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [selectedCars, setSelectedCars] = useState<string[]>([])
  const [reportType, setReportType] = useState<ReportType | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { data: carsData } = useCarsQuery({ page: 1 })
  const carOptions =
    carsData?.results.map((car) => ({
      value: String(car.id),
      label: `${car.numplate} - ${car.brand}`,
    })) || []

  const reportTypes = [
    { value: 'fuel_consumption', label: t('reports.fuel_consumption') || 'Fuel Consumption' },
    { value: 'maintenance_costs', label: t('reports.maintenance_costs') || 'Maintenance Costs' },
    {
      value: 'insurance_inspection',
      label: t('reports.insurance_inspection') || 'Insurance & Inspections',
    },
    {
      value: 'vehicle_utilization',
      label: t('reports.vehicle_utilization') || 'Vehicle Utilization',
    },
    { value: 'cost_analysis', label: t('reports.cost_analysis') || 'Cost Analysis' },
  ]

  const handleGenerate = async () => {
    if (!reportType || !dateRange[0] || !dateRange[1]) {
      return
    }

    setIsLoading(true)
    try {
      // TODO: Call API /api/v1/reports/generate/
      const response = await fetch('/api/v1/reports/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          report_type: reportType,
          from_date: dateRange[0].toISOString().split('T')[0],
          to_date: dateRange[1].toISOString().split('T')[0],
          car_ids: selectedCars.length > 0 ? selectedCars.map(Number) : null,
          export_format: 'json',
        }),
      })

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    if (!reportType || !dateRange[0] || !dateRange[1]) return

    const response = await fetch('/api/v1/reports/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        report_type: reportType,
        from_date: dateRange[0].toISOString().split('T')[0],
        to_date: dateRange[1].toISOString().split('T')[0],
        car_ids: selectedCars.length > 0 ? selectedCars.map(Number) : null,
        export_format: format,
      }),
    })

    if (format === 'json') {
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${reportType}_${Date.now()}.json`
      a.click()
    } else {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${reportType}_${Date.now()}.${format}`
      a.click()
    }
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>{t('reports.title')}</Title>
        <Group gap="xs">
          <Button variant="subtle" size="sm" onClick={() => handleExport('json')}>
            Export JSON
          </Button>
          <Button variant="subtle" size="sm" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="subtle" size="sm" onClick={() => handleExport('xlsx')}>
            Export Excel
          </Button>
        </Group>
      </Group>

      <Paper p="md" shadow="xs" mb="lg">
        <Stack gap="md">
          <Title order={3}>Filters</Title>

          <DatePickerInput
            type="range"
            label="Date Range"
            placeholder="Select period"
            value={dateRange}
            onChange={setDateRange}
            clearable
          />

          <MultiSelect
            label="Vehicles"
            placeholder="Select vehicles or leave empty for all"
            data={carOptions}
            value={selectedCars}
            onChange={setSelectedCars}
            searchable
            clearable
          />

          <Select
            label="Report Type"
            placeholder="Select report type"
            data={reportTypes}
            value={reportType}
            onChange={(value) => setReportType(value as ReportType)}
            clearable
          />

          <Button onClick={handleGenerate} loading={isLoading} disabled={!reportType || !dateRange[0] || !dateRange[1]}>
            Generate Report
          </Button>
        </Stack>
      </Paper>

      {reportData && (
        <Paper p="md" shadow="xs">
          <Title order={3} mb="md">
            Results
          </Title>

          {reportData.data && reportData.data.length > 0 ? (
            <>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    {Object.keys(reportData.data[0]).map((key) => (
                      <Table.Th key={key}>{key}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {reportData.data.map((row: any, idx: number) => (
                    <Table.Tr key={idx}>
                      {Object.values(row).map((value: any, i: number) => (
                        <Table.Td key={i}>{String(value)}</Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {reportData.summary && (
                <Paper p="md" mt="md" bg="gray.0">
                  <Title order={4} mb="sm">
                    Summary
                  </Title>
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <Text key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </Text>
                  ))}
                </Paper>
              )}
            </>
          ) : (
            <Text c="dimmed">No data available for selected criteria</Text>
          )}
        </Paper>
      )}
    </Container>
  )
}

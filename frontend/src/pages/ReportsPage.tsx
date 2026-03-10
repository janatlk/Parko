import { useState } from 'react'

import { Container, Tabs, Title, Stack, Notification, Group } from '@mantine/core'
import { IconChartBar, IconFolderOpen, IconExclamationCircle, IconCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { notifications } from '@mantine/notifications'

import { useCarsQuery } from '@features/cars/hooks/useCars'
import {
  useGenerateReport,
  useSavedReportsQuery,
  useCreateSavedReport,
  useExportSavedReport,
  useSavedReportDataQuery,
} from '@features/reports/hooks/useReports'
import { ReportBuilder } from '@features/reports/components/ReportBuilder'
import { ReportResults } from '@features/reports/components/ReportResults'
import { SavedReportsList } from '@features/reports/components/SavedReportsList'
import { ExportHistory } from '@features/reports/components/ExportHistory'
import type { ReportResponse, SavedReportList, ReportType } from '@features/reports/api/reportsApi'

export function ReportsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string | null>('new')
  const [generatedReport, setGeneratedReport] = useState<ReportResponse | null>(null)
  const [selectedSavedReport, setSelectedSavedReport] = useState<SavedReportList | null>(null)

  // Queries
  const { data: carsData, isLoading: isLoadingCars } = useCarsQuery({ page: 1 })
  const { data: savedReports, isLoading: isLoadingSaved } = useSavedReportsQuery()
  const { data: savedReportData } = useSavedReportDataQuery(selectedSavedReport?.id ?? null)

  // Mutations
  const generateMutation = useGenerateReport()
  const createSavedMutation = useCreateSavedReport()
  const exportMutation = useExportSavedReport()

  // Prepare car options for the builder
  const carOptions =
    carsData?.results.map((car) => ({
      value: String(car.id),
      label: `${car.numplate} - ${car.brand}`,
    })) || []

  // Show loading state
  if (isLoadingCars) {
    return (
      <Container size="xl" py="lg">
        <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
          <Title order={2}>{t('common.loading') || 'Loading...'}</Title>
        </Stack>
      </Container>
    )
  }

  /**
   * Handle report generation
   */
  const handleGenerate = async (params: {
    report_type: string
    from_date: string
    to_date: string
    car_ids: number[] | null
    save_report: boolean
    report_name?: string
  }) => {
    console.log('Generating report with params:', params)
    
    generateMutation.mutate(
      {
        report_type: params.report_type as ReportType,
        from_date: params.from_date,
        to_date: params.to_date,
        car_ids: params.car_ids,
        include_charts: true,
      },
      {
        onSuccess: (data) => {
          console.log('Report generated successfully:', data)
          setGeneratedReport(data)

          // Save report if requested
          if (params.save_report && params.report_name) {
            createSavedMutation.mutate(
              {
                name: params.report_name,
                report_type: params.report_type as ReportType,
                from_date: params.from_date,
                to_date: params.to_date,
                car_ids: params.car_ids,
                filters: {},
                summary: data.summary,
              },
              {
                onSuccess: () => {
                  notifications.show({
                    title: t('reports.report_saved') || 'Report Saved',
                    message: t('reports.report_saved_message') || 'Your report has been saved successfully',
                    icon: <IconCheck />,
                    color: 'green',
                  })
                },
                onError: (error) => {
                  console.error('Save error:', error)
                  notifications.show({
                    title: t('reports.save_failed') || 'Save Failed',
                    message: t('reports.save_failed_message') || 'Failed to save the report',
                    icon: <IconExclamationCircle />,
                    color: 'red',
                  })
                },
              },
            )
          }

          notifications.show({
            title: t('reports.report_generated') || 'Report Generated',
            message: t('reports.report_generated_message') || 'Your report is ready to view',
            icon: <IconCheck />,
            color: 'green',
          })
        },
        onError: (error) => {
          console.error('Generate report error:', error)
          notifications.show({
            title: t('reports.generation_failed') || 'Generation Failed',
            message: error instanceof Error ? error.message : (t('reports.generation_failed_message') || 'Failed to generate the report'),
            icon: <IconExclamationCircle />,
            color: 'red',
          })
        },
      },
    )
  }

  /**
   * Handle export
   */
  const handleExport = async (format: 'json' | 'csv' | 'xlsx' | 'pdf') => {
    if (!generatedReport) return

    try {
      const blob = await exportMutation.mutateAsync({
        id: 0, // Not used for new reports
        format,
      })

      // For JSON format, we need to handle differently
      if (format === 'json' && typeof blob === 'object') {
        const jsonBlob = new Blob([JSON.stringify(blob, null, 2)], { type: 'application/json' })
        downloadBlob(jsonBlob, `report_${generatedReport.report_type}_${Date.now()}.json`)
      } else {
        downloadBlob(blob as Blob, `report_${generatedReport.report_type}_${Date.now()}.${format}`)
      }

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
        icon: <IconExclamationCircle />,
        color: 'red',
      })
    }
  }

  /**
   * Handle viewing a saved report
   */
  const handleViewSaved = (report: SavedReportList) => {
    setSelectedSavedReport(report)
    setActiveTab('results')
  }

  /**
   * Handle exporting a saved report
   */
  const handleExportSaved = async (report: SavedReportList, format: 'json' | 'csv' | 'xlsx' | 'pdf') => {
    try {
      const blob = await exportMutation.mutateAsync({ id: report.id, format })

      if (format === 'json' && typeof blob === 'object') {
        const jsonBlob = new Blob([JSON.stringify(blob, null, 2)], { type: 'application/json' })
        downloadBlob(jsonBlob, `report_${report.name}_${Date.now()}.json`)
      } else {
        downloadBlob(blob as Blob, `report_${report.name}_${Date.now()}.${format}`)
      }

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
        icon: <IconExclamationCircle />,
        color: 'red',
      })
    }
  }

  /**
   * Helper to download blob
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Container size="xl" py="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={1}>{t('reports.title') || 'Reports'}</Title>
          <ExportHistory />
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} color="blue">
          <Tabs.List>
            <Tabs.Tab
              value="new"
              leftSection={<IconChartBar size={16} />}
              onClick={() => {
                setGeneratedReport(null)
                setSelectedSavedReport(null)
              }}
            >
              {t('reports.new_report') || 'New Report'}
            </Tabs.Tab>
            <Tabs.Tab
              value="saved"
              leftSection={<IconFolderOpen size={16} />}
              onClick={() => setSelectedSavedReport(null)}
            >
              {t('reports.saved_reports') || 'Saved Reports'}
            </Tabs.Tab>
            <Tabs.Tab value="results" disabled={!generatedReport && !selectedSavedReport}>
              {t('reports.results') || 'Results'}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="new" pt="md">
            <ReportBuilder carOptions={carOptions} onGenerate={handleGenerate} isLoading={generateMutation.isPending} />
          </Tabs.Panel>

          <Tabs.Panel value="saved" pt="md">
            <SavedReportsList
              reports={savedReports || []}
              isLoading={isLoadingSaved}
              onView={handleViewSaved}
              onExport={handleExportSaved}
            />
          </Tabs.Panel>

          <Tabs.Panel value="results" pt="md">
            {generatedReport && (
              <ReportResults report={generatedReport} onExport={handleExport} />
            )}
            {selectedSavedReport && savedReportData && (
              <ReportResults report={savedReportData} onExport={(format) => handleExportSaved(selectedSavedReport, format)} />
            )}
            {!generatedReport && !savedReportData && (
              <Notification icon={<IconExclamationCircle />} color="gray">
                {t('reports.no_report_selected') || 'No report selected'}
              </Notification>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}

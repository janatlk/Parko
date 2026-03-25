import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
  Text,
  Alert,
} from '@mantine/core'
import { IconDeviceFloppy } from '@tabler/icons-react'

import type { ReportResponse, ReportType } from '../api/reportsApi'

type Props = {
  opened: boolean
  onClose: () => void
  report: ReportResponse | null
  onSave: (name: string) => void
  isSaving?: boolean
}

export function SaveReportModal({ opened, onClose, report, onSave, isSaving }: Props) {
  const { t } = useTranslation()
  const [reportName, setReportName] = useState('')

  const handleSave = () => {
    if (!report || !reportName.trim()) return
    onSave(reportName.trim())
    setReportName('')
    onClose()
  }

  const handleClose = () => {
    setReportName('')
    onClose()
  }

  const getReportTypeName = (type: ReportType): string => {
    const labels: Record<string, string> = {
      fuel_consumption: t('reports.fuel_consumption') || 'Fuel Consumption',
      maintenance_costs: t('reports.maintenance_costs') || 'Maintenance Costs',
      insurance_inspection: t('reports.insurance_inspection') || 'Insurance & Inspection',
      vehicle_utilization: t('reports.vehicle_utilization') || 'Vehicle Utilization',
      cost_analysis: t('reports.cost_analysis') || 'Cost Analysis',
    }
    return labels[type] || type
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t('reports.save_report_title') || 'Save Report'}
      centered
    >
      <Stack>
        {report && (
          <Alert variant="light" color="blue" icon={<IconDeviceFloppy size={16} />}>
            <Text size="sm" fw={500}>{getReportTypeName(report.report_type)}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              {report.from_date} — {report.to_date}
            </Text>
          </Alert>
        )}

        <TextInput
          label={t('reports.report_name') || 'Report Name'}
          placeholder={t('reports.enter_report_name') || 'Enter a name for this report'}
          value={reportName}
          onChange={(e) => setReportName(e.currentTarget.value)}
          required
          autoFocus
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            leftSection={<IconDeviceFloppy size={16} />}
            disabled={!reportName.trim()}
          >
            {t('reports.save_report') || 'Save Report'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

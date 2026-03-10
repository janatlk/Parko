import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconDownload, IconTrash, IconX } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { useExportHistoryQuery, useDeleteExportLog } from '../hooks/useReports'
import type { ExportLog } from '../api/reportsApi'

/**
 * Component for displaying export history
 */
export function ExportHistory() {
  const { t } = useTranslation()
  const [opened, { open, close }] = useDisclosure(false)

  const { data: history, refetch } = useExportHistoryQuery()
  const deleteLog = useDeleteExportLog()

  const handleDelete = (id: number) => {
    deleteLog.mutate(id, {
      onSuccess: () => {
        refetch()
      },
    })
  }

  const handleDownload = (log: ExportLog) => {
    // In a real implementation, you would trigger a re-download
    // For now, just show a notification
    console.log('Re-download export:', log)
  }

  const formatReportType = (type: string): string => {
    const labels: Record<string, string> = {
      fuel_consumption: t('reports.fuel_consumption') || 'Fuel Consumption',
      maintenance_costs: t('reports.maintenance_costs') || 'Maintenance Costs',
      insurance_inspection: t('reports.insurance_inspection') || 'Insurance & Inspection',
      vehicle_utilization: t('reports.vehicle_utilization') || 'Vehicle Utilization',
      cost_analysis: t('reports.cost_analysis') || 'Cost Analysis',
    }
    return labels[type] || type
  }

  const formatExportFormat = (format: string): string => {
    const labels: Record<string, string> = {
      csv: 'CSV',
      xlsx: 'Excel',
      pdf: 'PDF',
      json: 'JSON',
    }
    return labels[format] || format.toUpperCase()
  }

  const getFormatColor = (format: string): string => {
    const colors: Record<string, string> = {
      csv: 'blue',
      xlsx: 'green',
      pdf: 'red',
      json: 'gray',
    }
    return colors[format] || 'gray'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle empty or undefined history
  if (!history || history.length === 0) {
    return (
      <>
        <Button variant="subtle" size="sm" onClick={open}>
          {t('reports.export_history') || 'Export History'}
        </Button>
        <Modal opened={opened} onClose={close} title={t('reports.export_history') || 'Export History'} size="lg">
          <Text c="dimmed" ta="center" py="xl">
            {t('reports.no_export_history') || 'No export history yet'}
          </Text>
        </Modal>
      </>
    )
  }

  return (
    <>
      <Button variant="subtle" size="sm" onClick={open}>
        {t('reports.export_history') || 'Export History'}
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <IconDownload size={20} />
            <Title order={4}>{t('reports.export_history') || 'Export History'}</Title>
          </Group>
        }
        size="xl"
        closeOnClickOutside={false}
      >
        <Stack gap="md">
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">
              {t('reports.recent_exports') || 'Recent Exports'}
            </Text>
            <ActionIcon variant="subtle" onClick={close}>
              <IconX size={18} />
            </ActionIcon>
          </Group>

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('reports.report_type') || 'Report Type'}</Table.Th>
                <Table.Th>{t('reports.format') || 'Format'}</Table.Th>
                <Table.Th>{t('reports.records') || 'Records'}</Table.Th>
                <Table.Th>{t('reports.exported_by') || 'Exported By'}</Table.Th>
                <Table.Th>{t('reports.date') || 'Date'}</Table.Th>
                <Table.Th>{t('reports.actions') || 'Actions'}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history && history.length > 0 && history.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>{formatReportType(log.report_type)}</Table.Td>
                  <Table.Td>
                    <Badge color={getFormatColor(log.export_format)} variant="light">
                      {formatExportFormat(log.export_format)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{log.record_count}</Table.Td>
                  <Table.Td>{log.user_name || 'Unknown'}</Table.Td>
                  <Table.Td>{formatDate(log.created_at)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => handleDownload(log)}
                        title={t('reports.download') || 'Download'}
                      >
                        <IconDownload size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        color="red"
                        onClick={() => handleDelete(log.id)}
                        title={t('reports.delete') || 'Delete'}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Modal>
    </>
  )
}

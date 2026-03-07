import {
  ActionIcon,
  Badge,
  Group,
  Loader,
  Menu,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconDownload, IconEye, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

import { useDeleteSavedReport } from '../hooks/useReports'
import type { SavedReportList } from '../api/reportsApi'

interface SavedReportsListProps {
  reports: SavedReportList[]
  isLoading?: boolean
  onView: (report: SavedReportList) => void
  onExport: (report: SavedReportList, format: 'json' | 'csv' | 'xlsx') => void
}

const reportTypeLabels: Record<string, string> = {
  fuel_consumption: 'reports.type_fuel',
  maintenance_costs: 'reports.type_maintenance',
  insurance_inspection: 'reports.type_insurance_inspection',
  vehicle_utilization: 'reports.type_utilization',
  cost_analysis: 'reports.type_cost_analysis',
}

export function SavedReportsList({ reports, isLoading, onView, onExport }: SavedReportsListProps) {
  const { t } = useTranslation()
  const deleteMutation = useDeleteSavedReport()

  // Ensure reports is always an array
  const reportsArray = Array.isArray(reports) ? reports : []

  const handleDelete = (id: number) => {
    if (window.confirm(t('reports.confirm_delete') || 'Are you sure you want to delete this report?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleExport = (report: SavedReportList, format: 'json' | 'csv' | 'xlsx') => {
    onExport(report, format)
  }

  if (isLoading) {
    return (
      <Paper p="md" withBorder>
        <Stack align="center" py="xl">
          <Loader />
          <Text c="dimmed">{t('common.loading') || 'Loading...'}</Text>
        </Stack>
      </Paper>
    )
  }

  if (!reportsArray || reportsArray.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Stack align="center" py="xl">
          <Text c="dimmed">{t('reports.no_saved_reports') || 'No saved reports yet'}</Text>
          <Text size="sm" c="dimmed">
            {t('reports.create_first') || 'Generate and save your first report to see it here'}
          </Text>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper p="md" withBorder>
      <Title order={3} mb="md">
        {t('reports.saved_reports') || 'Saved Reports'}
      </Title>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('reports.name') || 'Name'}</Table.Th>
            <Table.Th>{t('reports.type') || 'Type'}</Table.Th>
            <Table.Th>{t('reports.period') || 'Period'}</Table.Th>
            <Table.Th>{t('reports.created_by') || 'Created By'}</Table.Th>
            <Table.Th>{t('reports.created_at') || 'Created At'}</Table.Th>
            <Table.Th>{t('common.actions') || 'Actions'}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reportsArray.map((report) => (
            <Table.Tr key={report.id}>
              <Table.Td>
                <Text fw={500}>{report.name}</Text>
              </Table.Td>
              <Table.Td>
                <Badge variant="light" color="blue">
                  {t(reportTypeLabels[report.report_type] || 'reports.unknown')}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {dayjs(report.from_date).format('DD.MM.YYYY')} - {dayjs(report.to_date).format('DD.MM.YYYY')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{report.created_by_name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {dayjs(report.created_at).format('DD.MM.YYYY HH:mm')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => onView(report)}
                    title={t('reports.view') || 'View'}
                  >
                    <IconEye size={18} />
                  </ActionIcon>

                  <Menu position="bottom-end" shadow="md" withArrow>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" title={t('reports.export') || 'Export'}>
                        <IconDownload size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>{t('reports.export_as') || 'Export as'}</Menu.Label>
                      <Menu.Item onClick={() => handleExport(report, 'json')}>
                        JSON
                      </Menu.Item>
                      <Menu.Item onClick={() => handleExport(report, 'csv')}>
                        CSV
                      </Menu.Item>
                      <Menu.Item onClick={() => handleExport(report, 'xlsx')}>
                        Excel (XLSX)
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(report.id)}
                    loading={deleteMutation.isPending}
                    title={t('reports.delete') || 'Delete'}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

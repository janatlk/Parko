import { Button, Menu } from '@mantine/core'
import { IconDownload, IconFileCode, IconFileDescription, IconFileExport } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface ExportButtonProps {
  onExport: (format: 'json' | 'csv' | 'xlsx' | 'pdf') => void
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Reusable export button component with dropdown menu for format selection
 */
export function ExportButton({ onExport, disabled = false, size = 'sm' }: ExportButtonProps) {
  const { t } = useTranslation()

  return (
    <Menu shadow="md" width={200} disabled={disabled}>
      <Menu.Target>
        <Button
          variant="outline"
          size={size}
          leftSection={<IconFileExport size={16} />}
          disabled={disabled}
        >
          {t('reports.export_as') || 'Export As'}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t('reports.select_format') || 'Select Format'}</Menu.Label>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconFileCode size={16} />}
          onClick={() => onExport('json')}
        >
          {t('reports.export_json') || 'JSON'}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDownload size={16} />}
          onClick={() => onExport('csv')}
        >
          {t('reports.export_csv') || 'CSV'}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDownload size={16} />}
          onClick={() => onExport('xlsx')}
        >
          {t('reports.export_xlsx') || 'Excel (XLSX)'}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFileDescription size={16} />}
          onClick={() => onExport('pdf')}
        >
          {t('reports.export_pdf') || 'PDF'}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

/**
 * Simple export button without dropdown - for quick exports
 */
interface QuickExportButtonProps {
  onExport: () => void
  format: 'csv' | 'xlsx' | 'pdf'
  disabled?: boolean
}

export function QuickExportButton({ onExport, format, disabled = false }: QuickExportButtonProps) {
  const { t } = useTranslation()

  const config = {
    csv: {
      label: 'CSV',
      icon: IconDownload,
      description: t('reports.export_csv') || 'CSV',
    },
    xlsx: {
      label: 'Excel',
      icon: IconDownload,
      description: t('reports.export_xlsx') || 'Excel',
    },
    pdf: {
      label: 'PDF',
      icon: IconFileDescription,
      description: t('reports.export_pdf') || 'PDF',
    },
  }

  const { label, icon: Icon, description } = config[format]

  return (
    <Button
      variant="subtle"
      size="sm"
      leftSection={<Icon size={16} />}
      onClick={onExport}
      disabled={disabled}
      title={description}
    >
      {label}
    </Button>
  )
}

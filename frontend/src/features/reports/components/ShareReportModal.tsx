import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
  Select,
  Text,
  Alert,
} from '@mantine/core'
import { IconAt, IconSend, IconAlertCircle, IconKey } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

import {
  shareReportViaEmail,
  updateEmailSettings,
  type ReportType,
} from '../api/reportsApi'

type Props = {
  opened: boolean
  onClose: () => void
  report: {
    report_type: ReportType
    from_date: string
    to_date: string
  } | null
}

export function ShareReportModal({ opened, onClose, report }: Props) {
  const { t } = useTranslation()
  
  const [recipientEmail, setRecipientEmail] = useState('')
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKey, setApiKey] = useState('')

  const handleShare = async () => {
    if (!report || !recipientEmail) return

    setIsSubmitting(true)
    try {
      await shareReportViaEmail({
        report_type: report.report_type,
        from_date: report.from_date,
        to_date: report.to_date,
        recipient_email: recipientEmail,
        format,
      })

      notifications.show({
        title: t('reports.share_email_success') || 'Report Sent',
        message: `Report sent to ${recipientEmail}`,
        icon: <IconSend />,
        color: 'green',
      })

      setRecipientEmail('')
      onClose()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('reports.share_email_failed') || 'Failed to send report'
      
      // If error is about missing API key, show API key input
      if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('email')) {
        setShowApiKeyInput(true)
      }

      notifications.show({
        title: t('reports.share_email_failed') || 'Failed to Send',
        message,
        icon: <IconAlertCircle />,
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey) return

    try {
      await updateEmailSettings({ email_api_key: apiKey })
      
      notifications.show({
        title: t('reports.email_saved') || 'Settings Saved',
        message: 'Your email API key has been saved',
        icon: <IconKey />,
        color: 'green',
      })

      setShowApiKeyInput(false)
      setApiKey('')
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.response?.data?.message || 'Failed to save API key',
        icon: <IconAlertCircle />,
        color: 'red',
      })
    }
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
      onClose={onClose}
      title={t('reports.share_email_title') || 'Share Report via Email'}
      centered
    >
      <Stack>
        {report && (
          <Alert variant="light" color="blue" icon={<IconAt size={16} />}>
            <Text size="sm" fw={500}>{getReportTypeName(report.report_type)}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              {report.from_date} — {report.to_date}
            </Text>
          </Alert>
        )}

        {showApiKeyInput ? (
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              {t('reports.email_api_key') || 'Email Service API Key'}
            </Text>
            <TextInput
              placeholder={t('reports.email_api_key_placeholder') || 'Enter your API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.currentTarget.value)}
              type="password"
              autoFocus
            />
            <Text size="xs" c="dimmed">
              Enter your email service API key (e.g., SendGrid, Mailgun)
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => setShowApiKeyInput(false)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSaveApiKey}>
                {t('common.save') || 'Save'}
              </Button>
            </Group>
          </Stack>
        ) : (
          <>
            <TextInput
              label={t('reports.share_email') || 'Recipient Email'}
              placeholder={t('reports.share_email_placeholder') || 'Enter recipient email'}
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.currentTarget.value)}
              type="email"
              leftSection={<IconAt size={16} />}
              required
            />

            <Select
              label={t('reports.format') || 'Format'}
              data={[
                { value: 'xlsx', label: 'Excel (XLSX)' },
                { value: 'csv', label: 'CSV' },
                { value: 'pdf', label: 'PDF' },
              ]}
              value={format}
              onChange={(value) => value && setFormat(value as 'csv' | 'xlsx' | 'pdf')}
            />

            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={onClose}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={handleShare}
                loading={isSubmitting}
                leftSection={<IconSend size={16} />}
                disabled={!recipientEmail}
              >
                {t('reports.share_email') || 'Send Report'}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  )
}

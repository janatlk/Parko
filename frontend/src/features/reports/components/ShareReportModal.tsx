import { useState, useEffect } from 'react'
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
  PasswordInput,
  Tooltip,
} from '@mantine/core'
import { IconAt, IconSend, IconAlertCircle, IconKey, IconHelp } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

import {
  shareReportViaEmail,
  updateEmailSettings,
  getEmailSettings,
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
  const [emailService, setEmailService] = useState('sendgrid')
  const [showChangeKey, setShowChangeKey] = useState(false)

  // Check for existing API key when modal opens
  useEffect(() => {
    if (opened) {
      checkEmailSettings()
    }
  }, [opened])

  const checkEmailSettings = async () => {
    try {
      const settings = await getEmailSettings()
      if (settings) {
        setEmailService(settings.email_service || 'sendgrid')
        if (!settings.email_api_key) {
          setShowApiKeyInput(true)
        }
      } else {
        setShowApiKeyInput(true)
      }
    } catch (error) {
      console.error('Error fetching email settings:', error)
      setShowApiKeyInput(true)
    }
  }

  const handleShare = async () => {
    if (!report || !recipientEmail) return

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      notifications.show({
        title: t('reports.invalid_email') || 'Invalid Email',
        message: 'Please enter a valid email address',
        icon: <IconAlertCircle />,
        color: 'orange',
      })
      return
    }

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
      await updateEmailSettings({ email_api_key: apiKey, email_service: emailService })

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
            <Alert variant="light" color="blue" icon={<IconKey size={16} />}>
              <Text size="sm">
                To send reports via email, you need to configure an email service API key.
              </Text>
            </Alert>
            
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {t('reports.email_service') || 'Email Service'}
              </Text>
              <Tooltip
                label={
                  <Stack gap="xs" style={{ maxWidth: 300 }}>
                    <Text fw={700} size="sm">{t('reports.email_service_help') || 'How to get API key?'}</Text>
                    <Text size="xs">{t('reports.email_service_help_sendgrid')}</Text>
                    <Text size="xs">{t('reports.email_service_help_mailgun')}</Text>
                    <Text size="xs">{t('reports.email_service_help_smtp')}</Text>
                  </Stack>
                }
                position="right"
                withArrow
                multiline
                w={320}
              >
                <IconHelp size={16} style={{ cursor: 'pointer' }} color="#666" />
              </Tooltip>
            </Group>
            <Select
              value={emailService}
              onChange={(value) => value && setEmailService(value)}
              data={[
                { value: 'sendgrid', label: 'SendGrid (Recommended)' },
                { value: 'mailgun', label: 'Mailgun' },
                { value: 'smtp', label: 'SMTP (Gmail, etc.)' },
              ]}
            />

            <Text size="sm" fw={500} mt="sm">
              {t('reports.email_api_key') || 'Email Service API Key'}
            </Text>
            <PasswordInput
              placeholder={t('reports.email_api_key_placeholder') || 'Enter your API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.currentTarget.value)}
              autoFocus
            />
            <Text size="xs" c="dimmed">
              {emailService === 'sendgrid' && 'Get your API key from SendGrid dashboard (Settings → API Keys)'}
              {emailService === 'mailgun' && 'Get your API key from Mailgun dashboard'}
              {emailService === 'smtp' && 'For Gmail: Use App Password (not regular password). Enable 2FA first, then go to Google Account → Security → App Passwords'}
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => setShowApiKeyInput(false)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSaveApiKey} disabled={!apiKey}>
                {t('common.save') || 'Save'}
              </Button>
            </Group>
          </Stack>
        ) : (
          <>
            <Group justify="space-between" align="flex-start" mb="xs">
              <Text size="sm" fw={500}>
                {t('reports.email_service') || 'Email Service'}: <Text component="span" fw={700}>{emailService}</Text>
              </Text>
              <Button
                variant="subtle"
                size="xs"
                color="blue"
                onClick={() => setShowChangeKey(true)}
                leftSection={<IconKey size={14} />}
              >
                {t('reports.change_api_key') || 'Change API Key'}
              </Button>
            </Group>

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

        {/* Change API Key Modal */}
        {showChangeKey && (
          <Stack gap="sm" mt="md" p="md" bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <Text size="sm" fw={500}>
              {t('reports.email_service') || 'Email Service'}
            </Text>
            <Select
              value={emailService}
              onChange={(value) => value && setEmailService(value)}
              data={[
                { value: 'sendgrid', label: 'SendGrid' },
                { value: 'mailgun', label: 'Mailgun' },
                { value: 'smtp', label: 'SMTP' },
              ]}
            />

            <Text size="sm" fw={500} mt="sm">
              {t('reports.email_api_key') || 'Email Service API Key'}
            </Text>
            <PasswordInput
              placeholder={t('reports.email_api_key_placeholder') || 'Enter new API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.currentTarget.value)}
              autoFocus
            />
            <Text size="xs" c="dimmed">
              {emailService === 'sendgrid' && 'Get your API key from SendGrid dashboard (Settings → API Keys)'}
              {emailService === 'mailgun' && 'Get your API key from Mailgun dashboard'}
              {emailService === 'smtp' && 'For Gmail: Use App Password (not regular password). Enable 2FA first, then go to Google Account → Security → App Passwords'}
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => { setShowChangeKey(false); setApiKey(''); }}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSaveApiKey} disabled={!apiKey}>
                {t('common.save') || 'Save'}
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}

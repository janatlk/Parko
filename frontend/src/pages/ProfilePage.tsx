import { useState } from 'react'

import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  ThemeIcon,
  Alert,
} from '@mantine/core'
import {
  IconUser,
  IconMail,
  IconBuilding,
  IconShield,
  IconLanguage,
  IconMapPin,
  IconCheck,
  IconX,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useUpdateMeMutation } from '@features/auth/hooks/useMe'
import { LANGUAGES } from '@shared/constants/languages'
import type { Language } from '@shared/constants/languages'
import { showSuccess, showError } from '@shared/utils/toast'

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const updateMe = useUpdateMeMutation()

  const [formData, setFormData] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    region: user?.region ?? '',
    language: user?.language ?? 'ru',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!user) {
    return (
      <Container py="xl">
        <Alert icon={<IconAlertCircle size={20} />} color="gray" title={t('profile.no_data_title') || 'No user data'}>
          {t('profile.no_data_message') || 'User information is not available'}
        </Alert>
      </Container>
    )
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof event === 'string' ? event : event.currentTarget.value
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      const updated = await updateMe.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        region: formData.region,
        language: formData.language as Language,
      })
      setUser(updated)
      showSuccess(t('profile.saved') || 'Profile updated successfully')
    } catch (error) {
      showError(t('profile.save_failed') || 'Failed to update profile')
    }
  }

  const getInitials = () => {
    if (formData.first_name || formData.last_name) {
      return `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}`.toUpperCase()
    }
    return user.username.substring(0, 2).toUpperCase()
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'red',
    MANAGER: 'blue',
    USER: 'gray',
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2} fw={700}>{t('profile.title')}</Title>
            <Text c="dimmed" size="sm">{t('profile.subtitle') || 'Manage your personal information'}</Text>
          </div>
        </Group>

        {/* Profile Card */}
        <Paper withBorder shadow="sm" radius="md" p="xl">
          <Group gap="xl" align="flex-start">
            {/* Avatar Section */}
            <Box style={{ flexShrink: 0 }}>
              <Avatar
                size={120}
                radius={120}
                color="blue"
                variant="filled"
                style={{ border: '4px solid var(--mantine-color-blue-light)' }}
              >
                {getInitials()}
              </Avatar>
              <Group justify="center" mt="md" gap="xs">
                <Badge color={roleColors[user.role] ?? 'gray'} variant="light" size="lg">
                  {user.role}
                </Badge>
                <Badge color={user.is_active ? 'teal' : 'red'} variant="light" size="lg">
                  {user.is_active ? t('users.active') : t('users.inactive')}
                </Badge>
              </Group>
            </Box>

            {/* Info Section */}
            <Box style={{ flex: 1 }}>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                  label={
                    <Group gap="xs">
                      <IconUser size={16} />
                      <Text size="sm" fw={500}>{t('users.first_name')}</Text>
                    </Group>
                  }
                  placeholder={t('users.first_name_placeholder') || 'Enter first name'}
                  value={formData.first_name}
                  onChange={handleInputChange('first_name')}
                  size="sm"
                />
                <TextInput
                  label={
                    <Group gap="xs">
                      <IconUser size={16} />
                      <Text size="sm" fw={500}>{t('users.last_name')}</Text>
                    </Group>
                  }
                  placeholder={t('users.last_name_placeholder') || 'Enter last name'}
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
                  size="sm"
                />
                <TextInput
                  label={
                    <Group gap="xs">
                      <IconMail size={16} />
                      <Text size="sm" fw={500}>{t('users.email')}</Text>
                    </Group>
                  }
                  placeholder={t('users.email_placeholder') || 'email@example.com'}
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={errors.email}
                  size="sm"
                />
                <TextInput
                  label={
                    <Group gap="xs">
                      <IconMapPin size={16} />
                      <Text size="sm" fw={500}>{t('users.region')}</Text>
                    </Group>
                  }
                  placeholder={t('users.region_placeholder') || 'Enter region'}
                  value={formData.region}
                  onChange={handleInputChange('region')}
                  size="sm"
                />
                <Select
                  label={
                    <Group gap="xs">
                      <IconLanguage size={16} />
                      <Text size="sm" fw={500}>{t('users.language')}</Text>
                    </Group>
                  }
                  data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
                  value={formData.language}
                  onChange={(value) => handleInputChange('language')(value || 'ru')}
                  size="sm"
                />
                <div>
                  <Group gap="xs" mb={6}>
                    <IconShield size={16} />
                    <Text size="sm" fw={500}>{t('auth.username')}</Text>
                  </Group>
                  <Text size="sm" c="dimmed" pt={6}>{user.username}</Text>
                </div>
              </SimpleGrid>
            </Box>
          </Group>
        </Paper>

        {/* Company Info */}
        {user.company_name && (
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Group gap="sm">
              <ThemeIcon variant="light" size="lg" color="blue">
                <IconBuilding size={20} />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>{t('users.company') || 'Company'}</Text>
                <Text size="lg" fw={600}>{user.company_name}</Text>
              </div>
            </Group>
          </Paper>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={() => {
              setFormData({
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                email: user.email ?? '',
                region: user.region ?? '',
                language: user.language ?? 'ru',
              })
              setErrors({})
            }}
          >
            <Group gap="xs">
              <IconX size={16} />
              {t('common.cancel')}
            </Group>
          </Button>
          <Button
            loading={updateMe.isPending}
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
          >
            {t('profile.save_changes')}
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}

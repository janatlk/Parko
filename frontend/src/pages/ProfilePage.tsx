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
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  ThemeIcon,
  Divider,
  SimpleGrid,
  useMantineColorScheme,
} from '@mantine/core'
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconSun,
  IconMoon,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@features/auth/hooks/useAuth'
import { useUpdateMeMutation } from '@features/auth/hooks/useMe'
import { LANGUAGES } from '@shared/constants/languages'
import type { Language } from '@shared/constants/languages'
import { showSuccess, showError } from '@shared/utils/toast'

const REGIONS = [
  { value: 'unknown', label: 'Не выбран' },
  { value: 'bishkek', label: 'Бишкек' },
  { value: 'osh', label: 'Ош' },
  { value: 'jalal_abad', label: 'Джалал-Абад' },
  { value: 'naryn', label: 'Нарын' },
  { value: 'talas', label: 'Талас' },
  { value: 'chuy', label: 'Чуйская область' },
  { value: 'issyk_kul', label: 'Иссык-Кульская область' },
  { value: 'batken', label: 'Баткен' },
  { value: 'moscow', label: 'Москва' },
  { value: 'almaty', label: 'Алматы' },
  { value: 'other', label: 'Другой' },
]

const CURRENCIES = [
  { value: 'KGS', label: 'KGS — Киргизский сом' },
  { value: 'USD', label: 'USD — Доллар США' },
  { value: 'EUR', label: 'EUR — Евро' },
  { value: 'RUB', label: 'RUB — Российский рубль' },
]

const ROLE_META: Record<
  string,
  { label: string; color: string; description: string }
> = {
  COMPANY_ADMIN: {
    label: 'Администратор',
    color: 'orange',
    description: 'Полный доступ к управлению компанией',
  },
  DISPATCHER: {
    label: 'Диспетчер',
    color: 'blue',
    description: 'Управление транспортом и маршрутами',
  },
  MECHANIC: {
    label: 'Механик',
    color: 'green',
    description: 'Доступ к ТО и запчастям',
  },
  DRIVER: {
    label: 'Водитель',
    color: 'yellow',
    description: 'Ограниченный доступ к своим данным',
  },
  ACCOUNTANT: {
    label: 'Бухгалтер',
    color: 'grape',
    description: 'Доступ к отчётам и финансам',
  },
  GUEST: {
    label: 'Гость',
    color: 'gray',
    description: 'Только чтение',
  },
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, setUser } = useAuth()
  const { setColorScheme } = useMantineColorScheme()
  const updateMe = useUpdateMeMutation()

  const [formData, setFormData] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    region: user?.region ?? '',
    language: user?.language ?? 'ru',
    currency: user?.currency ?? 'KGS',
    theme: user?.theme ?? 'dark',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Paper withBorder radius="md" p="xl">
          <Group gap="md">
            <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
              <IconAlertCircle size={24} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="lg">
                {t('profile.no_data_title') || 'Нет данных пользователя'}
              </Text>
              <Text c="dimmed" size="sm">
                {t('profile.no_data_message') || 'Информация о пользователе недоступна'}
              </Text>
            </div>
          </Group>
        </Paper>
      </Container>
    )
  }

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement> | string) => {
      const value = typeof event === 'string' ? event : event.currentTarget.value
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }))
      }
    }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalid_email') || 'Неверный формат email'
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
        currency: formData.currency,
        theme: formData.theme as 'light' | 'dark',
      })
      setUser(updated)
      setColorScheme(formData.theme as 'light' | 'dark')
      if (formData.language !== i18n.language) {
        i18n.changeLanguage(formData.language)
      }
      showSuccess(t('profile.saved') || 'Профиль обновлён')
    } catch {
      showError(t('profile.save_failed') || 'Не удалось обновить профиль')
    }
  }

  const getInitials = () => {
    if (formData.first_name || formData.last_name) {
      return `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}`.toUpperCase()
    }
    return user.username.substring(0, 2).toUpperCase()
  }

  const getFullName = () => {
    const parts = [formData.first_name, formData.last_name].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : user.username
  }

  const roleMeta = ROLE_META[user.role] || ROLE_META.GUEST
  const isDirty =
    formData.first_name !== (user.first_name ?? '') ||
    formData.last_name !== (user.last_name ?? '') ||
    formData.email !== (user.email ?? '') ||
    formData.region !== (user.region ?? '') ||
    formData.language !== (user.language ?? 'ru') ||
    formData.currency !== (user.currency ?? 'KGS') ||
    formData.theme !== (user.theme ?? 'system')

  return (
    <Container size="md" py="md" px="sm">
      <Stack gap="md">
        {/* ===== HERO CARD ===== */}
        <Paper
          radius="md"
          p={{ base: 'md', sm: 'xl' }}
          withBorder
        >
          <Group gap="md" align="center" wrap="wrap">
            <Avatar
              size={64}
              radius="xl"
              color={roleMeta.color}
              variant="filled"
              style={{ fontSize: 24, fontWeight: 700 }}
            >
              {getInitials()}
            </Avatar>

            <Box style={{ flex: 1, minWidth: 200 }}>
              <Title order={3} fw={700}>
                {getFullName()}
              </Title>
              <Text c="dimmed" size="sm" mt={2}>
                @{user.username}
                {formData.email && (
                  <>
                    {' · '}
                    {formData.email}
                  </>
                )}
              </Text>
              <Group gap="xs" mt="sm">
                <Badge size="sm" color={roleMeta.color} variant="light">
                  {roleMeta.label}
                </Badge>
                <Badge
                  size="sm"
                  color={user.is_active ? 'green' : 'red'}
                  variant="light"
                >
                  {user.is_active ? t('users.active') || 'Активен' : t('users.inactive') || 'Неактивен'}
                </Badge>
              </Group>
            </Box>
          </Group>
        </Paper>

        {/* ===== PROFILE & SETTINGS ===== */}
        <Paper withBorder radius="md" p={{ base: 'md', sm: 'xl' }}>
          <Title order={5} fw={600} mb="md">
            {t('profile.personal_info') || 'Личные данные'}
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label={t('users.first_name')}
              placeholder={t('users.first_name_placeholder') || 'Введите имя'}
              value={formData.first_name}
              onChange={handleInputChange('first_name')}
            />
            <TextInput
              label={t('users.last_name')}
              placeholder={t('users.last_name_placeholder') || 'Введите фамилию'}
              value={formData.last_name}
              onChange={handleInputChange('last_name')}
            />
            <TextInput
              label={t('users.email')}
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={errors.email}
            />
            <Select
              label={t('users.region')}
              data={REGIONS}
              value={formData.region || 'unknown'}
              onChange={(value) => handleInputChange('region')(value || 'unknown')}
            />
          </SimpleGrid>

          <Divider my="lg" />

          <Title order={5} fw={600} mb="md">
            {t('profile.settings') || 'Настройки'}
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              label={t('users.language')}
              data={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
              value={formData.language}
              onChange={(value) => handleInputChange('language')(value || 'ru')}
            />
            <Select
              label={t('profile.currency')}
              data={CURRENCIES}
              value={formData.currency}
              onChange={(value) => handleInputChange('currency')(value || 'KGS')}
            />
          </SimpleGrid>

          <Box mt="md">
            <Text size="sm" c="dimmed" mb={6}>
              {t('profile.theme') || 'Тема оформления'}
            </Text>
            <SegmentedControl
              value={formData.theme}
              onChange={(value) => handleInputChange('theme')(value)}
              data={[
                {
                  value: 'light',
                  label: (
                    <Group gap={6} justify="center" wrap="nowrap">
                      <IconSun size={16} />
                      <Text size="sm">{t('theme.light')}</Text>
                    </Group>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <Group gap={6} justify="center" wrap="nowrap">
                      <IconMoon size={16} />
                      <Text size="sm">{t('theme.dark')}</Text>
                    </Group>
                  ),
                },
              ]}
              size="sm"
              radius="md"
            />
          </Box>
        </Paper>

        {/* ===== COMPANY & SECURITY ===== */}
        <Paper withBorder radius="md" p={{ base: 'md', sm: 'xl' }}>
          <Title order={5} fw={600} mb="md">
            {t('profile.company') || 'Компания'} &amp; {t('profile.security') || 'Безопасность'}
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {user.company_name && (
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  {t('profile.company')}
                </Text>
                <Text size="md" fw={600}>
                  {user.company_name}
                </Text>
                <Text size="xs" c="dimmed">
                  ID: {user.company}
                </Text>
              </Box>
            )}
            <Box>
              <Text size="sm" c="dimmed" mb={4}>
                {t('auth.username')}
              </Text>
              <Text size="md" fw={600}>
                {user.username}
              </Text>
            </Box>
            <Box>
              <Text size="sm" c="dimmed" mb={4}>
                {t('users.role')}
              </Text>
              <Group gap="xs">
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: `var(--mantine-color-${roleMeta.color}-filled)`,
                  }}
                />
                <Text size="md" fw={600}>
                  {roleMeta.label}
                </Text>
              </Group>
            </Box>
          </SimpleGrid>
        </Paper>

        {/* ===== ACTIONS ===== */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            size="md"
            radius="md"
            disabled={!isDirty}
            onClick={() => {
              setFormData({
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                email: user.email ?? '',
                region: user.region ?? '',
                language: user.language ?? 'ru',
                currency: user.currency ?? 'KGS',
                theme: user.theme ?? 'system',
              })
              setErrors({})
            }}
            leftSection={<IconX size={18} />}
            opacity={isDirty ? 1 : 0.5}
          >
            {t('common.cancel')}
          </Button>
          <Button
            loading={updateMe.isPending}
            leftSection={<IconCheck size={18} />}
            onClick={handleSave}
            disabled={!isDirty}
            size="md"
            radius="md"
            color={isDirty ? 'blue' : 'gray'}
            opacity={isDirty ? 1 : 0.5}
          >
            {t('profile.save_changes')}
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}

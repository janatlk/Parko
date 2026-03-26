import {
  Box,
  Checkbox,
  Drawer,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core'
import { IconLayout, IconSettings, IconTable, IconTypeface } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

type DashboardPreferences = {
  // Main widgets
  showCostChart: boolean
  showActivityFeed: boolean
  showExpiringSoon: boolean
  showFleetStatus: boolean
  showVehicleConsumption: boolean
  // Stat cards
  showOperationalCost: boolean
  showActiveCars: boolean
  showAvgConsumption: boolean
  showMaintenanceCars: boolean
  // Display options
  compactMode: boolean
}

const defaultPreferences: DashboardPreferences = {
  showCostChart: true,
  showActivityFeed: true,
  showExpiringSoon: true,
  showFleetStatus: true,
  showVehicleConsumption: true,
  showOperationalCost: true,
  showActiveCars: true,
  showAvgConsumption: true,
  showMaintenanceCars: true,
  compactMode: false,
}

const STORAGE_KEY = 'parko_dashboard_preferences'

type CustomizationPanelProps = {
  opened: boolean
  onClose: () => void
  preferences: DashboardPreferences
  onPreferencesChange: (prefs: DashboardPreferences) => void
}

export function loadDashboardPreferences(): DashboardPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load dashboard preferences:', e)
  }
  return defaultPreferences
}

export function saveDashboardPreferences(prefs: DashboardPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.error('Failed to save dashboard preferences:', e)
  }
}

export function CustomizationPanel({
  opened,
  onClose,
  preferences,
  onPreferencesChange,
}: CustomizationPanelProps) {
  const { t } = useTranslation()

  const handleToggle = (key: keyof DashboardPreferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] }
    onPreferencesChange(newPrefs)
    saveDashboardPreferences(newPrefs)
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSettings size={20} />
          <Title order={5}>{t('dashboard.customize')}</Title>
        </Group>
      }
      position="right"
      size="md"
    >
      <Stack gap="lg">
        {/* Widget Visibility */}
        <Box>
          <Group gap="xs" mb="sm">
            <IconLayout size={18} />
            <Text fw={600} size="sm">{t('dashboard.visible_widgets')}</Text>
          </Group>
          <Stack gap="sm" pl="md">
            <Checkbox
              label={t('dashboard.cost_breakdown')}
              checked={preferences.showCostChart}
              onChange={() => handleToggle('showCostChart')}
            />
            <Checkbox
              label={t('dashboard.recent_activity')}
              checked={preferences.showActivityFeed}
              onChange={() => handleToggle('showActivityFeed')}
            />
            <Checkbox
              label={t('dashboard.expiring_soon')}
              checked={preferences.showExpiringSoon}
              onChange={() => handleToggle('showExpiringSoon')}
            />
            <Checkbox
              label={t('dashboard.fleet_status')}
              checked={preferences.showFleetStatus}
              onChange={() => handleToggle('showFleetStatus')}
            />
            <Checkbox
              label={t('dashboard.vehicle_consumption')}
              checked={preferences.showVehicleConsumption}
              onChange={() => handleToggle('showVehicleConsumption')}
            />
          </Stack>
        </Box>

        {/* Stat Cards */}
        <Box>
          <Group gap="xs" mb="sm">
            <IconTable size={18} />
            <Text fw={600} size="sm">{t('dashboard.stat_cards')}</Text>
          </Group>
          <Stack gap="sm" pl="md">
            <Checkbox
              label={t('dashboard.total_operational_cost')}
              checked={preferences.showOperationalCost}
              onChange={() => handleToggle('showOperationalCost')}
            />
            <Checkbox
              label={t('dashboard.active_cars')}
              checked={preferences.showActiveCars}
              onChange={() => handleToggle('showActiveCars')}
            />
            <Checkbox
              label={t('dashboard.avg_consumption')}
              checked={preferences.showAvgConsumption}
              onChange={() => handleToggle('showAvgConsumption')}
            />
            <Checkbox
              label={t('dashboard.maintenance_cars')}
              checked={preferences.showMaintenanceCars}
              onChange={() => handleToggle('showMaintenanceCars')}
            />
          </Stack>
        </Box>

        {/* Display Options */}
        <Box>
          <Group gap="xs" mb="sm">
            <IconTypeface size={18} />
            <Text fw={600} size="sm">{t('dashboard.display_options')}</Text>
          </Group>
          <Stack gap="sm" pl="md">
            <Switch
              label={t('dashboard.compact_mode')}
              description={t('dashboard.compact_mode_desc')}
              checked={preferences.compactMode}
              onChange={() => handleToggle('compactMode')}
            />
          </Stack>
        </Box>

        <Box mt="auto">
          <Text size="xs" c="dimmed">{t('dashboard.preferences_saved')}</Text>
        </Box>
      </Stack>
    </Drawer>
  )
}

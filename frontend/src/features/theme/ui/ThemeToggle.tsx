import { SegmentedControl, Box } from '@mantine/core'
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react'
import { useTheme } from '@app/providers/ThemeProvider'
import { useTranslation } from 'react-i18next'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <Box>
      <SegmentedControl
        value={theme}
        onChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
        data={[
          {
            value: 'light',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconSun size={16} />
                <span>{t('theme.light')}</span>
              </div>
            ),
          },
          {
            value: 'dark',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconMoon size={16} />
                <span>{t('theme.dark')}</span>
              </div>
            ),
          },
          {
            value: 'system',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconDeviceDesktop size={16} />
                <span>{t('theme.system')}</span>
              </div>
            ),
          },
        ]}
        size="xs"
      />
    </Box>
  )
}

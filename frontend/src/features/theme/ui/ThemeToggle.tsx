import { SegmentedControl, Box, useMantineColorScheme } from '@mantine/core'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  return (
    <Box>
      <SegmentedControl
        value={colorScheme}
        onChange={(value) => setColorScheme(value as 'light' | 'dark')}
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
        ]}
        size="xs"
      />
    </Box>
  )
}

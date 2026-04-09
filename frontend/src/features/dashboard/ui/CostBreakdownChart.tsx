import { useState, useRef, useCallback, useEffect } from 'react'

import {
  ActionIcon,
  Box,
  Checkbox,
  Group,
  Loader,
  Popover,
  SegmentedControl,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import {
  IconBattery,
  IconCar,
  IconGasStation,
  IconSettings,
  IconTool,
  IconTools,
  IconArrowsDiagonal,
} from '@tabler/icons-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'

import type { CostByMonth } from '../api/dashboardApi'
import { formatPrice } from '@shared/utils/formatPrice'
import { useAuth } from '@features/auth/hooks/useAuth'

type CostCategory = 'fuel' | 'spare' | 'insurance' | 'inspection' | 'tires' | 'accumulator'

type CostBreakdownChartProps = {
  data?: CostByMonth[]
  isLoading?: boolean
  monthsRange?: string
  setMonthsRange?: (months: string) => void
  compact?: boolean
  onResize?: (size: { w: number; h: number } | null) => void
}

type ChartData = {
  name: string
  fuel: number
  spare: number
  insurance: number
  inspection: number
  tires: number
  accumulator: number
  total: number
}

const STORAGE_KEY = 'parko_cost_chart_size'

function getCategoryColors(isDark: boolean): Record<CostCategory, { color: string; icon: React.ReactNode; label: string }> {
  if (isDark) {
    return {
      fuel: { color: '#4dabf7', icon: <IconGasStation size={14} />, label: 'dashboard.fuel' },
      spare: { color: '#ffa94d', icon: <IconTools size={14} />, label: 'dashboard.spare_parts' },
      insurance: { color: '#69db7c', icon: <IconCar size={14} />, label: 'dashboard.insurance' },
      inspection: { color: '#66d9e8', icon: <IconTool size={14} />, label: 'dashboard.inspections' },
      tires: { color: '#b197fc', icon: <IconCar size={14} />, label: 'dashboard.tires' },
      accumulator: { color: '#f783ac', icon: <IconBattery size={14} />, label: 'dashboard.accumulators' },
    }
  }
  return {
    fuel: { color: '#339af0', icon: <IconGasStation size={14} />, label: 'dashboard.fuel' },
    spare: { color: '#ff922b', icon: <IconTools size={14} />, label: 'dashboard.spare_parts' },
    insurance: { color: '#40c057', icon: <IconCar size={14} />, label: 'dashboard.insurance' },
    inspection: { color: '#22b8cf', icon: <IconTool size={14} />, label: 'dashboard.inspections' },
    tires: { color: '#845ef7', icon: <IconCar size={14} />, label: 'dashboard.tires' },
    accumulator: { color: '#f06595', icon: <IconBattery size={14} />, label: 'dashboard.accumulators' },
  }
}

const defaultCategories: Record<CostCategory, boolean> = {
  fuel: true,
  spare: true,
  insurance: true,
  inspection: true,
  tires: true,
  accumulator: true,
}

export function CostBreakdownChart({ data = [], isLoading, monthsRange, setMonthsRange, compact = false, onResize }: CostBreakdownChartProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const currency = user?.currency || 'KGS'
  const [localMonthsRange, setLocalMonthsRange] = useState<string>('6')
  const [opened, setOpened] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Record<CostCategory, boolean>>(defaultCategories)
  const [resizeMode, setResizeMode] = useState(false)
  const savedSize = useRef<{ w: number; h: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const startMouse = useRef({ x: 0, y: 0 })
  const startSize = useRef({ w: 0, h: 0 })
  const currentSize = useRef({ w: 0, h: 0 })

  const displayMonths = monthsRange ?? localMonthsRange
  const handleMonthsChange = setMonthsRange ?? setLocalMonthsRange
  const categoryConfig = getCategoryColors(isDark)

  // Load saved size on mount — NO onResize call here (that causes setState during render)
  const loadSavedSize = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.w > 0) {
          return parsed
        }
      }
    } catch { /* ignore */ }
    return { w: 0, h: compact ? 240 : 300 }
  }, [compact])

  const size = useRef(loadSavedSize()).current

  // Report saved size to parent AFTER mount (not during render)
  useEffect(() => {
    if (size.w > 0) {
      onResize?.(size)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    startMouse.current = { x: e.clientX, y: e.clientY }
    startSize.current = { w: currentSize.current.w || rect.width, h: rect.height }

    const onMove = (ev: MouseEvent) => {
      const dw = ev.clientX - startMouse.current.x
      const dh = ev.clientY - startMouse.current.y
      const newW = Math.max(200, Math.min(1200, startSize.current.w + dw))
      const newH = Math.max(150, Math.min(600, startSize.current.h + dh))
      currentSize.current = { w: newW, h: newH }
      // Directly update container style — no React state
      if (containerRef.current) {
        containerRef.current.style.width = `${newW}px`
        containerRef.current.style.height = `${newH}px`
      }
    }
    const onUp = () => {
      setResizeMode(false)
      const finalSize = { ...currentSize.current }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSize))
      onResize?.(finalSize)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [onResize])

  const handleResetClick = useCallback(() => {
    if (resizeMode) {
      setResizeMode(false)
    } else {
      setResizeMode(true)
    }
  }, [resizeMode])

  const getChartData = (): ChartData[] => {
    if (!data || data.length === 0) return []
    return data.map((item) => ({
      name: item.month_name.substring(0, 3),
      fuel: Math.round(item.fuel_cost),
      spare: Math.round(item.spare_cost),
      insurance: Math.round(item.insurance_cost),
      inspection: Math.round(item.inspection_cost),
      tires: Math.round(item.tires_cost),
      accumulator: Math.round(item.accumulator_cost),
      total: Math.round(item.total_cost),
    }))
  }

  const chartData = getChartData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg={isDark ? '#1a1b1e' : 'white'}
          p="md"
          style={{
            border: `1px solid ${isDark ? '#373A40' : '#dee2e6'}`,
            borderRadius: 'var(--mantine-radius-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Text fw={600} mb="xs">{label}</Text>
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null
            return (
              <Group key={index} justify="space-between" gap="lg">
                <Text style={{ color: entry.color }} size="sm">{entry.name}:</Text>
                <Text fw={600} size="sm">{formatPrice(entry.value, currency)}</Text>
              </Group>
            )
          })}
          <Group justify="space-between" gap="lg" mt="xs" pt="xs" style={{ borderTop: `1px solid ${isDark ? '#373A40' : '#dee2e6'}` }}>
            <Text fw={600} size="sm">{t('dashboard.total')}:</Text>
            <Text fw={700} size="sm">{formatPrice(payload[0]?.payload?.total || 0, currency)}</Text>
          </Group>
        </Box>
      )
    }
    return null
  }

  const handleCategoryToggle = (category: CostCategory) => {
    setVisibleCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
      </Box>
    )
  }

  if (chartData.length === 0) {
    return (
      <Box p="xl" ta="center">
        <Text c="dimmed">{t('dashboard.no_data')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={compact ? 5 : 4}>{t('dashboard.cost_breakdown')}</Title>
        <Group gap="xs">
          <ActionIcon
            variant={resizeMode ? 'filled' : 'subtle'}
            color={resizeMode ? 'blue' : undefined}
            size="sm"
            onClick={handleResetClick}
            title="Resize chart"
          >
            <IconArrowsDiagonal size={16} />
          </ActionIcon>

          <Popover opened={opened} onChange={setOpened} position="bottom-end" withArrow>
            <Popover.Target>
              <ActionIcon
                variant="outline"
                size={compact ? 'sm' : 'md'}
                onClick={() => setOpened(o => !o)}
              >
                <IconSettings size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="xs">
                <Text size="xs" fw={600}>{t('dashboard.visible_categories')}</Text>
                {(Object.keys(categoryConfig) as CostCategory[]).map((cat) => (
                  <Checkbox
                    key={cat}
                    label={t(categoryConfig[cat].label)}
                    checked={visibleCategories[cat]}
                    onChange={() => handleCategoryToggle(cat)}
                    size="xs"
                  />
                ))}
              </Stack>
            </Popover.Dropdown>
          </Popover>

          <SegmentedControl
            value={displayMonths}
            onChange={handleMonthsChange}
            data={[
              { label: '3m', value: '3' },
              { label: '6m', value: '6' },
              { label: '12m', value: '12' },
            ]}
            size={compact ? 'xs' : 'sm'}
          />
        </Group>
      </Group>
      <div
        ref={containerRef}
        style={{
          height: size.h || undefined,
          minHeight: 150,
          maxHeight: 600,
          position: 'relative',
          borderRadius: 'var(--mantine-radius-md)',
          border: resizeMode ? '2px dashed var(--mantine-color-blue-5)' : 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: 'none',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: compact ? 5 : 10, right: compact ? 5 : 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2C2E33' : '#e9ecef'} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: isDark ? '#868e96' : '#495057' }}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#373A40' : '#dee2e6' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: isDark ? '#868e96' : '#495057' }}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#373A40' : '#dee2e6' }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: isDark ? '#adb5bd' : 'inherit' }}
              formatter={(value) => {
                const cat = value as CostCategory
                return <span style={{ color: isDark ? '#adb5bd' : 'inherit' }}>{t(categoryConfig[cat]?.label || value)}</span>
              }}
            />
            {visibleCategories.fuel && (
              <Bar dataKey="fuel" stackId="cost" fill={categoryConfig.fuel.color} name={t(categoryConfig.fuel.label)} radius={[0, 0, 4, 4]} />
            )}
            {visibleCategories.spare && (
              <Bar dataKey="spare" stackId="cost" fill={categoryConfig.spare.color} name={t(categoryConfig.spare.label)} />
            )}
            {visibleCategories.insurance && (
              <Bar dataKey="insurance" stackId="cost" fill={categoryConfig.insurance.color} name={t(categoryConfig.insurance.label)} />
            )}
            {visibleCategories.inspection && (
              <Bar dataKey="inspection" stackId="cost" fill={categoryConfig.inspection.color} name={t(categoryConfig.inspection.label)} />
            )}
            {visibleCategories.tires && (
              <Bar dataKey="tires" stackId="cost" fill={categoryConfig.tires.color} name={t(categoryConfig.tires.label)} />
            )}
            {visibleCategories.accumulator && (
              <Bar dataKey="accumulator" stackId="cost" fill={categoryConfig.accumulator.color} name={t(categoryConfig.accumulator.label)} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>

        {resizeMode && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              cursor: 'nwse-resize',
              zIndex: 10,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <line x1="22" y1="14" x2="14" y2="22" stroke="var(--mantine-color-blue-6)" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="8" x2="8" y2="22" stroke="var(--mantine-color-blue-6)" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="2" x2="2" y2="22" stroke="var(--mantine-color-blue-6)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    </Box>
  )
}

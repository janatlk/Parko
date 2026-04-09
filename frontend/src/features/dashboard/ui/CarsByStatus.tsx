import { useState, useRef, useCallback, useEffect } from 'react'

import { Box, Group, Loader, Text, Title, useMantineColorScheme, ActionIcon } from '@mantine/core'
import { IconArrowsDiagonal } from '@tabler/icons-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'

type CarsByStatusProps = {
  total?: number
  active?: number
  maintenance?: number
  inactive?: number
  isLoading?: boolean
  compact?: boolean
  onResize?: (size: { w: number; h: number } | null) => void
}

const STORAGE_KEY = 'parko_cars_chart_size'

export function CarsByStatus({ total = 0, active = 0, maintenance = 0, inactive = 0, isLoading, compact = false, onResize }: CarsByStatusProps) {
  const { t } = useTranslation()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const [resizeMode, setResizeMode] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startMouse = useRef({ x: 0, y: 0 })
  const startSize = useRef({ w: 0, h: 0 })
  const currentSize = useRef({ w: 0, h: 0 })

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
    return { w: 0, h: compact ? 200 : 260 }
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

  const colors = isDark
    ? { active: '#20c997', maintenance: '#fd7e14', inactive: '#868e96', legendText: '#adb5bd' }
    : { active: '#12b886', maintenance: '#f76707', inactive: '#868e96', legendText: '#495057' }

  const data = [
    { name: t('dashboard.active_cars'), value: active, color: colors.active },
    { name: t('dashboard.maintenance_cars'), value: maintenance, color: colors.maintenance },
    { name: t('dashboard.inactive_cars'), value: inactive, color: colors.inactive },
  ].filter((item) => item.value > 0)

  type CustomLabelProps = {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    percent?: number
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) => {
    if (!cx || !cy || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || percent === undefined) {
      return null
    }
    if (percent < 0.05) return null

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (isLoading) {
    return (
      <Box p={compact ? 'sm' : 'xl'} ta="center">
        <Loader />
      </Box>
    )
  }

  if (total === 0) {
    return (
      <Box p={compact ? 'sm' : 'xl'} ta="center">
        <Text c="dimmed">{t('dashboard.no_cars_data')}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={compact ? 5 : 4}>{t('dashboard.fleet_overview')}</Title>
        <ActionIcon
          variant={resizeMode ? 'filled' : 'subtle'}
          color={resizeMode ? 'blue' : undefined}
          size="sm"
          onClick={handleResetClick}
          title="Resize chart"
        >
          <IconArrowsDiagonal size={16} />
        </ActionIcon>
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              wrapperStyle={{ fontSize: '12px', color: colors.legendText }}
              formatter={(value) => <span style={{ color: colors.legendText }}>{value}</span>}
            />
          </PieChart>
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

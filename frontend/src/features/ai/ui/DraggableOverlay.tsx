import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Text,
  Tooltip as MantineTooltip,
  useMatches,
} from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { IconMaximize, IconMinimize, IconX } from '@tabler/icons-react'

export function DraggableOverlay({
  title,
  icon,
  children,
  inline,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  inline?: boolean
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const dragRef = useRef<{
    isDragging: boolean
    startX: number
    startY: number
    initialX: number
    initialY: number
  } | null>(null)

  const isMobile = useMatches({ base: true, md: false })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current?.isDragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.initialX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.initialY + dy)),
      })
    }
    const handleMouseUp = () => {
      if (dragRef.current) dragRef.current.isDragging = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen) return
    if (isMobile) return
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    }
  }

  if (!isOpen) {
    const button = (
      <MantineTooltip label={t('common.expand', 'Развернуть')}>
        <ActionIcon variant="subtle" onClick={() => setIsOpen(true)}>
          <IconMaximize size={16} />
        </ActionIcon>
      </MantineTooltip>
    )
    if (inline) {
      return (
        <>
          {button}
          {children}
        </>
      )
    }
    return button
  }

  const overlayContent = (
    <Box
      style={{
        position: 'fixed',
        top: isFullscreen ? 0 : position.y,
        left: isFullscreen ? 0 : position.x,
        width: isFullscreen ? '100dvw' : '80vw',
        height: isFullscreen ? '100dvh' : '80vh',
        maxWidth: isFullscreen ? 'none' : 1400,
        maxHeight: isFullscreen ? 'none' : 900,
        zIndex: 20000,
        paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
        paddingLeft: isMobile ? 'env(safe-area-inset-left)' : undefined,
        paddingRight: isMobile ? 'env(safe-area-inset-right)' : undefined,
      }}
    >
      <Paper
        withBorder
        shadow="xl"
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Group
          justify="space-between"
          p="sm"
          style={{ cursor: isFullscreen || isMobile ? 'default' : 'move', userSelect: 'none', flexShrink: 0 }}
          onMouseDown={handleMouseDown}
        >
          <Group gap="xs">
            {icon}
            <Text fw={600}>{title}</Text>
          </Group>
          <Group gap={4}>
            <ActionIcon variant="subtle" onClick={() => setIsFullscreen((f) => !f)}>
              {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
            </ActionIcon>
            <ActionIcon variant="subtle" onClick={() => setIsOpen(false)}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </Group>
        <Box style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
          {children}
        </Box>
      </Paper>
    </Box>
  )

  return createPortal(overlayContent, document.body)
}

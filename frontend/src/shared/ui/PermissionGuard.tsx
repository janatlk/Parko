import type React from 'react'

import { Box, Tooltip } from '@mantine/core'

type PermissionGuardProps = {
  canAccess: boolean
  mode?: 'hide' | 'disable'
  tooltip?: string
  children: React.ReactNode
}

export function PermissionGuard({
  canAccess,
  mode = 'disable',
  tooltip = 'Недоступно для вашей роли',
  children,
}: PermissionGuardProps) {
  if (canAccess) return children

  if (mode === 'hide') return null

  return (
    <Tooltip label={tooltip} withArrow>
      <Box component="span" style={{ display: 'inline-block', cursor: 'not-allowed' }}>
        <Box component="span" style={{ display: 'inline-block', opacity: 0.6, pointerEvents: 'none' }}>
          {children}
        </Box>
      </Box>
    </Tooltip>
  )
}

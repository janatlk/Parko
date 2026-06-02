import {
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Badge,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Menu,
  ActionIcon,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconEye, IconColumns } from '@tabler/icons-react'
import type { ReactNode } from 'react'

export type MobileDetailItem = {
  label: string
  value: ReactNode
}

export type MobileTableCardProps = {
  title: string
  subtitle?: string
  badges?: { label: string; color?: string }[]
  details: MobileDetailItem[]
  actions?: ReactNode
  onClick?: () => void
}

type ModernTableProps = {
  columns: { key: string; title: string; width?: string | number; defaultHidden?: boolean }[]
  data: any[]
  renderRow: (item: any, index: number) => ReactNode
  renderMobileCard?: (item: any, index: number) => ReactNode
  emptyMessage?: string
  withRowNumbers?: boolean
  className?: string
  total?: number
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  showPagination?: boolean
  selectable?: boolean
  selectedIds?: (string | number)[]
  onSelectAll?: (selected: boolean) => void
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (key: string, visible: boolean) => void
  maxHeight?: string | number
}

const PAGE_SIZE_OPTIONS = [
  { value: '5', label: '5 / page' },
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
  { value: '100', label: '100 / page' },
]

export function ModernTable({
  columns,
  data,
  renderRow,
  renderMobileCard: _renderMobileCard,
  emptyMessage = 'No data available',
  withRowNumbers = false,
  total,
  page = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  showPagination = true,
  selectable = false,
  selectedIds = [],
  onSelectAll,
  columnVisibility,
  onColumnVisibilityChange,
  maxHeight = '60vh',
}: ModernTableProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const totalPages = total && pageSize ? Math.ceil(total / pageSize) : 1
  const allSelected = data.length > 0 && data.every((item) => selectedIds.includes(item.id))

  const visibleColumns = columns.filter((col) => {
    if (columnVisibility && col.key in columnVisibility) {
      return columnVisibility[col.key]
    }
    return !col.defaultHidden
  })

  const hasColumnVisibility = columnVisibility !== undefined && onColumnVisibilityChange !== undefined

  if (!data || data.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl" style={{ textAlign: 'center' }}>
        <Group justify="center" gap="sm" mb="xs">
          <ThemeIcon variant="light" size="lg" radius="xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" x2="21" y1="6" y2="6" />
              <line x1="8" x2="21" y1="12" y2="12" />
              <line x1="8" x2="21" y1="18" y2="18" />
              <line x1="3" x2="3.01" y1="6" y2="6" />
              <line x1="3" x2="3.01" y1="12" y2="12" />
              <line x1="3" x2="3.01" y1="18" y2="18" />
            </svg>
          </ThemeIcon>
        </Group>
        <Text c="dimmed" size="sm">
          {emptyMessage}
        </Text>
      </Paper>
    )
  }

  return (
    <>
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <Box style={{ overflowX: 'auto', maxHeight, overflowY: 'auto' }}>
          <Table highlightOnHover style={{ minWidth: 600 }} stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  {selectable && (
                    <Table.Th style={{ width: 40, textAlign: 'center' }}>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="sm"
                          checked={allSelected}
                          onChange={(e) => onSelectAll?.(e.currentTarget.checked)}
                          aria-label="Select all"
                        />
                      </div>
                    </Table.Th>
                  )}
                  {withRowNumbers && (
                    <Table.Th style={{ width: 50, textAlign: 'center' }}>#</Table.Th>
                  )}
                  {visibleColumns.map((col) => (
                    <Table.Th key={col.key} style={{ width: col.width }}>
                      {col.title}
                    </Table.Th>
                  ))}
                  {hasColumnVisibility && (
                    <Table.Th style={{ width: 40, textAlign: 'right' }}>
                      <Menu position="bottom-end" withArrow shadow="md">
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm" title="Toggle columns">
                            <IconColumns size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Columns</Menu.Label>
                          {columns.map((col) => (
                            <Menu.Item
                              key={col.key}
                              onClick={() =>
                                onColumnVisibilityChange?.(col.key, !columnVisibility?.[col.key])
                              }
                              leftSection={
                                columnVisibility?.[col.key] !== false ? (
                                  <IconEye size={14} />
                                ) : (
                                  <Box style={{ width: 14 }} />
                                )
                              }
                            >
                              {col.title || col.key}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Th>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((item, index) => renderRow(item, index))}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>

      {showPagination && (total !== undefined || onPageChange || onPageSizeChange) && (
        <Group justify="space-between" align="center" mt="md" wrap="wrap" gap="sm">
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              Show:
            </Text>
            <Select
              value={String(pageSize)}
              onChange={(value) => onPageSizeChange?.(Number(value))}
              data={PAGE_SIZE_OPTIONS}
              w={100}
              size="xs"
              allowDeselect={false}
            />
          </Group>

          {isDesktop ? (
            <Group gap="xs" wrap="wrap">
              {totalPages > 1 && (
                <>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => onPageChange?.(1)}
                    disabled={page === 1}
                  >
                    « First
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => onPageChange?.(page - 1)}
                    disabled={page === 1}
                  >
                    &lt; Prev
                  </Button>
                </>
              )}

              <Group gap="sm">
                {total !== undefined && (
                  <Text size="sm" c="dimmed">
                    Total: {total}
                  </Text>
                )}
                {totalPages > 1 && (
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Page {page} of {totalPages}
                    </Text>
                    <Select
                      value={String(page)}
                      onChange={(value) => onPageChange?.(Number(value))}
                      data={Array.from({ length: totalPages }, (_, i) => ({
                        value: String(i + 1),
                        label: String(i + 1),
                      }))}
                      w={80}
                      size="xs"
                      allowDeselect={false}
                    />
                  </Group>
                )}
              </Group>

              {totalPages > 1 && (
                <>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => onPageChange?.(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next &gt;
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => onPageChange?.(totalPages)}
                    disabled={page === totalPages}
                  >
                    Last »
                  </Button>
                </>
              )}
            </Group>
          ) : (
            <Group gap="xs" justify="center" style={{ flex: 1 }}>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => onPageChange?.(page - 1)}
                disabled={page === 1}
              >
                &lt; Prev
              </Button>
              <Text size="sm" c="dimmed">
                Page {page} of {totalPages}
              </Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => onPageChange?.(page + 1)}
                disabled={page === totalPages}
              >
                Next &gt;
              </Button>
            </Group>
          )}
        </Group>
      )}
    </>
  )
}

export function ModernTableRow({
  cells,
  onClick,
  selectable,
  selected,
  onSelect,
  columnVisibility,
}: {
  cells: ReactNode[]
  onClick?: () => void
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
  columnVisibility?: Record<string, boolean>
}) {
  const filteredCells = columnVisibility
    ? cells.filter((cell) => {
        const key = (cell as any)?.key
        if (typeof key === 'string' && key in columnVisibility) {
          return columnVisibility[key] !== false
        }
        return true
      })
    : cells

  return (
    <Table.Tr
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
      }}
    >
      {selectable && (
        <Table.Td style={{ width: 40, textAlign: 'center' }}>
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              size="sm"
              checked={selected}
              onChange={() => {
                onSelect?.()
              }}
              aria-label="Select row"
            />
          </div>
        </Table.Td>
      )}
      {filteredCells}
    </Table.Tr>
  )
}

export function TableCell({
  children,
  align = 'left',
  fw,
  c,
}: {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  fw?: number
  c?: string
}) {
  return (
    <Table.Td style={{ textAlign: align, fontWeight: fw, color: c }}>
      {children}
    </Table.Td>
  )
}

export function TableCellBadge({
  children,
  color = 'gray',
}: {
  children: ReactNode
  color?: string
}) {
  return (
    <Table.Td>
      <Box
        component="span"
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: `var(--mantine-color-${color}-light)`,
          color: `var(--mantine-color-${color}-filled)`,
        }}
      >
        {children}
      </Box>
    </Table.Td>
  )
}

export function MobileTableCard({
  title,
  subtitle,
  badges,
  details,
  actions,
  onClick,
  selectable,
  selected,
  onSelect,
}: MobileTableCardProps & {
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <Card
      withBorder
      radius="md"
      p="sm"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap="xs">
          {selectable && (
            <Checkbox
              size="sm"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation()
                onSelect?.()
              }}
              aria-label="Select row"
              style={{ flexShrink: 0 }}
            />
          )}
          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={600} truncate>
              {title}
            </Text>
            {subtitle && (
              <Text size="xs" c="dimmed" truncate>
                {subtitle}
              </Text>
            )}
          </Stack>
          {actions && (
            <Group gap="xs" wrap="nowrap">
              {actions}
            </Group>
          )}
        </Group>

        {badges && badges.length > 0 && (
          <Group gap="xs" wrap="wrap">
            {badges.map((b, i) => (
              <Badge key={i} size="xs" variant="light" color={b.color || 'blue'}>
                {b.label}
              </Badge>
            ))}
          </Group>
        )}

        <Stack gap={4}>
          {details.map((d, i) => (
            <Group key={i} justify="space-between" wrap="nowrap" gap="xs">
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                {d.label}
              </Text>
              <Text size="xs" fw={500} truncate style={{ textAlign: 'right' }}>
                {d.value}
              </Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

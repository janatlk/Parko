import { Box, Button, Group, Paper, Select, Table, Text, ThemeIcon } from '@mantine/core'
import type { ReactNode } from 'react'

type ModernTableProps = {
  columns: { key: string; title: string; width?: string | number }[]
  data: any[]
  renderRow: (item: any, index: number) => ReactNode
  emptyMessage?: string
  withRowNumbers?: boolean
  className?: string
  total?: number
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  showPagination?: boolean
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
  emptyMessage = 'No data available',
  withRowNumbers = false,
  total,
  page = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  showPagination = true,
}: ModernTableProps) {
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

  const totalPages = total && pageSize ? Math.ceil(total / pageSize) : 1

  return (
    <>
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {withRowNumbers && (
                <Table.Th style={{ width: 50, textAlign: 'center' }}>#</Table.Th>
              )}
              {columns.map((col) => (
                <Table.Th key={col.key} style={{ width: col.width }}>
                  {col.title}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item, index) => renderRow(item, index))}
          </Table.Tbody>
        </Table>
      </Paper>

      {showPagination && (total !== undefined || onPageChange || onPageSizeChange) && (
        <Group justify="space-between" align="center" mt="md">
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

          <Group gap="xs">
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
        </Group>
      )}
    </>
  )
}

export function ModernTableRow({
  cells,
  onClick,
}: {
  cells: ReactNode[]
  onClick?: () => void
}) {
  return (
    <Table.Tr
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
      }}
    >
      {cells}
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

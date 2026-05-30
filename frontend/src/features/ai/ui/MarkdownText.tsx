import { memo, useMemo, useRef, type CSSProperties } from 'react'

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ActionIcon, Box, Code, Group, Paper, Table, Text, Tooltip as MantineTooltip } from '@mantine/core'
import { IconChartBar, IconDownload, IconTable } from '@tabler/icons-react'

interface MarkdownTextProps {
  content: string
  isUser?: boolean
}

type StructuredTableData = {
  type: 'table'
  title?: string
  headers: string[]
  rows: Array<Array<string | number | null>>
  filename?: string
}

type ChartPoint = {
  label: string
  value: number
}

type StructuredChartSeries = {
  name: string
  color?: string
  points: ChartPoint[]
}

type StructuredChartData = {
  type: 'chart'
  title?: string
  chart_type: 'bar' | 'line' | 'pie' | 'area' | 'radar'
  x_label?: string
  y_label?: string
  filename?: string
  series: StructuredChartSeries[]
}

type StructuredData = StructuredTableData | StructuredChartData

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#ea580c']

function sanitizeStyle(styleValue: unknown): CSSProperties | undefined {
  if (!styleValue) return undefined
  if (typeof styleValue === 'object') {
    const styleObject = styleValue as Record<string, unknown>
    const sanitized: CSSProperties = {}
    if (typeof styleObject.color === 'string') sanitized.color = styleObject.color
    if (typeof styleObject.backgroundColor === 'string') {
      sanitized.backgroundColor = styleObject.backgroundColor
    }
    if (typeof styleObject.fontWeight === 'string' || typeof styleObject.fontWeight === 'number') {
      sanitized.fontWeight = styleObject.fontWeight as CSSProperties['fontWeight']
    }
    if (typeof styleObject.fontStyle === 'string') sanitized.fontStyle = styleObject.fontStyle
    return sanitized
  }
  if (typeof styleValue !== 'string') return undefined

  const allowedProperties = new Set(['color', 'background-color', 'font-weight', 'font-style'])
  const sanitized: CSSProperties = {}
  for (const rawStyle of styleValue.split(';')) {
    const [rawProp, rawValue] = rawStyle.split(':')
    const prop = rawProp?.trim().toLowerCase()
    const value = rawValue?.trim()
    if (!prop || !value || !allowedProperties.has(prop)) continue

    if (prop === 'color') sanitized.color = value
    if (prop === 'background-color') sanitized.backgroundColor = value
    if (prop === 'font-weight') sanitized.fontWeight = value as CSSProperties['fontWeight']
    if (prop === 'font-style') sanitized.fontStyle = value
  }

  return sanitized
}

function extractJsonObjects(text: string): { json: string; start: number; end: number }[] {
  const results: { json: string; start: number; end: number }[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escape = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\') {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{') {
      if (depth === 0) start = i
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        results.push({ json: text.slice(start, i + 1), start, end: i + 1 })
        start = -1
      }
    }
  }

  return results
}

function tryParseStructuredData(code: string): StructuredData | null {
  try {
    // Try parsing as-is first
    let parsed: unknown
    try {
      parsed = JSON.parse(code)
    } catch {
      // If failed, remove all whitespace/newlines and try again
      // This handles AI-generated JSON with accidental line breaks inside ```json blocks
      const compact = code.replace(/\s+/g, ' ').trim()
      parsed = JSON.parse(compact)
    }

    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) return null

    const p = parsed as Record<string, unknown>

    if (p.type === 'table' && Array.isArray(p.headers) && Array.isArray(p.rows)) {
      return p as StructuredTableData
    }

    if (p.type === 'chart' && Array.isArray(p.series)) {
      return p as StructuredChartData
    }
  } catch {
    return null
  }

  return null
}

function escapeCsvValue(value: string | number | null): string {
  const raw = value === null || value === undefined ? '' : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function tableToCsv(data: StructuredTableData): string {
  const headerLine = data.headers.map(escapeCsvValue).join(',')
  const rowLines = data.rows.map((row) => row.map(escapeCsvValue).join(','))
  return [headerLine, ...rowLines].join('\n')
}

function chartToCsv(data: StructuredChartData): string {
  const labels = Array.from(
    new Set(data.series.flatMap((series) => series.points.map((point) => point.label))),
  )
  const headerLine = ['Label', ...data.series.map((series) => series.name)]
  const rowLines = labels.map((label) => {
    const cells = [label]
    for (const series of data.series) {
      const point = series.points.find((item) => item.label === label)
      cells.push(point ? String(point.value) : '')
    }
    return cells.map(escapeCsvValue).join(',')
  })

  return [headerLine.map(escapeCsvValue).join(','), ...rowLines].join('\n')
}

async function downloadSvgAsPng(svgElement: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgElement)
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)
  const image = new Image()

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to load chart SVG'))
    image.src = svgUrl
  })

  const rect = svgElement.getBoundingClientRect()
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(Math.ceil(rect.width), 800)
  canvas.height = Math.max(Math.ceil(rect.height), 400)

  const context = canvas.getContext('2d')
  if (!context) {
    URL.revokeObjectURL(svgUrl)
    throw new Error('Canvas context is not available')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  URL.revokeObjectURL(svgUrl)

  const pngUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = pngUrl
  link.download = filename
  link.click()
}

const StructuredDataTable = memo(function StructuredDataTable({ data }: { data: StructuredTableData }) {
  const title = data.title || 'Table'
  const filenameBase = (data.filename || title || 'ai-table').replace(/[^\w-]+/g, '_')

  return (
    <Paper withBorder p="sm" radius="md" style={{ margin: '12px 0', overflowX: 'auto' }}>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconTable size={16} />
          <Text size="sm" fw={600}>
            {title}
          </Text>
        </Group>
        <MantineTooltip label="Скачать CSV">
          <ActionIcon
            variant="subtle"
            onClick={() => downloadTextFile(`${filenameBase}.csv`, tableToCsv(data), 'text/csv;charset=utf-8')}
          >
            <IconDownload size={16} />
          </ActionIcon>
        </MantineTooltip>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            {data.headers.map((header, index) => (
              <Table.Th key={index} style={{ whiteSpace: 'nowrap' }}>
                {header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.rows.map((row, rowIndex) => (
            <Table.Tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <Table.Td key={cellIndex} style={{ whiteSpace: 'nowrap' }}>
                  {cell === null || cell === undefined ? '—' : String(cell)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
})

const StructuredChart = memo(function StructuredChart({ data }: { data: StructuredChartData }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const title = data.title || 'Chart'
  const filenameBase = (data.filename || title || 'ai-chart').replace(/[^\w-]+/g, '_')

  const chartRows = useMemo(() => {
    const labels = Array.from(
      new Set(data.series.flatMap((series) => series.points.map((point) => point.label))),
    )

    return labels.map((label) => {
      const row: Record<string, string | number> = { label }
      data.series.forEach((series) => {
        const point = series.points.find((item) => item.label === label)
        row[series.name] = point?.value ?? 0
      })
      return row
    })
  }, [data.series])

  const pieRows = useMemo(() => {
    const primary = data.series[0]
    return (primary?.points || []).map((point, index) => ({
      name: point.label,
      value: point.value,
      fill: primary?.color || COLORS[index % COLORS.length],
    }))
  }, [data.series])

  const handleDownloadPng = async () => {
    const svgElement = wrapperRef.current?.querySelector('svg')
    if (!svgElement) return
    await downloadSvgAsPng(svgElement, `${filenameBase}.png`)
  }

  return (
    <Paper withBorder p="sm" radius="md" style={{ margin: '12px 0' }}>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconChartBar size={16} />
          <Text size="sm" fw={600}>
            {title}
          </Text>
        </Group>
        <Group gap={4}>
          <MantineTooltip label="Скачать CSV">
            <ActionIcon
              variant="subtle"
              onClick={() => downloadTextFile(`${filenameBase}.csv`, chartToCsv(data), 'text/csv;charset=utf-8')}
            >
              <IconTable size={16} />
            </ActionIcon>
          </MantineTooltip>
          <MantineTooltip label="Скачать PNG">
            <ActionIcon variant="subtle" onClick={() => void handleDownloadPng()}>
              <IconDownload size={16} />
            </ActionIcon>
          </MantineTooltip>
        </Group>
      </Group>

      <Box ref={wrapperRef} style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          {data.chart_type === 'line' ? (
            <LineChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" label={data.x_label ? { value: data.x_label, position: 'insideBottom', offset: -4 } : undefined} />
              <YAxis label={data.y_label ? { value: data.y_label, angle: -90, position: 'insideLeft' } : undefined} />
              <Tooltip />
              <Legend />
              {data.series.map((series, index) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={series.color || COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : data.chart_type === 'area' ? (
            <AreaChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" label={data.x_label ? { value: data.x_label, position: 'insideBottom', offset: -4 } : undefined} />
              <YAxis label={data.y_label ? { value: data.y_label, angle: -90, position: 'insideLeft' } : undefined} />
              <Tooltip />
              <Legend />
              {data.series.map((series, index) => (
                <Area
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={series.color || COLORS[index % COLORS.length]}
                  fill={series.color || COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : data.chart_type === 'radar' ? (
            <RadarChart data={chartRows} outerRadius={100}>
              <PolarGrid />
              <PolarAngleAxis dataKey="label" />
              <PolarRadiusAxis />
              <Tooltip />
              <Legend />
              {data.series.map((series, index) => (
                <Radar
                  key={series.name}
                  name={series.name}
                  dataKey={series.name}
                  stroke={series.color || COLORS[index % COLORS.length]}
                  fill={series.color || COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                />
              ))}
            </RadarChart>
          ) : data.chart_type === 'pie' ? (
            <PieChart>
              <Pie data={pieRows} dataKey="value" nameKey="name" outerRadius={100} label>
                {pieRows.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" label={data.x_label ? { value: data.x_label, position: 'insideBottom', offset: -4 } : undefined} />
              <YAxis label={data.y_label ? { value: data.y_label, angle: -90, position: 'insideLeft' } : undefined} />
              <Tooltip />
              <Legend />
              {data.series.map((series, index) => (
                <Bar
                  key={series.name}
                  dataKey={series.name}
                  fill={series.color || COLORS[index % COLORS.length]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
})

function renderStructuredData(structured: StructuredData) {
  if (structured.type === 'table') {
    return <StructuredDataTable data={structured} />
  }

  if (structured.type === 'chart') {
    return <StructuredChart data={structured} />
  }

  return null
}

const markdownComponents = {
  span: ({ children, ...props }: { children?: React.ReactNode; style?: React.CSSProperties }) => {
    const style = sanitizeStyle(props.style)
    return <span style={style}>{children}</span>
  },
  strong: ({ children }: { children?: React.ReactNode }) => (
    <Text component="span" fw={700} inherit>
      {children}
    </Text>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <Text component="em" inherit>{children}</Text>,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      const codeStr = String(children).replace(/\n$/, '')
      const structured = tryParseStructuredData(codeStr)
      if (structured) {
        return renderStructuredData(structured)
      }
      return (
        <Code block style={{ margin: '8px 0', fontSize: '0.85em' }}>
          {codeStr}
        </Code>
      )
    }
    return (
      <Code style={{ fontSize: '0.85em', padding: '2px 6px' }}>
        {children}
      </Code>
    )
  },
  h1: ({ children }: { children?: React.ReactNode }) => <Text size="xl" fw={700} mt="xs" mb="xs">{children}</Text>,
  h2: ({ children }: { children?: React.ReactNode }) => <Text size="lg" fw={700} mt="xs" mb="xs">{children}</Text>,
  h3: ({ children }: { children?: React.ReactNode }) => <Text size="md" fw={700} mt="xs" mb="xs">{children}</Text>,
  h4: ({ children }: { children?: React.ReactNode }) => <Text size="sm" fw={700} mt="xs" mb="4">{children}</Text>,
  ul: ({ children }: { children?: React.ReactNode }) => (
    <Box component="ul" style={{ margin: '8px 0', paddingLeft: 20 }}>
      {children}
    </Box>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <Box component="ol" style={{ margin: '8px 0', paddingLeft: 20 }}>
      {children}
    </Box>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <Text component="li" size="sm" style={{ marginBottom: 4 }}>
      {children}
    </Text>
  ),
  table: () => null,
  thead: () => null,
  tbody: () => null,
  tr: () => null,
  th: () => null,
  td: () => null,
  hr: () => (
    <Box
      component="hr"
      style={{
        border: 'none',
        borderTop: '1px solid var(--mantine-color-gray-3)',
        margin: '12px 0',
      }}
    />
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <Box
      style={{
        borderLeft: '3px solid var(--mantine-color-blue-5)',
        paddingLeft: 12,
        margin: '8px 0',
        color: 'var(--mantine-color-dimmed)',
      }}
    >
      {children}
    </Box>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <Text
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      c="blue"
      inherit
      style={{ textDecoration: 'underline' }}
    >
      {children}
    </Text>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <Text size="sm" style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>
      {children}
    </Text>
  ),
}

export const MarkdownText = memo(function MarkdownText({ content, isUser }: MarkdownTextProps) {
  const safeContent = typeof content === 'string' ? content : ''
  if (isUser || !safeContent) {
    return (
      <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
        {safeContent || ''}
      </Text>
    )
  }

  // Clean up inline ```json markers that AI sometimes embeds inside sentences
  let cleanedContent = safeContent.replace(/```json\s*/gi, '\n').replace(/```/g, '').trim()

  // Find all JSON objects in text and try to render table/chart inline
  const jsonObjects = extractJsonObjects(cleanedContent)
  const structuredParts: { type: 'text' | 'structured'; content: string; data?: StructuredData }[] = []
  let lastIndex = 0

  for (const { json, start, end } of jsonObjects) {
    const structured = tryParseStructuredData(json)
    if (structured) {
      if (start > lastIndex) {
        const textPart = cleanedContent.slice(lastIndex, start).trim()
        if (textPart) structuredParts.push({ type: 'text', content: textPart })
      }
      structuredParts.push({ type: 'structured', content: json, data: structured })
      lastIndex = end
    }
  }

  if (lastIndex < cleanedContent.length) {
    const textPart = cleanedContent.slice(lastIndex).trim()
    if (textPart) structuredParts.push({ type: 'text', content: textPart })
  }

  // If we found structured data inline, render text + structured parts
  if (structuredParts.length > 1 || (structuredParts.length === 1 && structuredParts[0].type === 'structured')) {
    return (
      <Box style={{ lineHeight: 1.6 }}>
        {structuredParts.map((part, idx) => {
          if (part.type === 'structured' && part.data) {
            return <Box key={idx} my="xs">{renderStructuredData(part.data)}</Box>
          }
          return (
            <Box key={idx} className="markdown-content">
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {part.content}
              </ReactMarkdown>
            </Box>
          )
        })}
      </Box>
    )
  }

  const lines = cleanedContent.split('\n')
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) return false
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) return false
    return true
  })
  const finalContent = filteredLines.join('\n')

  const trimmed = finalContent.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const structured = tryParseStructuredData(trimmed)
    if (structured) {
      return renderStructuredData(structured)
    }
  }

  return (
    <Box className="markdown-content" style={{ lineHeight: 1.6 }}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {cleanedContent}
      </ReactMarkdown>
    </Box>
  )
})

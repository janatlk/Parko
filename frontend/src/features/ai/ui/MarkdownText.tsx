import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import { Box, Code, Table, Text } from '@mantine/core'

interface MarkdownTextProps {
  content: string
  isUser?: boolean
}

// Sanitize style attributes to only allow color property
function sanitizeStyle(styleStr: string): string {
  if (!styleStr) return ''
  const allowedProperties = ['color', 'background-color', 'font-weight', 'font-style']
  const styles = styleStr.split(';').filter(Boolean)
  const sanitized = styles.filter((style) => {
    const prop = style.split(':')[0]?.trim().toLowerCase()
    return allowedProperties.includes(prop)
  })
  return sanitized.join('; ')
}

// Check if a code block is a structured data JSON (table, chart, etc.)
function tryParseStructuredData(code: string): { type: string; data: any } | null {
  try {
    const parsed = JSON.parse(code)
    if (parsed && typeof parsed === 'object') {
      if (parsed.type === 'table' && parsed.headers && parsed.rows) {
        return { type: 'table', data: parsed }
      }
      if (parsed.type && parsed.data) {
        return { type: parsed.type, data: parsed.data }
      }
    }
  } catch {
    // not JSON
  }
  return null
}

function StructuredDataTable({ data }: { data: { headers: string[]; rows: string[][] } }) {
  return (
    <Table striped highlightOnHover withTableBorder size="sm" style={{ margin: '12px 0' }}>
      <Table.Thead>
        <Table.Tr>
          {data.headers.map((h, i) => (
            <Table.Th key={i} style={{ whiteSpace: 'nowrap' }}>{h}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.rows.map((row, ri) => (
          <Table.Tr key={ri}>
            {row.map((cell, ci) => (
              <Table.Td key={ci} style={{ whiteSpace: 'nowrap' }}>{cell}</Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

export function MarkdownText({ content, isUser }: MarkdownTextProps) {
  if (isUser || !content) {
    return <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{content || ''}</Text>
  }

  // Remove raw markdown table lines (pipes) before rendering
  const lines = content.split('\n')
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim()
    // Skip lines that are purely markdown table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) return false
    // Skip separator lines like |---|---|
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) return false
    return true
  })
  const cleanedContent = filteredLines.join('\n')

  const trimmed = cleanedContent.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const structured = tryParseStructuredData(trimmed)
    if (structured?.type === 'table') {
      return <StructuredDataTable data={structured.data} />
    }
  }

  return (
    <Box className="markdown-content" style={{ lineHeight: 1.6 }}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          span: ({ children, ...props }) => {
            // Allow span tags with sanitized inline styles for colors
            const style = props.style ? sanitizeStyle(props.style as string) : undefined
            return <span style={style}>{children}</span>
          },
          strong: ({ children }) => <Text component="span" fw={700} inherit>{children}</Text>,
          em: ({ children }) => <Text component="em" inherit>{children}</Text>,
          code: ({ children, className }: any) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              const codeStr = String(children).replace(/\n$/, '')
              const structured = tryParseStructuredData(codeStr)
              if (structured?.type === 'table') {
                return <StructuredDataTable data={structured.data} />
              }
              return <Code block style={{ margin: '8px 0', fontSize: '0.85em' }}>{codeStr}</Code>
            }
            return <Code style={{ fontSize: '0.85em', padding: '2px 6px' }}>{children}</Code>
          },
          h1: ({ children }) => <Text size="xl" fw={700} mt="xs" mb="xs">{children}</Text>,
          h2: ({ children }) => <Text size="lg" fw={700} mt="xs" mb="xs">{children}</Text>,
          h3: ({ children }) => <Text size="md" fw={700} mt="xs" mb="xs">{children}</Text>,
          h4: ({ children }) => <Text size="sm" fw={700} mt="xs" mb="4">{children}</Text>,
          ul: ({ children }) => <Box component="ul" style={{ margin: '8px 0', paddingLeft: 20 }}>{children}</Box>,
          ol: ({ children }) => <Box component="ol" style={{ margin: '8px 0', paddingLeft: 20 }}>{children}</Box>,
          li: ({ children }) => <Text component="li" size="sm" style={{ marginBottom: 4 }}>{children}</Text>,
          table: () => null,
          thead: () => null,
          tbody: () => null,
          tr: () => null,
          th: () => null,
          td: () => null,
          hr: () => <Box component="hr" style={{ border: 'none', borderTop: '1px solid var(--mantine-color-gray-3)', margin: '12px 0' }} />,
          blockquote: ({ children }) => (
            <Box style={{ borderLeft: '3px solid var(--mantine-color-blue-5)', paddingLeft: 12, margin: '8px 0', color: 'var(--mantine-color-dimmed)' }}>
              {children}
            </Box>
          ),
          a: ({ children, href }) => (
            <Text component="a" href={href} target="_blank" rel="noopener noreferrer" c="blue" inherit style={{ textDecoration: 'underline' }}>
              {children}
            </Text>
          ),
          p: ({ children }) => <Text size="sm" style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{children}</Text>,
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </Box>
  )
}

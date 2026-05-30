export type ActionPayload = {
  action: string
  params: Record<string, unknown>
  description: string
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

function cleanText(text: string): string {
  text = text.replace(/```json\s*/gi, '').replace(/```/g, '')
  text = text.replace(/undefined/gi, '').trim()
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/\s{2,}/g, ' ')
  return text.trim()
}

export function parseActionsFromContent(content: unknown): { text: string; actions: ActionPayload[] } {
  const actions: ActionPayload[] = []
  let text = typeof content === 'string' ? content : ''

  const jsonObjects = extractJsonObjects(text)
  const toRemove: { start: number; end: number }[] = []

  for (const { json, start, end } of jsonObjects) {
    try {
      const parsed = JSON.parse(json)
      if (parsed && typeof parsed === 'object' && parsed.action) {
        // Normalize: ensure params exists (some actions like tool_delete_record may have fields at top level)
        if (!parsed.params && parsed.model_name && parsed.record_id) {
          parsed.params = { model_name: parsed.model_name, record_id: parsed.record_id }
        }
        if (parsed.params) {
          actions.push(parsed as ActionPayload)
          toRemove.push({ start, end })
        }
      }
    } catch {
      // not valid JSON, skip
    }
  }

  // Remove action JSON objects from text (process in reverse order to keep indices valid)
  for (let i = toRemove.length - 1; i >= 0; i--) {
    const { start, end } = toRemove[i]
    text = text.slice(0, start) + text.slice(end)
  }

  text = cleanText(text)

  return { text: text || actions[0]?.description || '', actions }
}

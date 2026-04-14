export type ActionPayload = {
  action: string
  params: Record<string, unknown>
  description: string
}

export function parseActionsFromContent(content: string): { text: string; actions: ActionPayload[] } {
  const actions: ActionPayload[] = []
  let text = content

  // 1. Try to find ```json ... ``` code blocks
  const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/g
  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      if (parsed.action && parsed.params) {
        actions.push(parsed)
      }
    } catch {
      // not valid JSON, skip
    }
  }

  // 2. If no code blocks found, try to find individual JSON objects line by line
  if (actions.length === 0) {
    const lines = content.split('\n')
    const jsonLines: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed)
          if (parsed.action && parsed.params) {
            actions.push(parsed)
            jsonLines.push(trimmed)
          }
        } catch {
          // not valid JSON, skip
        }
      }
    }
    // Remove the JSON lines from the text
    if (jsonLines.length > 0) {
      text = lines
        .filter((l) => !jsonLines.includes(l.trim()))
        .join('\n')
        .trim()
    }
  }

  // 3. Remove code block markers from text
  if (actions.length > 0) {
    text = text.replace(/```json\s*[\s\S]*?\s*```/g, '').trim()
  }

  return { text: text || actions[0]?.description || '', actions }
}

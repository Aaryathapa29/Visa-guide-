import type { Conversation } from '../types'

/** Trigger a browser download of a text blob. */
function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function safeName(title: string): string {
  const base = title.replace(/[^\w\d]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'chat'
  const date = new Date().toISOString().slice(0, 10)
  return `visa-guide-${base}-${date}`
}

/** Render a conversation as a Markdown transcript (answers are already Markdown). */
export function conversationToMarkdown(convo: Conversation): string {
  const lines: string[] = []
  lines.push(`# Visa Guide: ${convo.title}`)
  lines.push('')
  lines.push(`_Exported ${new Date().toLocaleString()} · ${convo.messages.length} messages_`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const m of convo.messages) {
    if (m.role === 'user') {
      lines.push(`### You`)
      lines.push('')
      lines.push(m.text.trim())
    } else {
      const topic = m.country ? ` (${m.country})` : ''
      lines.push(`### Visa Guide${topic}`)
      lines.push('')
      lines.push(m.text.trim())
      if (m.sources && m.sources.length) {
        lines.push('')
        lines.push('**Sources**')
        for (const s of m.sources) {
          const link = s.url ? `: ${s.url}` : ''
          lines.push(`- \`[${s.n}]\` ${s.title} (${s.country}, relevance ${(s.score * 100).toFixed(0)}%)${link}`)
        }
      }
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  lines.push('_Always verify visa requirements on official government websites, as rules change._')
  return lines.join('\n')
}

export function exportMarkdown(convo: Conversation): void {
  download(`${safeName(convo.title)}.md`, conversationToMarkdown(convo), 'text/markdown;charset=utf-8')
}

export function exportJSON(convo: Conversation): void {
  download(`${safeName(convo.title)}.json`, JSON.stringify(convo, null, 2), 'application/json;charset=utf-8')
}

/** Copy the Markdown transcript to the clipboard. Returns success. */
export async function copyMarkdown(convo: Conversation): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(conversationToMarkdown(convo))
    return true
  } catch {
    return false
  }
}

/** Small formatting/ID helpers. Markdown rendering is handled by react-markdown. */

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

/** Flag emoji for a country name (used in badges/source chips). */
export function flagFor(country?: string): string {
  switch ((country ?? '').toLowerCase()) {
    case 'usa':       return '🇺🇸'
    case 'australia': return '🇦🇺'
    case 'canada':    return '🇨🇦'
    default:          return '🌐'
  }
}

/** Derive a short conversation title from the first user message. */
export function titleFromText(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 42 ? clean.slice(0, 42).trimEnd() + '…' : clean || 'New chat'
}

/** Human-friendly relative time (e.g. "3m ago", "2d ago"). */
export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)      return 'just now'
  if (s < 3600)    return `${Math.floor(s / 60)}m ago`
  if (s < 86400)   return `${Math.floor(s / 3600)}h ago`
  if (s < 604800)  return `${Math.floor(s / 86400)}d ago`
  return new Date(ts).toLocaleDateString()
}

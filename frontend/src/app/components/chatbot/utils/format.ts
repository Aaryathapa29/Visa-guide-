/** Small formatting/ID helpers. Markdown rendering is handled by react-markdown. */

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export interface CountryMeta {
  label: string
  short: string
  color: string
}

/**
 * Design metadata for a country: an accent color and labels. Used by the
 * CountryTag component so we can show a coloured dot instead of a flag emoji.
 */
export function countryMeta(country?: string): CountryMeta {
  switch ((country ?? '').toLowerCase()) {
    case 'usa':       return { label: 'USA',       short: 'US', color: '#3B6FE0' }
    case 'australia': return { label: 'Australia', short: 'AU', color: '#12967E' }
    case 'canada':    return { label: 'Canada',    short: 'CA', color: '#D0433B' }
    default:          return { label: country || 'General', short: 'GN', color: '#8A8577' }
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

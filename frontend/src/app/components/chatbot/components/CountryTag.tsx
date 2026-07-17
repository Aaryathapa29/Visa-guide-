import React from 'react'
import { countryMeta } from '../utils/format'

interface Props {
  country?: string
  /** dot only, no label (used inline before a source title) */
  dotOnly?: boolean
  className?: string
}

/**
 * A coloured country indicator (dot + label) that replaces flag emoji. Each
 * country has its own accent so answers and sources are easy to scan.
 */
export default function CountryTag({ country, dotOnly = false, className = '' }: Props) {
  const meta = countryMeta(country)
  return (
    <span className={`ctag ${dotOnly ? 'ctag--dot' : ''} ${className}`}>
      <span className="ctag__dot" style={{ background: meta.color }} />
      {!dotOnly && <span className="ctag__label">{meta.label}</span>}
    </span>
  )
}

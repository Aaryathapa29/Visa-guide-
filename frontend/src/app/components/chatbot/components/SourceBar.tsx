import React, { useState } from 'react'
import type { Source } from '../types'
import { flagFor } from '../utils/format'

interface Props {
  sources:     Source[]
  highlighted: number | null
  registerRef: (n: number, el: HTMLDivElement | null) => void
}

/** Collapsible "Sources" bar shown under a bot answer. */
export default function SourceBar({ sources, highlighted, registerRef }: Props) {
  const [open, setOpen] = useState<Set<number>>(new Set())

  if (!sources.length) return null

  const toggle = (n: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })

  return (
    <div className="sources">
      <div className="sources__head">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        {sources.length} Source{sources.length > 1 ? 's' : ''}
      </div>

      <div className="sources__list">
        {sources.map(s => {
          const isOpen = open.has(s.n)
          return (
            <div
              key={s.n}
              className="source"
              data-highlight={highlighted === s.n}
              ref={el => registerRef(s.n, el)}
            >
              <button className="source__btn" onClick={() => toggle(s.n)}>
                <span className="source__n">{s.n}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <div className="source__title">
                    {flagFor(s.country)} {s.title}
                  </div>
                  <div className="source__meta">{s.source}</div>
                </span>
                <span className="source__score">{Math.round(s.score * 100)}%</span>
                <svg className="source__chevron" data-open={isOpen} width="14" height="14"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {isOpen && (
                <div className="source__body">
                  {s.snippet && <div className="source__snippet">“{s.snippet}”</div>}
                  {s.url && (
                    <a className="source__link" href={s.url} target="_blank" rel="noopener noreferrer">
                      Official website
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

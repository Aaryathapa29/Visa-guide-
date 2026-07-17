import React, { useRef, useState, useCallback } from 'react'
import type { Message } from '../types'
import Markdown from './Markdown'
import SourceBar from './SourceBar'
import CountryTag from './CountryTag'

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const refs = useRef<Map<number, HTMLDivElement>>(new Map())

  const registerRef = useCallback((n: number, el: HTMLDivElement | null) => {
    if (el) refs.current.set(n, el)
    else    refs.current.delete(n)
  }, [])

  const handleCite = useCallback((n: number) => {
    const el = refs.current.get(n)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setHighlighted(n)
    window.setTimeout(() => setHighlighted(cur => (cur === n ? null : cur)), 1600)
  }, [])

  return (
    <div className={`row ${isUser ? 'row--user' : 'row--bot'}`}>
      <div className={`avatar ${isUser ? 'avatar--user' : 'avatar--bot'}`}>
        {isUser ? 'You' : 'VG'}
      </div>


      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'}`}>
        {isUser ? (
          msg.text
        ) : (
          <>
            <Markdown text={msg.text} onCite={handleCite} />
            {msg.country && (
              <span className="bubble__country">
                <CountryTag country={msg.country} />
              </span>
            )}
            {msg.sources && msg.sources.length > 0 && (
              <SourceBar
                sources={msg.sources}
                highlighted={highlighted}
                registerRef={registerRef}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

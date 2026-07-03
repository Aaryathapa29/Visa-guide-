import React, { useState, useRef, useEffect, useCallback } from 'react'
import Header          from './components/Header'
import MessageBubble   from './components/MessageBubble'
import TypingIndicator from './components/TypingIndicator'
import UploadPanel     from './components/UploadPanel'
import { sendMessage } from './utils/api'
import { uid }         from './utils/format'
import type { Message } from './types'

const QUICK_QUESTIONS = [
  'How much bank balance is needed for Canada study permit?',
  'What documents are required for Australia Subclass 500?',
  'What happens at a USA F-1 visa interview?',
  'Can I work while studying in Canada?',
  'How long does Australia student visa processing take?',
]

export default function App() {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, { id: uid(), role: 'user', text: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const res = await sendMessage(trimmed)
      setMessages(prev => [...prev, {
        id:      uid(),
        role:    'bot',
        text:    res.answer,
        country: res.country ?? undefined,
      }])
    } catch (e: unknown) {
      setMessages(prev => [...prev, {
        id:   uid(),
        role: 'bot',
        text: `⚠️ ${e instanceof Error ? e.message : 'Could not reach the server. Is uvicorn running?'}`,
      }])
    }

    setLoading(false)
    textRef.current?.focus()
  }, [loading])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input) }
  }

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <Header />

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px 16px',
        display: 'flex', flexDirection: 'column', gap: 14,
        maxWidth: 860, width: '100%', margin: '0 auto',
        paddingBottom: showUpload ? 190 : 16,
      }}>

        {/* Welcome card */}
        {messages.length === 0 && (
          <div style={{
            background: 'var(--white)', borderRadius: 16, padding: '18px 20px',
            borderLeft: '4px solid var(--gold)',
            boxShadow: '0 2px 16px rgba(15,38,69,.08)',
          }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--navy)', marginBottom: 5 }}>
              👋 Welcome to the Visa Guide Chatbot
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
              Ask me anything about student visas for <strong>USA</strong>, <strong>Australia</strong>,
              or <strong>Canada</strong>. I use LLM-based RAG — your questions are matched against
              real visa documents and answered by an AI.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => handleSend(q)} style={{
                  background: 'var(--cream)', border: '1px solid var(--gray)',
                  color: 'var(--navy)', padding: '6px 12px', borderRadius: 20,
                  fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0, padding: '10px 16px',
        maxWidth: 860, width: '100%', margin: '0 auto',
        paddingBottom: showUpload ? 200 : 14,
      }}>
        <div style={{
          display: 'flex', gap: 8, background: 'var(--white)',
          border: '2px solid var(--gray)', borderRadius: 28,
          padding: '5px 6px 5px 16px',
          boxShadow: '0 2px 16px rgba(15,38,69,.08)',
        }}>
          <textarea
            ref={textRef} rows={1} value={input}
            onChange={autoResize} onKeyDown={handleKey}
            disabled={loading}
            placeholder="Ask about student visas for USA, Australia, or Canada…"
            style={{
              flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit',
              fontSize: 14, color: 'var(--text)', background: 'transparent',
              resize: 'none', maxHeight: 120, padding: '6px 0', lineHeight: 1.5,
            }}
          />

          {/* Upload toggle */}
          <button
            onClick={() => setShowUpload(p => !p)}
            title="Upload a visa PDF"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid var(--gray)', cursor: 'pointer',
              background: showUpload ? 'var(--navy)' : 'var(--cream)',
              fontSize: 15, alignSelf: 'flex-end', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >📎</button>

          {/* Send */}
          <button
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: loading || !input.trim() ? 'var(--gray)' : 'var(--sky)',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              alignSelf: 'flex-end', flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
          Always verify visa requirements on official government websites — rules change.
        </p>
      </div>

      {showUpload && <UploadPanel onClose={() => setShowUpload(false)} />}
    </div>
  )
}
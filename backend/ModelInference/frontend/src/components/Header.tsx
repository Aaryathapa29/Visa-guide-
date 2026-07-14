import React from 'react'

export default function Header() {
  return (
    <header style={{
      background: 'var(--navy)', color: '#fff',
      padding: '0 20px', height: 60,
      display: 'flex', alignItems: 'center', gap: 12,
      flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,.25)',
    }}>
      <div style={{
        width: 36, height: 36, background: 'var(--gold)', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>🌐</div>

      <div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Visa Guide Chatbot</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 1 }}>
          LLM-based RAG · Powered by Groq + sentence-transformers
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        {['🇺🇸 USA', '🇦🇺 Australia', '🇨🇦 Canada'].map(c => (
          <span key={c} style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            color: 'rgba(255,255,255,.85)', fontSize: 11, padding: '3px 9px', borderRadius: 20,
          }}>{c}</span>
        ))}
      </div>
    </header>
  )
}
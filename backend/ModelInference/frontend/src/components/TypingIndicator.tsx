import React from 'react'

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', alignSelf: 'flex-start' }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', background: 'var(--navy)',
        color: 'var(--gold)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0,
      }}>VG</div>
      <div style={{
        display: 'flex', gap: 5, padding: '11px 15px',
        background: 'var(--white)', borderRadius: 16, borderBottomLeftRadius: 3,
        boxShadow: '0 2px 10px rgba(15,38,69,.08)', alignItems: 'center',
      }}>
        {[0, 0.15, 0.3].map((delay, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--muted)',
            display: 'block', animation: `bounce .9s ${delay}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}
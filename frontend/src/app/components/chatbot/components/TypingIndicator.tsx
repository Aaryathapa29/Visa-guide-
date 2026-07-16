import React from 'react'

export default function TypingIndicator() {
  return (
    <div className="typing">
      <div className="avatar avatar--bot">VG</div>
      <div className="typing__dots">
        {[0, 0.15, 0.3].map((delay, i) => (
          <span key={i} style={{ animation: `vgBounce .9s ${delay}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

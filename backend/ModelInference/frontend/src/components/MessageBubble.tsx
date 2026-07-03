import React from 'react'
import type { Message } from '../types'
import { formatBotText } from '../utils/format'

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-end',
      maxWidth: '78%', animation: 'msgIn .2s ease-out',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isUser ? 14 : 11, fontWeight: 'bold',
        background: isUser ? 'var(--sky)' : 'var(--navy)',
        color: isUser ? '#fff' : 'var(--gold)',
      }}>
        {isUser ? '✈' : 'VG'}
      </div>

      <div style={{
        padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.6,
        borderBottomRightRadius: isUser ? 3 : 16,
        borderBottomLeftRadius:  isUser ? 16 : 3,
        background: isUser ? 'var(--sky)' : 'var(--white)',
        color: isUser ? '#fff' : 'var(--text)',
        boxShadow: isUser ? 'none' : '0 2px 10px rgba(15,38,69,.08)',
      }}>
        {isUser
          ? <span>{msg.text}</span>
          : <span
              className="bot-text"
              dangerouslySetInnerHTML={{ __html: formatBotText(msg.text) }}
            />
        }
        {msg.country && !isUser && (
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 6 }}>
            📍 {msg.country}
          </div>
        )}
      </div>
    </div>
  )
}
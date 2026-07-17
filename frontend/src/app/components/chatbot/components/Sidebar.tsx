import React from 'react'
import type { Conversation } from '../types'
import Logo from './Logo'

interface Props {
  conversations: Conversation[]
  activeId:      string | null
  open:          boolean
  onSelect:      (id: string) => void
  onNew:         () => void
  onDelete:      (id: string) => void
  onClose:       () => void
}

export default function Sidebar({
  conversations, activeId, open, onSelect, onNew, onDelete, onClose,
}: Props) {
  return (
    <>
      <div
        className={`backdrop ${open ? '' : 'backdrop--hidden'}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? '' : 'sidebar--closed'}`}>
        <div className="sidebar__brand">
          <Logo size={38} />
          <div>
            <div className="sidebar__title">Visa Guide</div>
            <div className="sidebar__sub">Student visa assistant</div>
          </div>
        </div>

        <button className="newchat" onClick={onNew}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>

        <div className="sidebar__label">History</div>
        <div className="convos">
          {conversations.length === 0 && (
            <div style={{ padding: '10px 18px', fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
              No conversations yet.
            </div>
          )}
          {conversations.map(c => (
            <button
              key={c.id}
              className={`convo ${c.id === activeId ? 'convo--active' : ''}`}
              onClick={() => onSelect(c.id)}
              title={c.title}
            >
              <svg className="convo__icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="convo__title">{c.title}</span>
              <span
                className="convo__del"
                role="button"
                title="Delete conversation"
                onClick={e => { e.stopPropagation(); onDelete(c.id) }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" /></svg>
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar__foot">
          <b>Retrieval-grounded answers</b><br />
          Covers <b>USA</b>, <b>Australia</b>, and <b>Canada</b>
        </div>
      </aside>
    </>
  )
}

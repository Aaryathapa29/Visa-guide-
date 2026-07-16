import type { Conversation } from '../types'
import { uid } from './format'

/**
 * Conversation history persisted in localStorage.
 * No backend/login needed. History survives page reloads and works offline.
 */
const KEY = 'visaguide.conversations.v1'

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as Conversation[]
    return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : []
  } catch {
    return []
  }
}

export function saveConversations(list: Conversation[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota / private mode, ignore */
  }
}

export function newConversation(): Conversation {
  const now = Date.now()
  return { id: uid(), title: 'New chat', messages: [], createdAt: now, updatedAt: now }
}

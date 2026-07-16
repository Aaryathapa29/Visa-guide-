export type Role = 'user' | 'bot'

export interface Source {
  n:       number
  title:   string
  source:  string
  country: string
  url:     string
  score:   number
  snippet: string
}

export interface Message {
  id:       string
  role:     Role
  text:     string
  country?: string
  sources?: Source[]
  ts?:      number
}

export interface Conversation {
  id:        string
  title:     string
  messages:  Message[]
  createdAt: number
  updatedAt: number
}

export interface ChatApiResponse {
  answer:  string
  country: string | null
  sources: Source[]
}

export interface UploadApiResponse {
  message:       string
  country:       string
  chunks_stored: number
  total_chunks:  number
}

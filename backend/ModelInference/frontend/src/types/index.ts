export type Role = 'user' | 'bot'

export interface Message {
  id:       string
  role:     Role
  text:     string
  country?: string
}

export interface ChatApiResponse {
  answer:  string
  country: string | null
}

export interface UploadApiResponse {
  message:       string
  country:       string
  chunks_stored: number
  total_chunks:  number
}
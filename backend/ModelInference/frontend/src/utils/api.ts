import type { ChatApiResponse, UploadApiResponse } from '../types'

export async function sendMessage(message: string): Promise<ChatApiResponse> {
  const res = await fetch('/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Server error' }))
    throw new Error(err.detail ?? 'Server error')
  }
  return res.json()
}

export async function uploadPDF(file: File, country: string): Promise<UploadApiResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('country', country)
  const res = await fetch('/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(err.detail ?? 'Upload failed')
  }
  return res.json()
}
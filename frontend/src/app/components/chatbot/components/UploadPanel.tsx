import React, { useRef, useState } from 'react'
import { uploadDoc } from '../utils/api'

const ACCEPT = '.pdf,.md,.markdown,.txt'
const OK_EXT = /\.(pdf|md|markdown|txt)$/i

type Status = { kind: 'ok' | 'busy' | 'err'; text: string } | null

export default function UploadPanel({ onClose }: { onClose: () => void }) {
  const [country,    setCountry]    = useState('USA')
  const [file,       setFile]       = useState<File | null>(null)
  const [status,     setStatus]     = useState<Status>(null)
  const [loading,    setLoading]    = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    if (!f) return
    if (!OK_EXT.test(f.name)) {
      setStatus({ kind: 'err', text: 'Accepted types: PDF, Markdown, or TXT.' })
      return
    }
    setFile(f)
    setStatus(null)
  }

  const handleSubmit = async () => {
    if (!file) { setStatus({ kind: 'err', text: 'Please choose a file first.' }); return }
    setLoading(true)
    setStatus({ kind: 'busy', text: 'Uploading and embedding. This may take a moment.' })
    try {
      const res = await uploadDoc(file, country)
      setStatus({
        kind: 'ok',
        text: `Added ${res.chunks_stored} passages. Knowledge base now holds ${res.total_chunks}.`,
      })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: unknown) {
      setStatus({ kind: 'err', text: e instanceof Error ? e.message : 'Upload failed.' })
    }
    setLoading(false)
  }

  const statusColor =
    status?.kind === 'ok'   ? 'var(--green)' :
    status?.kind === 'busy' ? 'var(--muted)' : 'var(--red)'

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="upload">
        <div className="upload__head">
          <b>Add a document to the knowledge base</b>
          <button className="upload__x" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="upload__row">
          <div
            className={`dropzone ${isDragging ? 'dropzone--drag' : ''} ${file ? 'dropzone--has' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); pickFile(e.dataTransfer.files[0]) }}
          >
            <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }}
              onChange={e => pickFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <span className="dropzone__file">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" /></svg>
                {file.name}
              </span>
            ) : (
              'Drag and drop a PDF, Markdown, or TXT file, or click to browse'
            )}
          </div>

          <select className="select" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="USA">USA</option>
            <option value="Australia">Australia</option>
            <option value="Canada">Canada</option>
          </select>

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing' : 'Upload and embed'}
          </button>
        </div>

        {status && <div className="upload__status" style={{ color: statusColor }}>{status.text}</div>}
      </div>
    </>
  )
}

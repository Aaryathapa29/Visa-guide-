import React, { useRef, useState } from 'react'
import { uploadDoc } from '../utils/api'

const ACCEPT = '.pdf,.md,.markdown,.txt'
const OK_EXT = /\.(pdf|md|markdown|txt)$/i

export default function UploadPanel({ onClose }: { onClose: () => void }) {
  const [country,    setCountry]    = useState('USA')
  const [file,       setFile]       = useState<File | null>(null)
  const [status,     setStatus]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    if (!f) return
    if (!OK_EXT.test(f.name)) { setStatus('⚠️ Accepted types: PDF, Markdown, or TXT.'); return }
    setFile(f); setStatus('')
  }

  const handleSubmit = async () => {
    if (!file) { setStatus('⚠️ Please choose a file first.'); return }
    setLoading(true)
    setStatus('⏳ Uploading and embedding… this may take a moment.')
    try {
      const res = await uploadDoc(file, country)
      setStatus(`✅ Done! ${res.chunks_stored} chunks stored. Total in ChromaDB: ${res.total_chunks}.`)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: unknown) {
      setStatus(`⚠️ ${e instanceof Error ? e.message : 'Upload failed.'}`)
    }
    setLoading(false)
  }

  const statusColor =
    status.startsWith('✅') ? 'var(--green)' :
    status.startsWith('⏳') ? 'var(--muted)' : 'var(--red)'

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="upload">
        <div className="upload__head">
          <b>📄 Add a document to the knowledge base</b>
          <button className="upload__x" onClick={onClose}>✕</button>
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
            {file ? `📎 ${file.name}` : 'Drag & drop a PDF / Markdown / TXT, or click to browse'}
          </div>

          <select className="select" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="USA">🇺🇸 USA</option>
            <option value="Australia">🇦🇺 Australia</option>
            <option value="Canada">🇨🇦 Canada</option>
          </select>

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing…' : 'Upload & Embed'}
          </button>
        </div>

        {status && <div className="upload__status" style={{ color: statusColor }}>{status}</div>}
      </div>
    </>
  )
}

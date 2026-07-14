import React, { useRef, useState } from 'react'
import { uploadPDF } from '../utils/api'

export default function UploadPanel({ onClose }: { onClose: () => void }) {
  const [country,    setCountry]    = useState('USA')
  const [file,       setFile]       = useState<File | null>(null)
  const [status,     setStatus]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setStatus('⚠️ Only PDF files are accepted.')
      return
    }
    setFile(f)
    setStatus('')
  }

  const handleSubmit = async () => {
    if (!file) { setStatus('⚠️ Please choose a PDF file first.'); return }
    setLoading(true)
    setStatus('⏳ Uploading and embedding… this may take a moment.')
    try {
      const res = await uploadPDF(file, country)
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
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'var(--white)', borderTop: '2px solid var(--gray)',
      padding: '18px 24px', boxShadow: '0 -4px 24px rgba(15,38,69,.12)',
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>
          📄 Upload Visa Document — chunk, embed &amp; store in ChromaDB
        </span>
        <button onClick={onClose} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 18, color: 'var(--muted)',
        }}>✕</button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); pickFile(e.dataTransfer.files[0]) }}
          style={{
            flex: 1, minWidth: 200, cursor: 'pointer', textAlign: 'center',
            border: `2px dashed ${isDragging ? 'var(--sky)' : 'var(--gray)'}`,
            borderRadius: 10, padding: '12px 16px',
            background: isDragging ? '#f0f7ff' : 'transparent',
            fontSize: 13, color: file ? 'var(--navy)' : 'var(--muted)',
            transition: 'all .15s',
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? `📎 ${file.name}` : 'Drag & drop a PDF, or click to browse'}
        </div>

        {/* Country picker */}
        <select
          value={country} onChange={e => setCountry(e.target.value)}
          style={{
            padding: '9px 12px', border: '1.5px solid var(--gray)',
            borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
            background: 'var(--white)', cursor: 'pointer',
          }}
        >
          <option value="USA">🇺🇸 USA</option>
          <option value="Australia">🇦🇺 Australia</option>
          <option value="Canada">🇨🇦 Canada</option>
        </select>

        {/* Submit */}
        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            fontSize: 13, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'var(--gray)' : 'var(--sky)', color: '#fff',
            whiteSpace: 'nowrap', transition: 'background .15s',
          }}
        >
          {loading ? 'Processing…' : 'Upload & Embed'}
        </button>
      </div>

      {status && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: statusColor }}>{status}</div>
      )}
    </div>
  )
}
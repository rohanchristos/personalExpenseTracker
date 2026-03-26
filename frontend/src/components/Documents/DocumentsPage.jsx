import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import api from '../../services/api'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents')
      setDocuments(res.data.documents)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    }
  }

  const handleUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      })
      await fetchDocuments()
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.delete(`/api/documents/${id}`)
      setDocuments(prev => prev.filter(d => d._id !== id))
    } catch (err) {
      alert('Failed to delete document')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const statusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircle size={16} style={{ color: 'var(--accent-success)' }} />
      case 'processing': return <Loader size={16} className="animate-spin" style={{ color: 'var(--accent-warning)' }} />
      case 'error': return <AlertCircle size={16} style={{ color: 'var(--accent-danger)' }} />
      default: return null
    }
  }

  return (
    <div className="page-content">
      <div className="documents-page">
        <h1>📄 Documents</h1>

        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="upload-zone-icon">
            {uploading ? <div className="spinner" /> : <Upload size={24} />}
          </div>
          <h3>{uploading ? 'Uploading & Processing...' : 'Drop your PDF here'}</h3>
          <p>or click to browse • PDF files up to 20MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files[0]) handleUpload(e.target.files[0])
            }}
          />
        </div>

        {documents.length > 0 && (
          <div className="doc-list">
            {documents.map(doc => (
              <div key={doc._id} className="doc-item glass-card">
                <div className="doc-info">
                  <div className="doc-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="doc-name">{doc.originalName}</div>
                    <div className="doc-meta">
                      {doc.pages > 0 && `${doc.pages} pages • ${doc.chunks} chunks • `}
                      <span className={`badge badge-${doc.status === 'ready' ? 'success' : doc.status === 'error' ? 'danger' : 'warning'}`}>
                        {statusIcon(doc.status)} {doc.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => handleDelete(doc._id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && !uploading && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '32px' }}>
            <p>No documents uploaded yet. Upload a PDF to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

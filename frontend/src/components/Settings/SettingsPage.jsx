import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Save, CheckCircle } from 'lucide-react'
import api from '../../services/api'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('groq')
  const [showKey, setShowKey] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [maskedKey, setMaskedKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchKeyStatus()
  }, [])

  const fetchKeyStatus = async () => {
    try {
      const res = await api.get('/api/settings/api-key')
      setHasKey(res.data.hasKey)
      setMaskedKey(res.data.maskedKey)
      setProvider(res.data.provider || 'groq')
    } catch (err) {
      console.error('Failed to fetch key status:', err)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/api/settings/api-key', { apiKey: apiKey.trim(), provider })
      setSaved(true)
      setApiKey('')
      await fetchKeyStatus()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div className="settings-page">
        <h1>⚙️ Settings</h1>

        <div className="settings-section glass-card">
          <h2>
            <Key size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            LLM Provider & API Key
          </h2>
          <p>
            Choose your AI provider and enter your API key.
          </p>

          {hasKey && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: '0.85rem',
              color: 'var(--accent-success)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
              wordBreak: 'break-all'
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              API key configured: {'•'.repeat(8)}{maskedKey.slice(-4)}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="provider-select">Provider</label>
            <select
              id="provider-select"
              className="input-field"
              value={provider}
              onChange={e => setProvider(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="groq">Groq (LLaMA 3.3 — Free & Fast)</option>
              <option value="openai">OpenAI (GPT-4o-mini)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="api-key-input">
              {hasKey ? 'Update API Key' : 'Enter API Key'}
            </label>
            <div className="api-key-input-wrapper">
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  className="input-field"
                  placeholder={provider === 'openai' ? 'sk-...' : 'gsk_...'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <button
                  className="btn-ghost"
                  style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4
                  }}
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!apiKey.trim() || saving}
              >
                {saving ? <div className="spinner" style={{ borderTopColor: 'white' }} /> :
                 saved ? <><CheckCircle size={16} /> Saved</> : <><Save size={16} /> Save</>}
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              {provider === 'groq' ? (
                <>Get your free key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">console.groq.com</a></>
              ) : (
                <>Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com</a></>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section glass-card">
          <h2>About FinanceBot</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            FinanceBot is an AI-powered personal finance assistant built with RAG
            (Retrieval Augmented Generation) technology. Upload your expense PDFs
            and ask natural language questions about your spending patterns.
          </p>
          <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Powered by Groq / OpenAI • LangChain • ChromaDB
          </div>
        </div>
      </div>
    </div>
  )
}

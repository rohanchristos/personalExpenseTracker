import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, BarChart3 } from 'lucide-react'
import api from '../../services/api'

export default function ChatPanel({ sessionId, onSessionCreated, onShowChart }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    setCurrentSessionId(sessionId)
    if (sessionId) {
      loadSession(sessionId)
    } else {
      setMessages([])
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSession = async (id) => {
    try {
      const res = await api.get(`/api/chat/sessions/${id}`)
      setMessages(res.data.session.messages || [])
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  const handleSend = async () => {
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    const userMsg = { role: 'user', content: question, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await api.post('/api/chat/ask', {
        question,
        sessionId: currentSessionId,
      })

      const assistantMsg = {
        role: 'assistant',
        content: res.data.answer,
        chartData: res.data.chartData,
        chartType: res.data.chartType,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      if (!currentSessionId && res.data.sessionId) {
        setCurrentSessionId(res.data.sessionId)
        onSessionCreated?.(res.data.sessionId)
      }
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: err.response?.data?.error || 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Bot size={28} />
            </div>
            <h2>Ask FinanceBot anything</h2>
            <p>
              Upload a PDF document first, then ask questions about your expenses,
              spending patterns, and financial data.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div>
              <div className="message-bubble">{msg.content}</div>
              {msg.chartData && Object.keys(msg.chartData).length > 0 && (
                <button
                  className="message-chart-btn"
                  onClick={() => onShowChart?.(msg.chartData, msg.chartType)}
                >
                  <BarChart3 size={14} /> View Chart
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Ask about your expenses..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}

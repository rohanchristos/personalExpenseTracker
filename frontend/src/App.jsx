import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoginPage from './components/Auth/LoginPage'
import RegisterPage from './components/Auth/RegisterPage'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import ChatPanel from './components/Chat/ChatPanel'
import VisualizationPanel from './components/Visualizations/VisualizationPanel'
import DocumentsPage from './components/Documents/DocumentsPage'
import SettingsPage from './components/Settings/SettingsPage'
import api from './services/api'

function DashboardLayout() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [chartType, setChartType] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const location = useLocation()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await api.get('/api/chat/sessions')
      setSessions(res.data.sessions)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }

  const handleNewChat = () => {
    setActiveSessionId(null)
    setChartData(null)
    setChartType(null)
    setActiveTab('chat')
  }

  const handleSelectSession = async (id) => {
    setActiveSessionId(id)
    setActiveTab('chat')
    // Load chart data from last message
    try {
      const res = await api.get(`/api/chat/sessions/${id}`)
      const msgs = res.data.session.messages || []
      const lastChart = [...msgs].reverse().find(m => m.chartData && Object.keys(m.chartData).length > 0)
      if (lastChart) {
        setChartData(lastChart.chartData)
        setChartType(lastChart.chartType)
      } else {
        setChartData(null)
        setChartType(null)
      }
    } catch {}
  }

  const handleSessionCreated = (newSessionId) => {
    setActiveSessionId(newSessionId)
    fetchSessions()
  }

  const handleShowChart = (data, type) => {
    setChartData(data)
    setChartType(type)
    setActiveTab('viz')
  }

  const getPageTitle = () => {
    if (location.pathname === '/documents') return '📄 Documents'
    if (location.pathname === '/settings') return '⚙️ Settings'
    return '💬 Chat'
  }

  return (
    <div className="dashboard">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <div className="main-content">
        <Header title={getPageTitle()} />
        <Routes>
          <Route path="/" element={
            <>
              {location.pathname === '/' && (
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                  <button
                    className={`viz-tab ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                    style={{ borderRadius: 0, border: 'none', borderBottom: activeTab === 'chat' ? '2px solid var(--accent-primary)' : '2px solid transparent', margin: '0 4px', padding: '12px 20px' }}
                  >
                    💬 Chat
                  </button>
                  <button
                    className={`viz-tab ${activeTab === 'viz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('viz')}
                    style={{ borderRadius: 0, border: 'none', borderBottom: activeTab === 'viz' ? '2px solid var(--accent-primary)' : '2px solid transparent', margin: '0 4px', padding: '12px 20px' }}
                  >
                    📊 Visualizations
                  </button>
                </div>
              )}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'chat' ? (
                  <ChatPanel
                    sessionId={activeSessionId}
                    onSessionCreated={handleSessionCreated}
                    onShowChart={handleShowChart}
                  />
                ) : (
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <VisualizationPanel chartData={chartData} chartType={chartType} />
                  </div>
                )}
              </div>
            </>
          } />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

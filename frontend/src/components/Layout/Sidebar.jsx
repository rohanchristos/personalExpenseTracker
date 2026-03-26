import { useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare, FileText, Settings, LogOut, Plus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Sidebar({ sessions, activeSessionId, onNewChat, onSelectSession }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/' },
    { id: 'documents', label: 'Documents', icon: FileText, path: '/documents' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ]

  const handleNav = (path) => {
    navigate(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">💰</div>
          <span className="sidebar-brand-text">FinanceBot</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <item.icon size={18} className="nav-icon" />
            {item.label}
          </button>
        ))}

        {location.pathname === '/' && (
          <>
            <div style={{ margin: '16px 0 8px', padding: '0 14px' }}>
              <button className="btn btn-secondary" onClick={onNewChat}
                style={{ width: '100%', fontSize: '0.82rem' }}>
                <Plus size={15} /> New Chat
              </button>
            </div>

            <div className="sessions-list">
              {sessions && sessions.map(s => (
                <button
                  key={s._id}
                  className={`session-item ${s._id === activeSessionId ? 'active' : ''}`}
                  onClick={() => onSelectSession(s._id)}
                >
                  <span className="session-title">{s.title}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
        {user && (
          <div style={{
            padding: '8px 14px',
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user.email}
          </div>
        )}
      </div>
    </aside>
  )
}

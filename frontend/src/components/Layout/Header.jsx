import ThemeToggle from '../common/ThemeToggle'

export default function Header({ title }) {
  return (
    <header className="header">
      <h1 className="header-title">{title || 'Dashboard'}</h1>
      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  )
}

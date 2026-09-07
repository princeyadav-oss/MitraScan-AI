function Topbar({ user, onSignOut }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">MS</span>
        <span>
          <b>MitraScan AI</b>
          <small>Legal Metrology & Health Intelligence</small>
        </span>
      </div>

      <div className="topbar-meta">
        <div className="user-indicator">
          <span className="live-dot" />
          <span className="user-name">{user.name}</span>
          <span className="user-badge">{user.role}</span>
        </div>

        <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>

        {/* Prominent Logout Button */}
        <button
          type="button"
          className="logout-button"
          onClick={onSignOut}
          title="Sign out of your inspector account"
        >
          <span className="logout-icon">⎋</span>
          <b>Logout</b>
        </button>
      </div>
    </header>
  )
}

export default Topbar

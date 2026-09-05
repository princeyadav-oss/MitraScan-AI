function Topbar({ user, onSignOut }) {
  return <header className="topbar"><div className="brand"><span className="brand-mark">MS</span><span><b>MitraScan</b><small>Legal Metrology Intelligence</small></span></div><div className="topbar-meta"><span className="live-dot" /> {user.name} · {user.role} <button className="signout-button" onClick={onSignOut}>Sign out</button><span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span></div></header>
}

export default Topbar

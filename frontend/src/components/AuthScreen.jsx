import { useState } from 'react'
import { login, register } from '../services/authApi'

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const result = mode === 'login' ? await login({ email, password }) : await register({ name, email, password })
      onAuthenticated(result.user)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  return <main className="auth-shell"><div className="auth-card"><div className="brand auth-brand"><span className="brand-mark">MS</span><span><b>MitraScan</b><small>Legal Metrology Intelligence</small></span></div><p className="section-kicker">SECURE INSPECTOR WORKSPACE</p><h1>{mode === 'login' ? 'Welcome back.' : 'Create inspector access.'}</h1><p className="auth-copy">Sign in to create audits, view saved evidence, and generate reports.</p><form onSubmit={submit}>{mode === 'register' && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required /></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Sign in →' : 'Create account →'}</button></form><button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'New inspector? Create an account' : 'Already registered? Sign in'}</button></div></main>
}

export default AuthScreen
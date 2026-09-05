const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function parse(response, fallback) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.message || fallback)
  return payload
}

export function getToken() {
  return localStorage.getItem('mitrascan_token')
}

export function clearSession() {
  localStorage.removeItem('mitrascan_token')
  localStorage.removeItem('mitrascan_user')
}

export async function login(credentials) {
  const result = await parse(await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) }), 'Login failed')
  localStorage.setItem('mitrascan_token', result.token)
  localStorage.setItem('mitrascan_user', JSON.stringify(result.user))
  return result
}

export async function register(details) {
  const result = await parse(await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) }), 'Registration failed')
  localStorage.setItem('mitrascan_token', result.token)
  localStorage.setItem('mitrascan_user', JSON.stringify(result.user))
  return result
}

export async function getSession() {
  const token = getToken()
  if (!token) return null
  const response = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    clearSession()
    return null
  }
  const result = await response.json()
  return result.user
}

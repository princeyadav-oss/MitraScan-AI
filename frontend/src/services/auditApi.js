const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('mitrascan_token') || ''}` })

async function parseResponse(response, fallbackMessage) {
  if (response.ok) return response.json()
  const payload = await response.json().catch(() => null)
  throw new Error(payload?.message || `${fallbackMessage} (HTTP ${response.status})`)
}

export async function getAudits() {
  return parseResponse(await fetch(`${API_URL}/audits`, { headers: authHeaders() }), 'Could not load audits')
}

export async function createImageAudit(formData) {
  return parseResponse(await fetch(`${API_URL}/audits`, { method: 'POST', headers: authHeaders(), body: formData }), 'Audit failed')
}

export async function createUrlAudit(details) {
  return parseResponse(await fetch(`${API_URL}/audits/url`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(details) }), 'Product URL audit failed')
}

export async function downloadReport(id) {
  const response = await fetch(`${API_URL}/audits/${id}/report`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Could not download the report')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mitrascan-${id}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

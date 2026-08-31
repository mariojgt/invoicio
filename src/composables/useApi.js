import { ref } from 'vue'

/**
 * API client for the Invoicio backend
 * Handles auth session and server-side invoice persistence
 */

export const authUser = ref(null)

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  })
  if (res.status === 401) {
    authUser.value = null
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

const logSyncError = (err) => {
  console.error('[invoicio] Failed to sync with server:', err.message)
}

// ---- Auth ----
export async function checkAuth() {
  try {
    const data = await request('/api/auth/me')
    authUser.value = data.username
    return true
  } catch {
    return false
  }
}

export async function login(username, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
  authUser.value = data.username
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' })
  } finally {
    authUser.value = null
  }
}

// ---- Invoices ----
export function fetchInvoicesRemote() {
  return request('/api/invoices')
}

// Mutations are fire-and-forget: the in-memory list is the UI's source of
// truth and sync failures are logged rather than blocking the interaction.
export function upsertInvoiceRemote(record) {
  return request('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(record)
  }).catch(logSyncError)
}

export function deleteInvoiceRemote(id) {
  return request(`/api/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(logSyncError)
}

export function importInvoicesRemote(invoices, mode) {
  return request('/api/invoices/import', {
    method: 'POST',
    body: JSON.stringify({ invoices, mode })
  }).catch(logSyncError)
}

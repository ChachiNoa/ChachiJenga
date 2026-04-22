const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Send the Google ID token to the server and get a JWT + user back.
 * @param {string} idToken - Google ID token from Google Sign-In
 * @returns {Promise<{token: string, user: object}>}
 */
export async function loginWithGoogle(idToken) {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Authentication failed')
  }

  return response.json()
}

/**
 * Save auth data to localStorage.
 */
export function saveAuth(token, user) {
  localStorage.setItem('chachijenga-token', token)
  localStorage.setItem('chachijenga-user', JSON.stringify(user))
}

/**
 * Load auth data from localStorage.
 * @returns {{token: string, user: object} | null}
 */
export function loadAuth() {
  const token = localStorage.getItem('chachijenga-token')
  const userStr = localStorage.getItem('chachijenga-user')

  if (!token || !userStr) return null

  try {
    return { token, user: JSON.parse(userStr) }
  } catch {
    return null
  }
}

/**
 * Clear auth data from localStorage.
 */
export function clearAuth() {
  localStorage.removeItem('chachijenga-token')
  localStorage.removeItem('chachijenga-user')
}

/**
 * Get the saved JWT token for API requests.
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem('chachijenga-token')
}

/**
 * DEV ONLY: Login as a test user without Google OAuth.
 * Creates a real user in the server DB so all game features work.
 * @param {string} name - Display name for the dev user
 * @returns {Promise<{token: string, user: object}>}
 */
export async function devLogin(name = 'Dev Player') {
  const response = await fetch(`${API_URL}/auth/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Dev login failed')
  }

  return response.json()
}


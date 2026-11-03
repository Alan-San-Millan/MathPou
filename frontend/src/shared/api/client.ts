const ACCESS_KEY = 'mathpou.access'
const REFRESH_KEY = 'mathpou.refresh'

export type User = {
  id: number
  username: string
  email: string
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
}

// En local dejamos VITE_API_URL vacío y Vite proxea /api al backend.
// En Render hay que hornear la URL absoluta en el build.
function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? ''
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY)
  if (!refresh) return null
  const response = await fetch(`${apiBase()}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  if (!response.ok) {
    clearTokens()
    return null
  }
  const data = (await response.json()) as { access: string; refresh?: string }
  localStorage.setItem(ACCESS_KEY, data.access)
  if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh)
  return data.access
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const useAuth = options.auth !== false
  const token = useAuth ? getAccessToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  }
  if (options.body !== undefined) init.body = JSON.stringify(options.body)

  let response = await fetch(`${apiBase()}${path}`, init)
  // Un 401 casi siempre es access vencido: intentamos refresh una vez y reintentamos.
  if (response.status === 401 && useAuth) {
    const next = await refreshAccessToken()
    if (next) {
      headers.Authorization = `Bearer ${next}`
      response = await fetch(`${apiBase()}${path}`, { ...init, headers })
    }
  }

  const data = await parseBody(response)
  if (!response.ok) {
    throw new Error(formatApiError(data, response.status))
  }
  return data as T
}

function formatApiError(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail
    const parts = Object.entries(record).map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(' ')}`
      return `${key}: ${String(value)}`
    })
    if (parts.length) return parts.join(' ')
  }
  return `Error ${status}`
}

export function loginRequest(identifier: string, password: string) {
  // El API sigue esperando la clave `username`; puede ser username o email.
  return apiRequest<{ access: string; refresh: string }>(
    '/api/auth/token/',
    { method: 'POST', body: { username: identifier, password }, auth: false },
  )
}

export function registerRequest(username: string, email: string, password: string) {
  return apiRequest<{ access: string; refresh: string; user: User }>(
    '/api/auth/register/',
    { method: 'POST', body: { username, email, password }, auth: false },
  )
}

export function meRequest() {
  return apiRequest<User>('/api/auth/me/')
}

export function logoutRequest() {
  const refresh = localStorage.getItem(REFRESH_KEY)
  if (!refresh) return Promise.resolve()
  return apiRequest<null>('/api/auth/logout/', { method: 'POST', body: { refresh } })
}

export type PulseResult = {
  time: number[]
  signal: number[]
  T: number
  w0: number
  reconstruction?: Reconstruction
}

export type Reconstruction = {
  time: number[]
  signal: number[]
  a0: number
  an: number[]
  bn: number[]
  magnitudes: number[]
  phi: number[]
}

export function postPulse(datos: number[][], armonicos?: number) {
  return apiRequest<PulseResult>('/api/signals/pulse/', { method: 'POST', body: { datos, armonicos } })
}

export type ExampleResult = {
  amplitudes: number[]
  phases: number[]
  time: number[]
  signal: number[]
}

export function getExample(graphId: string) {
  return apiRequest<ExampleResult>(`/api/signals/examples/${graphId}/`)
}

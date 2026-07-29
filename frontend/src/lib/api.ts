// All paths are relative — Vite proxy (dev) and Nginx (prod) forward them to the Go backend.
// Browser never calls the backend directly — no CORS issues.

export async function login(email: string, password: string) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Login failed')
  }
  return res.json() as Promise<{
    token: string
    user: { id: number; name: string; email: string; role: string }
  }>
}

export async function fetchUsers(token: string) {
  const res = await fetch('/api/users', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json() as Promise<{
    users: Array<{ id: number; name: string; email: string; role: string; created_at: string }>
  }>
}

export async function uploadImage(token: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Upload failed')
  }
  return res.json() as Promise<{ url: string; filename: string }>
}

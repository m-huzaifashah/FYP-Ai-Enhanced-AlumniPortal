const API_BASE = ((import.meta as any).env?.VITE_API_URL ?? '/api')

export async function postLogin(email: string, password: string): Promise<{ token: string; user: { id: number; email: string; name: string } }> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error((await res.json().catch(()=>({error:'Login failed'}))).error || 'Login failed')
  return res.json()
}

export async function getEvents() {
  const res = await fetch(`${API_BASE}/events`)
  if (!res.ok) throw new Error('Failed to load events')
  return res.json()
}


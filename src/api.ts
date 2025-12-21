const API_BASE = ((import.meta as any).env?.VITE_API_URL ?? '/api')

export async function postLogin(email: string, password: string): Promise<{ token: string; user: { id: string | number; email: string; name: string; role: 'student' | 'admin' | 'alumni' } }> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error((await res.json().catch(()=>({error:'Login failed'}))).error || 'Login failed')
  return res.json()
}

export async function postSignup(payload: { name: string; email: string; password: string; role?: 'student' | 'admin'; secret?: string }): Promise<{ id: string | number; email: string; name: string; role: 'student' | 'admin' }> {
  const res = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({ error: 'Signup failed' }))
  if (!res.ok) throw new Error((data as any).error || 'Signup failed')
  return data
}

export async function getEvents() {
  const res = await fetch(`${API_BASE}/events`)
  if (!res.ok) throw new Error('Failed to load events')
  return res.json()
}

export async function getJobs() {
  const res = await fetch(`${API_BASE}/jobs`)
  if (!res.ok) throw new Error('Failed to load jobs')
  return res.json()
}

export async function getMentors() {
  const res = await fetch(`${API_BASE}/mentors`)
  if (!res.ok) throw new Error('Failed to load mentors')
  return res.json()
}

export async function getAlumni() {
  const res = await fetch(`${API_BASE}/alumni`)
  if (!res.ok) throw new Error('Failed to load alumni')
  return res.json()
}

export async function getServices() {
  const res = await fetch(`${API_BASE}/services`)
  if (!res.ok) throw new Error('Failed to load services')
  return res.json()
}

export async function getProfile(email: string) {
  const res = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(email)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to load profile (${res.status})`)
  }
  return res.json()
}

export async function updateProfile(profile: any) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

export async function postContact(payload: { name: string; email: string; message: string }) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({ error: 'Failed to send' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to send')
  return data
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Failed to load health')
  return res.json()
}

export async function createEvent(payload: { title: string; date: string; location: string; description?: string }) {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({ error: 'Failed to create event' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to create event')
  return data
}

export async function updateEvent(id: string | number, payload: { title: string; date: string; location: string; description?: string }) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({ error: 'Failed to update event' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to update event')
  return data
}

export async function deleteEvent(id: string | number) {
  const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({ error: 'Failed to delete event' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to delete event')
  return data
}

export async function createJob(payload: { title: string; company: string; location: string; link?: string }) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({ error: 'Failed to create job' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to create job')
  return data
}

export async function updateJob(id: string | number, payload: { title: string; company: string; location: string; link?: string }) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({ error: 'Failed to update job' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to update job')
  return data
}

export async function deleteJob(id: string | number) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({ error: 'Failed to delete job' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to delete job')
  return data
}


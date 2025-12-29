// ===============================
// API BASE URLS
// ===============================
const API_BASE = ((import.meta as any).env?.VITE_API_URL)
const ML_API = ((import.meta as any).env?.VITE_ML_API_URL)

if (!API_BASE) throw new Error('API_BASE is not defined')
if (!ML_API) throw new Error('ML_API is not defined')


// ===============================
// AUTH
// ===============================
export async function postLogin(
  email: string,
  password: string
): Promise<{
  token: string
  user: { id: string | number; email: string; name: string; role: 'student' | 'admin' | 'alumni' }
}> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const data = await res.json().catch(() => ({ error: 'Login failed' }))
  if (!res.ok) throw new Error((data as any).error || 'Login failed')
  return data
}

export async function postSignup(payload: {
  name: string
  email: string
  password: string
  role?: 'student' | 'admin' | 'alumni'
  secret?: string
}) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await res.json().catch(() => ({ error: 'Signup failed' }))
  if (!res.ok) throw new Error((data as any).error || 'Signup failed')
  return data
}


// ===============================
// CORE BACKEND — GENERAL
// ===============================
export async function getEvents() {
  const res = await fetch(`${API_BASE}/events`)
  if (!res.ok) throw new Error('Failed to load events')
  return res.json()
}

export async function getJobs() {
  const res = await fetch(`${API_BASE}/jobs?source=db`)
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

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Failed to load health')
  return res.json()
}


// ===============================
// PROFILE
// ===============================
export async function getProfile(email: string) {
  const res = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(email)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as any).error || 'Failed to load profile')
  return data
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


// ===============================
// EVENTS (ADMIN)
// ===============================
export async function createEvent(payload: {
  title: string
  date: string
  location: string
  description?: string
}) {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await res.json().catch(() => ({ error: 'Failed to create event' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to create event')
  return data
}

export async function updateEvent(
  id: string | number,
  payload: { title: string; date: string; location: string; description?: string }
) {
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


// ===============================
// JOBS (ADMIN)
// ===============================
export async function createJob(payload: {
  title: string
  company: string
  location: string
  link?: string
}) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await res.json().catch(() => ({ error: 'Failed to create job' }))
  if (!res.ok) throw new Error((data as any).error || 'Failed to create job')
  return data
}

export async function updateJob(
  id: string | number,
  payload: { title: string; company: string; location: string; link?: string }
) {
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


// ===============================
// ROLES & SKILLS (CORE BACKEND)
// ===============================
export async function getRoles(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/roles`)
  if (!res.ok) throw new Error('Failed to fetch roles')
  return res.json()
}

export async function getJobsByRoleLevel(
  role: string,
  level: string
): Promise<{ id: number; title: string }[]> {
  const res = await fetch(
    `${API_BASE}/jobs/by-role-level?role=${role}&level=${level}`
  )
  if (!res.ok) throw new Error('Failed to fetch jobs by role and level')
  return res.json()
}

export async function getSkillsByRoleLevel(
  role: string,
  level: string
): Promise<string[]> {
  const res = await fetch(
    `${API_BASE}/skills/by-role-level?role=${role}&level=${level}`
  )
  if (!res.ok) throw new Error('Failed to fetch skills by role and level')
  return res.json()
}


// ===============================
// 🔥 ML BACKEND — ROLE + LEVEL SKILL GAP
// ===============================
export async function analyzeSkillGapRoleLevel(
  resume: File,
  role: string,
  level: string
): Promise<{
  role: string
  level: string
  required_skills: string[]
  extracted_resume_skills: string[]
  matched_skills: string[]
  missing_skills: string[]
  raw_coverage_percent: number
  ml_match_percentage: number
}> {
  const formData = new FormData()
  formData.append('resume', resume)
  formData.append('role', role)
  formData.append('level', level)

  const res = await fetch(`${ML_API}/skill-gap/analyze-role-level`, {
    method: 'POST',
    body: formData
  })

  const data = await res.json().catch(() => ({
    error: 'Skill gap analysis failed'
  }))

  if (!res.ok) {
    throw new Error((data as any).error || 'Skill gap analysis failed')
  }

  return data
}
// ===============================
// CONTACT / SUPPORT
// ===============================
export async function postContact(payload: {
  name: string
  email: string
  message: string
}) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await res.json().catch(() => ({
    error: 'Failed to send message'
  }))

  if (!res.ok) {
    throw new Error((data as any).error || 'Failed to send message')
  }

  return data
}

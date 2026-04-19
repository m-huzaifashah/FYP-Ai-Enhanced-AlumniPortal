import axios from 'axios'

// ===============================
// API CONFIGURATION & INSTANCES
// ===============================
const API_BASE = (import.meta as any).env?.VITE_API_URL
const ML_API = (import.meta as any).env?.VITE_ML_API_URL

if (!API_BASE) throw new Error('API_BASE is not defined')
if (!ML_API) throw new Error('ML_API is not defined')

// Create Axios instances for clean URL usage
const coreApi = axios.create({ baseURL: API_BASE })
const mlApi = axios.create({ baseURL: ML_API })

// Automatically attach the JWT token from localStorage to every request
coreApi.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

// Global request handler to neatly extract error messages from the backend
const errorInterceptor = (defaultMsg: string) => (error: any) => {
  // If the error was already extracted and thrown by another interceptor, just re-throw it!
  if (error instanceof Error && !error.message.includes('status code')) {
    throw error
  }
  const backendMsg = error.response?.data?.error
  throw new Error(backendMsg || defaultMsg)
}

// Add interceptors to automatically unwrap the response data and handle errors
coreApi.interceptors.response.use(res => res.data, errorInterceptor('API Request Failed'))
mlApi.interceptors.response.use(res => res.data, errorInterceptor('ML Request Failed'))

// Generic typed helpers for extreme readability and DRY code
const get = <T = any>(url: string, params?: any): Promise<T> => coreApi.get<T>(url, { params }) as Promise<T>
const post = <T = any>(url: string, data?: any): Promise<T> => coreApi.post<T>(url, data) as Promise<T>
const put = <T = any>(url: string, data?: any): Promise<T> => coreApi.put<T>(url, data) as Promise<T>
const del = <T = any>(url: string): Promise<T> => coreApi.delete<T>(url) as Promise<T>

// ===============================
// AUTH
// ===============================
export type UserRole = 'student' | 'admin' | 'alumni'

export const postLogin = (email: string, password: string) =>
  post<{ token: string, user: { id: string | number, email: string, name: string, role: UserRole } }>('/login', { email, password }).catch(errorInterceptor('Login failed'))

export const postSignup = (payload: { name: string, email: string, password: string, role?: UserRole, secret?: string }) =>
  post('/signup', payload).catch(errorInterceptor('Signup failed'))

// ===============================
// CORE BACKEND — GENERAL
// ===============================
export const getEvents = () => get('/events').catch(errorInterceptor('Failed to load events'))
export const getJobs = () => get('/jobs', { source: 'db' }).catch(errorInterceptor('Failed to load jobs'))
export const getAlumni = () => get('/alumni').catch(errorInterceptor('Failed to load alumni'))
export const getServices = () => get('/services').catch(errorInterceptor('Failed to load services'))
export const getHealth = () => get('/health').catch(errorInterceptor('Failed to load health'))

// ===============================
// PROFILE
// ===============================
export const getProfile = (email: string) => get('/profile', { email }).catch(errorInterceptor('Failed to load profile'))
export const updateProfile = (profile: any) => put('/profile', profile).catch(errorInterceptor('Failed to update profile'))

// ===============================
// EVENTS (ADMIN)
// ===============================
export const createEvent = (payload: { title: string, date: string, time?: string, location: string, description?: string, image?: File | null }) => {
  const fd = new FormData()
  fd.append('title', payload.title)
  fd.append('date', payload.date)
  if (payload.time) fd.append('time', payload.time)
  fd.append('location', payload.location)
  if (payload.description) fd.append('description', payload.description)
  if (payload.image) fd.append('image', payload.image)
  return post('/events', fd).catch(errorInterceptor('Failed to create event'))
}

export const updateEvent = (id: string | number, payload: { title: string, date: string, time?: string, location: string, description?: string, image?: File | null, removeImage?: boolean }) => {
  const fd = new FormData()
  fd.append('title', payload.title)
  fd.append('date', payload.date)
  if (payload.time) fd.append('time', payload.time)
  fd.append('location', payload.location)
  if (payload.description) fd.append('description', payload.description)
  if (payload.image) fd.append('image', payload.image)
  if (payload.removeImage) fd.append('removeImage', 'true')
  return put(`/events/${id}`, fd).catch(errorInterceptor('Failed to update event'))
}

export const deleteEvent = (id: string | number) =>
  del(`/events/${id}`).catch(errorInterceptor('Failed to delete event'))

export const toggleRSVP = (id: string | number) =>
  post(`/events/${id}/rsvp`).catch(errorInterceptor('Failed to update registration status'))

// ===============================
// JOBS (ADMIN)
// ===============================
export const createJob = (payload: { title: string, company: string, location: string, link?: string, deadline?: string, image?: File | null }) => {
  const fd = new FormData()
  fd.append('title', payload.title)
  fd.append('company', payload.company)
  fd.append('location', payload.location)
  if (payload.link) fd.append('link', payload.link)
  if (payload.deadline) fd.append('deadline', payload.deadline)
  if (payload.image) fd.append('image', payload.image)
  return post('/jobs', fd).catch(errorInterceptor('Failed to create job'))
}

export const updateJob = (id: string | number, payload: { title: string, company: string, location: string, link?: string, deadline?: string, image?: File | null, removeImage?: boolean }) => {
  const fd = new FormData()
  fd.append('title', payload.title)
  fd.append('company', payload.company)
  fd.append('location', payload.location)
  if (payload.link) fd.append('link', payload.link)
  if (payload.deadline) fd.append('deadline', payload.deadline)
  if (payload.image) fd.append('image', payload.image)
  if (payload.removeImage) fd.append('removeImage', 'true')
  return put(`/jobs/${id}`, fd).catch(errorInterceptor('Failed to update job'))
}

export const deleteJob = (id: string | number) =>
  del(`/jobs/${id}`).catch(errorInterceptor('Failed to delete job'))


// ===============================
// ROLES & SKILLS (CORE BACKEND)
// ===============================
export const getRoles = (): Promise<string[]> => get('/roles').catch(errorInterceptor('Failed to fetch roles'))

export const getJobsByRoleLevel = (role: string, level: string): Promise<{ id: number, title: string }[]> =>
  get('/jobs/by-role-level', { role, level }).catch(errorInterceptor('Failed to fetch jobs by role and level'))

export const getSkillsByRoleLevel = (role: string, level: string): Promise<string[]> =>
  get('/skills/by-role-level', { role, level }).catch(errorInterceptor('Failed to fetch skills by role and level'))

// ===============================
// 🔥 ML BACKEND — ROLE + LEVEL SKILL GAP
// ===============================
export const analyzeSkillGapRoleLevel = async (resume: File, role: string, level: string): Promise<{
  role: string, level: string, required_skills: string[], extracted_resume_skills: string[],
  matched_skills: string[], missing_skills: string[], raw_coverage_percent: number, ml_match_percentage: number
}> => {
  const formData = new FormData()
  formData.append('resume', resume)
  formData.append('role', role)
  formData.append('level', level)

  return mlApi.post<{
    role: string, level: string, required_skills: string[], extracted_resume_skills: string[],
    matched_skills: string[], missing_skills: string[], raw_coverage_percent: number, ml_match_percentage: number
  }>('/skill-gap/analyze-role-level', formData)
    .then(res => res as any) // interceptor unwraps .data, but TS misses it
    .catch(errorInterceptor('Skill gap analysis failed'))
}

// ===============================
// CONTACT / SUPPORT
// ===============================
export const postContact = (payload: { name: string, email: string, message: string }) =>
  post('/contact', payload).catch(errorInterceptor('Failed to send message'))

// ===============================
// TICKETS (SUPPORT)
// ===============================
export const createTicket = (payload: { title: string, description: string, type?: string }) =>
  post('/tickets', payload).catch(errorInterceptor('Failed to create ticket'))

export const getTickets = () => get('/tickets').catch(errorInterceptor('Failed to load tickets'))

export const updateTicketStatus = (id: string | number, status: string) =>
  put(`/tickets/${id}/status`, { status }).catch(errorInterceptor('Failed to update ticket status'))

// ===============================
// ANNOUNCEMENTS
// ===============================
export const getAnnouncements = () => get('/announcements').catch(errorInterceptor('Failed to load announcements'))

export const createAnnouncement = (payload: { title: string, body: string, expiresAt: string }) =>
  post('/announcements', payload).catch(errorInterceptor('Failed to create announcement'))

export const deleteAnnouncement = (id: string | number) =>
  del(`/announcements/${id}`).catch(errorInterceptor('Failed to delete announcement'))

// ===============================
// USERS/ADMIN
// ===============================
export const createAdminAccount = (payload: { name: string, email: string, password: string }) =>
  post('/admin', payload).catch(errorInterceptor('Failed to create admin'))

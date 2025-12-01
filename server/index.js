import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

import { EVENTS } from '../src/data/events.js'
import { JOBS } from '../src/data/jobs.js'
import { MENTORS } from '../src/data/mentors.js'
import { ALUMNI } from '../src/data/alumni.js'
import { SERVICES } from '../src/data/services.js'

const app = express()
dotenv.config()
const PORT = process.env.PORT || 3001
let client
let db
async function initDb() {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI not set; serving static data')
      return
    }
    client = new MongoClient(process.env.MONGO_URI)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'Alumni_portal')
    console.log('Connected to MongoDB')
  } catch (e) {
    console.error('MongoDB connection failed', e)
  }
}
initDb()

app.use(cors({ origin: true }))
app.use(express.json())
app.use(morgan('tiny'))

let users = [{ id: 1, email: 'demo@riphah.edu.pk', name: 'Demo User' }]

app.get('/', (req, res) => {
  res.type('text/plain').send('API OK')
})

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end()
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', ts: Date.now() })
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {}
  const emailOk = typeof email === 'string' && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email)
  const passOk = typeof password === 'string' && password.length >= 6
  if (!emailOk || !passOk) return res.status(400).json({ error: 'Invalid credentials' })
  let user = users.find(u => u.email === email)
  if (!user) { user = { id: users.length + 1, email, name: email.split('@')[0] }; users.push(user) }
  res.json({ token: 'demo-token', user })
})

app.get('/api/events', async (req, res) => {
  try {
    if (!db) return res.json(EVENTS)
    const items = await db.collection('events').find({}).sort({ date: 1 }).toArray()
    res.json(items.length ? items : EVENTS)
  } catch (e) {
    res.json(EVENTS)
  }
})
app.get('/api/jobs', (req, res) => { res.json(JOBS) })
app.get('/api/mentors', (req, res) => { res.json(MENTORS) })
app.get('/api/alumni', (req, res) => { res.json(ALUMNI) })
app.get('/api/services', (req, res) => { res.json(SERVICES) })

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {}
  const ok = (name || '').trim().length >= 2 && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email || '') && (message || '').trim().length >= 4
  if (!ok) return res.status(400).json({ error: 'Invalid message' })
  res.json({ status: 'received' })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

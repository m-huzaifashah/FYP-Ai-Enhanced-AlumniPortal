import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

import { initDb, memServer, db } from './config/db.js'

// Import Routers
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import skillRoutes from './routes/skillRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import ticketRoutes from './routes/ticketRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js'

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })
const PORT = process.env.PORT || 3008

const app = express()

// Initialize MongoDB
initDb()

// Middleware
app.use(cors({ origin: true }))
app.use(express.json())
app.use(morgan('tiny'))


// Base Routes
app.get('/', (req, res) => {
  res.type('text/plain').send('API OK')
})

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end()
})

app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    ts: Date.now(),
    db: !!db,
    mode: memServer ? 'memory' : (db ? 'db' : 'memory'),
    envMongoUri: !!process.env.MONGO_URI,
    envMongoUrl: !!process.env.MONGO_URL,
    dbName: process.env.DB_NAME || 'Alumni_portal',
  })
})

// Mount Routers
app.use('/api', authRoutes)
app.use('/api', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/announcements', announcementRoutes)

import { getRoles } from './controllers/jobController.js'
app.get('/api/roles', getRoles)

// Start Server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

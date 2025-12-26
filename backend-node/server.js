import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

import initDb from './config/db.js'
import { loadJobsOnce } from './loaders/loadJobs.js'

// routes
import authRoutes from './routes/auth.routes.js'
import jobRoutes from './routes/jobs.routes.js'
import skillRoutes from './routes/skills.routes.js'
import eventRoutes from './routes/events.routes.js'
import alumniRoutes from './routes/alumni.routes.js'
import serviceRoutes from './routes/services.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3008

app.use(cors({ origin: true }))
app.use(express.json())
app.use(morgan('tiny'))

await initDb()
await loadJobsOnce()

app.use('/api', authRoutes)
app.use('/api', jobRoutes)
app.use('/api', skillRoutes)
app.use('/api', eventRoutes)
app.use('/api', alumniRoutes)
app.use('/api', serviceRoutes)

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Node backend running on http://localhost:${PORT}`)
})

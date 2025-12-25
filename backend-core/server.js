import express from 'express'
import cors from 'cors'
import { loadJobs } from './utils/loadjobs.js'

const app = express()
const PORT = process.env.PORT || 3008

app.use(cors())
app.use(express.json())

let JOBS = []
let SKILL_VOCAB = []

// ===============================
// LOAD DATASET ON STARTUP
// ===============================
loadJobs()
  .then(data => {
    JOBS = data.jobs
    SKILL_VOCAB = data.skillVocabulary
    console.log(`Loaded ${JOBS.length} jobs`)
    console.log(`Loaded ${SKILL_VOCAB.length} skills`)
  })
  .catch(err => {
    console.error('Failed to load job dataset:', err)
  })

// ===============================
// HEALTH CHECK
// ===============================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ===============================
// JOB ENDPOINTS
// ===============================
app.get('/api/jobs', (req, res) => {
  res.json(
    JOBS.map(j => ({
      id: j.id,
      title: j.title
    }))
  )
})

app.get('/api/jobs/:id', (req, res) => {
  const job = JOBS.find(j => j.id === Number(req.params.id))
  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }
  res.json(job)
})

// ===============================
// SKILL VOCABULARY
// ===============================
app.get('/api/skills', (req, res) => {
  if (!SKILL_VOCAB.length) {
    return res.status(503).json({ error: 'Skills not loaded yet' })
  }
  res.json(SKILL_VOCAB)
})

// ===============================
// JOBS BY ROLE (CRITICAL FIX)
// ===============================
app.get('/api/jobs/by-role/:role', (req, res) => {
  // const role = req.params.role.toLowerCase()

  // const roleMap = {
  //   frontend: ['frontend', 'react', 'web', 'ui'],
  //   backend: ['backend', 'api', 'server'],
  //   data: ['data', 'analyst', 'bi', 'ml']
  // }

  // const keywords = roleMap[role] || [role]

  const filteredJobs = JOBS.filter(job =>
    keywords.some(k => job.title.toLowerCase().includes(k))
  )
const result = filteredJobs.length > 0
  ? filteredJobs
  : JOBS.slice(0, 20) // fallback

res.json(result.map(j => ({
  id: j.id,
  title: j.title


  })))
})



// ===============================
app.listen(PORT, () => {
  console.log(`CORE backend running on http://localhost:${PORT}`)
})

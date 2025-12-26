// backend-node/routes/jobs.routes.js
import express from 'express'
import { ObjectId } from 'mongodb'
import { db } from '../config/db.js'

const router = express.Router()

// -------------------------
// GET ALL JOBS (PUBLIC)
// -------------------------
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await db
      .collection('jobs')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    res.json(jobs.map(j => ({ ...j, id: String(j._id) })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' })
  }
})

// -------------------------
// CREATE JOB (ADMIN)
// -------------------------
router.post('/jobs', async (req, res) => {
  const { title, company, location, skills, description } = req.body || {}

  if (!title || !company || !location) {
    return res.status(400).json({ error: 'Invalid job data' })
  }

  try {
    const doc = {
      title,
      company,
      location,
      skills: Array.isArray(skills) ? skills : [],
      description: description || '',
      createdAt: new Date()
    }

    const result = await db.collection('jobs').insertOne(doc)

    res.json({ id: String(result.insertedId), ...doc })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job' })
  }
})

// -------------------------
// UPDATE JOB (ADMIN)
// -------------------------
router.put('/jobs/:id', async (req, res) => {
  const { id } = req.params

  try {
    await db.collection('jobs').updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' })
  }
})

// -------------------------
// DELETE JOB (ADMIN)
// -------------------------
router.delete('/jobs/:id', async (req, res) => {
  const { id } = req.params

  try {
    await db.collection('jobs').deleteOne({ _id: new ObjectId(id) })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' })
  }
})

export default router

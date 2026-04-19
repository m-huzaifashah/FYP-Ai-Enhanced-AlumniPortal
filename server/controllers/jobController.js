import Job from '../models/Job.js'
import { loadJobs } from '../utils/loadjobs.js'
import { detectRole, buildRoleSkillMap } from '../utils/jobHelpers.js'
import { uploadToImageKit } from '../utils/imagekit.js'

// Helper: convert multer file buffer → base64 data URL
// const fileToBase64 = (file) =>
//   file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : null

export let jobsLocal = []
export let skillVocabulary = []
export let ROLE_SKILLS = {}

loadJobs().then(data => {
  jobsLocal = data.jobs.map(job => ({
    ...job,
    role: detectRole(job.title)
  }))
  skillVocabulary = data.skillVocabulary
  ROLE_SKILLS = buildRoleSkillMap(jobsLocal)
  console.log('Loaded jobs:', jobsLocal.length)
  console.log('Roles:', Object.keys(ROLE_SKILLS))
}).catch(e => console.error('Error loading jobs CSV', e))
export const getRoles = (req, res) => {
  res.json(Object.keys(ROLE_SKILLS))
}

export const getJobs = async (req, res) => {
  try {
    const { source } = req.query
    const dbJobs = await Job.find({})
    const mappedDbJobs = dbJobs.map(j => {
        const obj = j.toObject()
        const { _id, ...rest } = obj
        return { ...rest, id: String(_id) }
    })
    
    if (source === 'db') {
      return res.json(mappedDbJobs)
    }

    const allJobs = [...mappedDbJobs, ...jobsLocal]
    res.json(allJobs)
  } catch (e) {
    console.error('Get jobs error', e)
    const { source } = req.query
    if (source === 'db') return res.json([])
    res.json(jobsLocal)
  }
}

export const getJobById = async (req, res) => {
  const id = req.params.id
  try {
    try {
      const job = await Job.findById(id)
      if (job) return res.json({ ...job.toObject(), id: String(job._id) })
    } catch (e) {}
    
    const localJob = jobsLocal.find(j => String(j.id) === String(id))
    if (localJob) return res.json(localJob)
    
    return res.status(404).json({ error: 'Job not found' })
  } catch (e) {
    res.status(500).json({ error: 'Error fetching job' })
  }
}

export const createJob = async (req, res) => {
  const { title, company, location, link, deadline } = req.body || {}
  const ok = typeof title === 'string' && title.trim() && typeof company === 'string' && typeof location === 'string'
  if (!ok) return res.status(400).json({ error: 'Invalid job' })

  let image = null
  if (req.file) {
    try {
      image = await uploadToImageKit(req.file.buffer, req.file.originalname, 'jobs')
    } catch (e) {
      console.error('ImageKit upload failed:', e)
    }
  }

  try {
    const job = await Job.create({ title, company, location, link: link || '', deadline, ...(image && { image }) })
    return res.json({ ...job.toObject(), id: String(job._id) })
  } catch (e) {
    res.status(500).json({ error: 'Failed to create job' })
  }
}

export const updateJob = async (req, res) => {
  const id = req.params.id
  const { title, company, location, link, deadline } = req.body || {}

  let image = null
  if (req.file) {
    try {
      image = await uploadToImageKit(req.file.buffer, req.file.originalname, 'jobs')
    } catch (e) {
      console.error('ImageKit upload failed:', e)
    }
  }

  try {
    const updateDoc = { title, company, location, link, deadline }
    if (image) updateDoc.image = image
    if (req.body.removeImage === 'true') updateDoc.image = null

    const updated = await Job.findByIdAndUpdate(id, updateDoc, { new: true })
    if (updated) return res.json({ ...updated.toObject(), id: String(updated._id) })
    
    const idx = jobsLocal.findIndex(j => String(j.id) === String(id))
    if (idx === -1) return res.status(404).json({ error: 'Not found' })
    jobsLocal[idx] = { ...jobsLocal[idx], title, company, location, link }
    res.json(jobsLocal[idx])
  } catch (e) {
    res.status(500).json({ error: 'Failed to update job' })
  }
}

export const deleteJob = async (req, res) => {
  const id = req.params.id
  try {
    try {
        const result = await Job.findByIdAndDelete(id)
        if (result) return res.json({ ok: true })
    } catch (e) {}
    
    jobsLocal = jobsLocal.filter(j => String(j.id) !== String(id))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete job' })
  }
}

export const getJobsByRole = (req, res) => {
  const role = req.params.role.toLowerCase()
  const filtered = jobsLocal.filter(j => j.role === role)
  res.json(filtered.map(j => ({ id: j.id, title: j.title })))
}

export const getJobsByRoleLevel = (req, res) => {
  const { role, level } = req.query
  if (!role || !level) {
    return res.status(400).json({ error: 'role and level required' })
  }
  const filteredJobs = jobsLocal.filter(job => job.role === role && job.level === level)
  res.json(filteredJobs)
}

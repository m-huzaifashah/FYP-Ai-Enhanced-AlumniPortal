import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'
import { loadJobs } from '../backend-core/utils/loadjobs.js'

import { MongoMemoryServer } from 'mongodb-memory-server'

import { EVENTS } from '../src/Frontend/data/events.js'
import { JOBS } from '../src/Frontend/data/jobs.js'
import { MENTORS } from '../src/Frontend/data/mentors.js'
import { ALUMNI } from '../src/Frontend/data/alumni.js'
import { SERVICES } from '../src/Frontend/data/services.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const app = express()
dotenv.config()
const PORT = process.env.PORT || 3008
let client
let db
let memServer

function hashPassword(p) {
  return crypto.createHash('sha256').update(String(p)).digest('hex')
}
function makeSalt() {
  return crypto.randomBytes(16).toString('hex')
}
async function initDb() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
    if (!process.env.MONGO_URI && !process.env.MONGO_URL) {
      console.warn('MONGO_URI/MONGO_URL not set; attempting local MongoDB')
    }
    client = new MongoClient(uri)
    try {
      await client.connect()
      async function loadJobsFromCSV() {
  return new Promise((resolve, reject) => {
    const jobs = []
    const skillSet = new Set()

    const csvPath = path.join(__dirname, 'data/clean_postings2.csv')

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (!row.job_title || !row.job_skills) return

        const skills = row.job_skills
          .toLowerCase()
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        skills.forEach(s => skillSet.add(s))

        jobs.push({
          id: jobs.length + 1,
          title: row.job_title,
          skills
        })
      })
      .on('end', () => {
        resolve({
          jobs,
          skillVocabulary: Array.from(skillSet)
        })
      })
      .on('error', reject)
  })
}

    } catch (e) {
      console.error('Initial MongoDB connection failed', e?.message || e)
      await new Promise(r => setTimeout(r, 1000))
      try {
        await client.connect()
      } catch (e2) {
        console.error('Second MongoDB connection attempt failed', e2?.message || e2)
        try {
          memServer = await MongoMemoryServer.create()
          const memUri = memServer.getUri()
          client = new MongoClient(memUri)
          await client.connect()
        } catch (e3) {
          throw e3
        }
      }
    }
    db = client.db(process.env.DB_NAME || 'Alumni_portal')
    console.log('Connected to MongoDB')
    const validators = {
      events: { $jsonSchema: { bsonType: 'object', required: ['title','date','location'], properties: { _id: {}, title: { bsonType: 'string', minLength: 1 }, date: { bsonType: 'string' }, location: { bsonType: 'string', minLength: 1 }, description: { bsonType: 'string' } }, additionalProperties: true } },
      jobs: { $jsonSchema: { bsonType: 'object', required: ['title','company','location'], properties: { _id: {}, title: { bsonType: 'string', minLength: 1 }, company: { bsonType: 'string', minLength: 1 }, location: { bsonType: 'string', minLength: 1 }, link: { bsonType: 'string' } }, additionalProperties: true } },
      mentors: { $jsonSchema: { bsonType: 'object', required: ['name','title','company','city','skills','type'], properties: { _id: {}, name: { bsonType: 'string', minLength: 1 }, title: { bsonType: 'string' }, company: { bsonType: 'string' }, city: { bsonType: 'string' }, type: { bsonType: 'string' }, skills: { bsonType: 'array', items: { bsonType: 'string' } } }, additionalProperties: true } },
      alumni: { $jsonSchema: { bsonType: 'object', required: ['name','batch','department','location','role','company'], properties: { _id: {}, email: { bsonType: 'string' }, name: { bsonType: 'string' }, batch: { anyOf: [{ bsonType: 'int' }, { bsonType: 'double' }] }, department: { bsonType: 'string' }, location: { bsonType: 'string' }, role: { bsonType: 'string' }, company: { bsonType: 'string' } }, additionalProperties: true } },
      services: { $jsonSchema: { bsonType: 'object', required: ['id','title','description','category'], properties: { _id: {}, id: { bsonType: 'string' }, title: { bsonType: 'string' }, description: { bsonType: 'string' }, category: { bsonType: 'string' } }, additionalProperties: true } },
      users: { $jsonSchema: { bsonType: 'object', required: ['email','name','passwordHash','role'], properties: { _id: {}, email: { bsonType: 'string' }, name: { bsonType: 'string' }, passwordHash: { bsonType: 'string' }, salt: { bsonType: 'string' }, role: { bsonType: 'string' } }, additionalProperties: true } }
    }
    const ensureCollection = async (name, validator) => {
      try {
        const exists = await db.listCollections({ name }).hasNext()
        if (!exists) {
          try {
            await db.createCollection(name, { validator, validationLevel: 'moderate' })
          } catch (e) {
            console.warn(`Create '${name}' without validator`, e?.codeName || e?.message || e)
            await db.createCollection(name)
          }
      } else {
        try {
          await db.command({ collMod: name, validator, validationLevel: 'moderate' })
          console.log(`Updated validator for '${name}'`)
        } catch (e) {
          // console.warn(`Validator update failed for '${name}'. Disabling validation as fallback.`, e?.codeName || e?.message || e)
          try {
            await db.command({ collMod: name, validationLevel: 'off' })
            // console.log(`Validation disabled for '${name}'`)
          } catch (e2) {
            // console.error(`Could not disable validation for '${name}'`, e2?.message || e2)
          }
        }
      }
      } catch (e) {
        console.warn(`ensureCollection '${name}' failed`, e?.message || e)
      }
    }
    await ensureCollection('events', validators.events)
    await ensureCollection('jobs', validators.jobs)
    await ensureCollection('mentors', validators.mentors)
    await ensureCollection('alumni', validators.alumni)
    await ensureCollection('students', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'name'],
          properties: {
            email: { bsonType: 'string', description: 'must be a string and is required' },
            name: { bsonType: 'string', description: 'must be a string and is required' },
            batch: { bsonType: 'string', description: 'must be a string' },
            department: { bsonType: 'string', description: 'must be a string' },
            semester: { bsonType: 'string', description: 'must be a string' }
          }
        }
      }
    })
    await ensureCollection('services', validators.services)
    await ensureCollection('users_v2', validators.users)
    try {
      await db.collection('users_v2').createIndex({ email: 1 }, { unique: true })
    } catch (e) {
      console.warn('Unique index on users_v2.email failed or exists', e?.codeName || e?.message || e)
    }
    try {
      const seedIfEmpty = async (name, docs) => {
        const coll = db.collection(name)
        const count = await coll.estimatedDocumentCount()
        if (count === 0 && Array.isArray(docs) && docs.length) {
          await coll.insertMany(docs)
          console.log(`Seeded collection '${name}' with ${docs.length} docs`)
        }
      }
      await seedIfEmpty('events', EVENTS)
      await seedIfEmpty('jobs', JOBS)
      await seedIfEmpty('mentors', MENTORS)
      await seedIfEmpty('alumni', ALUMNI)
      await seedIfEmpty('services', SERVICES)
      const adminEmail = process.env.ADMIN_EMAIL
      const adminPass = process.env.ADMIN_PASSWORD
      const adminName = process.env.ADMIN_NAME || 'Portal Admin'
      if (adminEmail && adminPass) {
        const exists = await db.collection('users_v2').findOne({ email: adminEmail })
        if (!exists) {
          const salt = makeSalt()
          try {
            await db.collection('users_v2').insertOne({ email: adminEmail, name: adminName, role: 'admin', salt, passwordHash: hashPassword(salt + adminPass) })
            console.log(`Seeded admin user '${adminEmail}'`)
          } catch (e) {
            if (e?.code === 121 || String(e?.codeName || '').includes('DocumentValidationFailure') || String(e?.message || '').includes('Document failed validation')) {
              await db.collection('users_v2').insertOne({ email: adminEmail, name: adminName, role: 'admin', passwordHash: hashPassword(adminPass) })
              console.log(`Seeded admin user '${adminEmail}' (no salt fallback)`)
            } else {
              throw e
            }
          }
        }
      }
    } catch (e) {
      console.warn('Seeding skipped or failed', e?.message || e)
    }
  } catch (e) {
    console.error('MongoDB connection failed', e)
  }
}
initDb()

app.use(cors({ origin: true }))
app.use(express.json())
app.use(morgan('tiny'))

let users = []
let eventsLocal = [...EVENTS]
// let jobsLocal = [...JOBS]
let jobsLocal = []
let skillVocabulary = []


function mapDocs(items) {
  return (items || []).map(it => {
    const { _id, ...rest } = it || {}
    const id = _id ? String(_id) : rest.id
    return { id, ...rest }
  })
}

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

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {}
  const emailOk = typeof email === 'string' && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email)
  const passOk = typeof password === 'string' && password.length >= 6
  if (!emailOk || !passOk) return res.status(400).json({ error: 'Invalid credentials' })
  try {
    if (db) {
      try {
        let user = await db.collection('users_v2').findOne({ email })
        if (!user && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL) {
          const salt = makeSalt()
          try {
            const doc = { email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME || 'Portal Admin', role: 'admin', salt, passwordHash: hashPassword(salt + process.env.ADMIN_PASSWORD) }
            const r = await db.collection('users_v2').insertOne(doc)
            user = { ...doc, _id: r.insertedId }
            console.log(`Created admin user '${email}' on login`)
          } catch (e) {
            if (e?.code === 121 || String(e?.codeName || '').includes('DocumentValidationFailure') || String(e?.message || '').includes('Document failed validation')) {
              const doc = { email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME || 'Portal Admin', role: 'admin', passwordHash: hashPassword(process.env.ADMIN_PASSWORD) }
              const r = await db.collection('users_v2').insertOne(doc)
              user = { ...doc, _id: r.insertedId }
              console.log(`Created admin user '${email}' on login (no salt fallback)`)
            } else {
              throw e
            }
          }
        }
        if (user) {
          const ok = user.passwordHash === hashPassword((user.salt || '') + password)
          if (!ok) return res.status(401).json({ error: 'Incorrect password' })
          return res.json({ token: crypto.randomBytes(16).toString('hex'), user: { id: String(user._id), email: user.email, name: user.name, role: user.role } })
        }
        return res.status(401).json({ error: 'User not found' })
      } catch (e) {
        console.warn('DB login error', e?.message || e)
        return res.status(500).json({ error: 'Login failed' })
      }
    }
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL && hashPassword(password) === hashPassword(process.env.ADMIN_PASSWORD)) {
      return res.json({ token: crypto.randomBytes(16).toString('hex'), user: { id: 'admin-env', email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME || 'Portal Admin', role: 'admin' } })
    }
    return res.status(503).json({ error: 'Database not available' })
  } catch (e) {
    console.error('Login error', e?.message || e)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.post('/api/signup', async (req, res) => {
  const { name, email, password, role, secret } = req.body || {}
  const emailOk = typeof email === 'string' && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email)
  const passOk = typeof password === 'string' && password.length >= 6
  const nameOk = typeof name === 'string' && name.trim().length >= 2
  const allowedRoles = ['student', 'admin', 'alumni']
  const roleVal = allowedRoles.includes(role) ? role : 'student'
  if (!emailOk || !passOk || !nameOk) return res.status(400).json({ error: 'Invalid signup data' })
  if (roleVal === 'admin') {
    const envSecret = process.env.ADMIN_SIGNUP_SECRET
    if (!envSecret || secret !== envSecret) return res.status(403).json({ error: 'Admin signup not allowed' })
  }
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' })
    try {
      const existing = await db.collection('users_v2').findOne({ email })
      if (existing) return res.status(409).json({ error: 'Email already registered' })
      const salt = makeSalt()
      try {
        const doc = { email, name, role: roleVal, salt, passwordHash: hashPassword(salt + password) }
        // Force bypass validation since we cannot update the schema
        const r = await db.collection('users_v2').insertOne(doc)
        return res.json({ id: String(r.insertedId), email, name, role: roleVal })
      } catch (e) {
        if (e?.code === 121 || String(e?.codeName || '').includes('DocumentValidationFailure') || String(e?.message || '').includes('Document failed validation')) {
          const doc = { email, name, role: roleVal, passwordHash: hashPassword(password) }
          const r = await db.collection('users_v2').insertOne(doc)
          return res.json({ id: String(r.insertedId), email, name, role: roleVal })
        }
        throw e
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 11000) {
        return res.status(409).json({ error: 'Email already registered' })
      }
      console.warn('DB signup error', e?.message || e)
      const info = e?.errInfo ? ` | ${JSON.stringify(e.errInfo)}` : ''
      return res.status(500).json({ error: `Signup failed: ${e?.message || 'unknown error'}${e?.code ? ` (code ${e.code})` : ''}${e?.codeName ? ` [${e.codeName}]` : ''}${info}` })
    }
  } catch (e) {
    res.status(500).json({ error: 'Signup failed' })
  }
}) 

app.get('/api/profile', async (req, res) => {
  const { email } = req.query || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' })
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' })
    const user = await db.collection('users_v2').findOne({ email })
    if (!user) return res.status(404).json({ error: 'User not found' })
    let profile = { id: String(user._id), email: user.email, name: user.name, role: user.role }
    if (user.role === 'alumni') {
      const alumniDoc = await db.collection('alumni').findOne({ email })
      if (alumniDoc) {
        profile = { ...profile, ...alumniDoc, id: String(alumniDoc._id || user._id) }
      }
    } else if (user.role === 'student') {
      const studentDoc = await db.collection('students').findOne({ email })
      if (studentDoc) {
        profile = { ...profile, ...studentDoc, id: String(studentDoc._id || user._id) }
      }
    }
    res.json(profile)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

app.put('/api/profile', async (req, res) => {
  const { email, name, ...rest } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' })
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' })
    const user = await db.collection('users_v2').findOne({ email })
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    // Update basic user info
    if (name) await db.collection('users_v2').updateOne({ email }, { $set: { name } })
    
    // Update extended profile if alumni
    if (user.role === 'alumni') {
      const { batch, department, location, role: jobRole, company } = rest
      const alumniUpdate = {
        name: name || user.name,
        email,
        ...(batch ? { batch: Number(batch) } : {}),
        ...(department ? { department } : {}),
        ...(location ? { location } : {}),
        ...(jobRole ? { role: jobRole } : {}),
        ...(company ? { company } : {}),
      }
      await db.collection('alumni').updateOne(
        { email }, 
        { $set: alumniUpdate }, 
        { upsert: true }
      )
    } else if (user.role === 'student') {
      const { batch, department, semester } = rest
      const studentUpdate = {
        name: name || user.name,
        email,
        ...(batch ? { batch: String(batch) } : {}),
        ...(department ? { department } : {}),
        ...(semester ? { semester } : {}),
      }
      await db.collection('students').updateOne(
        { email },
        { $set: studentUpdate },
        { upsert: true }
      )
    }
    res.json({ success: true })
  } catch (e) {
    console.error('Profile update failed', e)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

app.get('/api/users', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' })
    const items = await db.collection('users_v2').find({}).project({ email: 1, name: 1, role: 1 }).toArray()
    const dbUsers = items.map(it => ({ id: String(it._id), email: it.email, name: it.name, role: it.role }))
    res.json(dbUsers)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list users' })
  }
})

app.get('/api/debug/users-validator', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' })
    const opts = await db.collection('users_v2').options()
    const stats = await db.command({ collStats: 'users_v2' }).catch(() => ({}))
    res.json({ options: opts || {}, stats })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed to get validator' })
  }
})

app.get('/api/events', async (req, res) => {
  try {
    if (!db) return res.json(eventsLocal)
    const items = await db.collection('events').find({}).sort({ date: 1 }).toArray()
    const mapped = mapDocs(items)
    res.json(mapped.length ? mapped : eventsLocal)
  } catch (e) {
    res.json(eventsLocal)
  }
})
app.post('/api/events', async (req, res) => {
  const { title, date, location, description } = req.body || {}
  const ok = typeof title === 'string' && title.trim() && typeof date === 'string' && typeof location === 'string'
  if (!ok) return res.status(400).json({ error: 'Invalid event' })
  try {
    if (db) {
      const doc = { title, date, location, description: description || '' }
      const r = await db.collection('events').insertOne(doc)
      return res.json({ ...doc, id: String(r.insertedId) })
    }
    const id = Math.max(0, ...eventsLocal.map(e => e.id || 0)) + 1
    const ev = { id, title, date, location, description: description || '' }
    eventsLocal.push(ev)
    res.json(ev)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create event' })
  }
})
app.put('/api/events/:id', async (req, res) => {
  const id = req.params.id
  const { title, date, location, description } = req.body || {}
  try {
    if (db) {
      const r = await db.collection('events').findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { title, date, location, description } }, { returnDocument: 'after' })
      return res.json(r.value || { id, title, date, location, description })
    }
    const idx = eventsLocal.findIndex(e => String(e.id) === String(id))
    if (idx === -1) return res.status(404).json({ error: 'Not found' })
    eventsLocal[idx] = { ...eventsLocal[idx], title, date, location, description }
    res.json(eventsLocal[idx])
  } catch (e) {
    res.status(500).json({ error: 'Failed to update event' })
  }
})
app.delete('/api/events/:id', async (req, res) => {
  const id = req.params.id
  try {
    if (db) {
      await db.collection('events').deleteOne({ _id: new ObjectId(id) })
      return res.json({ ok: true })
    }
    eventsLocal = eventsLocal.filter(e => String(e.id) !== String(id))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete event' })
  }
})
app.get('/api/jobs', async (req, res) => {
  try {
    if (!db) return res.json(jobsLocal)
    const items = await db.collection('jobs').find({}).toArray()
    const mapped = mapDocs(items)
    res.json(mapped.length ? mapped : jobsLocal)
  } catch (e) {
    res.json(jobsLocal)
  }
})
app.post('/api/jobs', async (req, res) => {
  const { title, company, location, link } = req.body || {}
  const ok = typeof title === 'string' && title.trim() && typeof company === 'string' && typeof location === 'string'
  if (!ok) return res.status(400).json({ error: 'Invalid job' })
  try {
    if (db) {
      const doc = { title, company, location, link: link || '' }
      const r = await db.collection('jobs').insertOne(doc)
      return res.json({ ...doc, id: String(r.insertedId) })
    }
    const id = Math.max(0, ...jobsLocal.map(j => j.id || 0)) + 1
    const job = { id, title, company, location, link: link || '' }
    jobsLocal.push(job)
    res.json(job)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create job' })
  }
})
app.put('/api/jobs/:id', async (req, res) => {
  const id = req.params.id
  const { title, company, location, link } = req.body || {}
  try {
    if (db) {
      const r = await db.collection('jobs').findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { title, company, location, link } }, { returnDocument: 'after' })
      return res.json(r.value || { id, title, company, location, link })
    }
    const idx = jobsLocal.findIndex(j => String(j.id) === String(id))
    if (idx === -1) return res.status(404).json({ error: 'Not found' })
    jobsLocal[idx] = { ...jobsLocal[idx], title, company, location, link }
    res.json(jobsLocal[idx])
  } catch (e) {
    res.status(500).json({ error: 'Failed to update job' })
  }
})
app.delete('/api/jobs/:id', async (req, res) => {
  const id = req.params.id
  try {
    if (db) {
      await db.collection('jobs').deleteOne({ _id: new ObjectId(id) })
      return res.json({ ok: true })
    }
    jobsLocal = jobsLocal.filter(j => String(j.id) !== String(id))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete job' })
  }
})
app.get('/api/mentors', async (req, res) => {
  try {
    if (!db) return res.json(MENTORS)
    const items = await db.collection('mentors').find({}).toArray()
    const mapped = mapDocs(items)
    res.json(mapped.length ? mapped : MENTORS)
  } catch (e) {
    res.json(MENTORS)
  }
})
app.get('/api/alumni', async (req, res) => {
  try {
    if (!db) return res.json(ALUMNI)
    const items = await db.collection('alumni').find({}).toArray()
    const mapped = mapDocs(items)
    res.json(mapped.length ? mapped : ALUMNI)
  } catch (e) {
    res.json(ALUMNI)
  }
})
app.get('/api/services', async (req, res) => {
  try {
    if (!db) return res.json(SERVICES)
    const items = await db.collection('services').find({}).toArray()
    const mapped = mapDocs(items)
    res.json(mapped.length ? mapped : SERVICES)
  } catch (e) {
    res.json(SERVICES)
  }
})
app.get('/api/skills', (req, res) => {
  res.json(skillVocabulary)
})


app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {}
  const ok = (name || '').trim().length >= 2 && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email || '') && (message || '').trim().length >= 4
  if (!ok) return res.status(400).json({ error: 'Invalid message' })
  res.json({ status: 'received' })
})

loadJobs()
  .then(data => {
    jobsLocal = data.jobs
    skillVocabulary = data.skillVocabulary
    console.log(`Loaded ${jobsLocal.length} jobs`)
    console.log(`Loaded ${skillVocabulary.length} skills`)
  })
  .catch(err => {
    console.error('Failed to load jobs dataset:', err)
  })


app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

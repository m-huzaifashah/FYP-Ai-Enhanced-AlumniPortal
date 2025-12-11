import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'

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
    const validators = {
      events: { $jsonSchema: { bsonType: 'object', required: ['title','date','location'], properties: { title: { bsonType: 'string', minLength: 1 }, date: { bsonType: 'string' }, location: { bsonType: 'string', minLength: 1 }, description: { bsonType: 'string' } }, additionalProperties: false } },
      jobs: { $jsonSchema: { bsonType: 'object', required: ['title','company','location'], properties: { title: { bsonType: 'string', minLength: 1 }, company: { bsonType: 'string', minLength: 1 }, location: { bsonType: 'string', minLength: 1 }, link: { bsonType: 'string' } }, additionalProperties: false } },
      mentors: { $jsonSchema: { bsonType: 'object', required: ['name','title','company','city','skills','type'], properties: { name: { bsonType: 'string', minLength: 1 }, title: { bsonType: 'string' }, company: { bsonType: 'string' }, city: { bsonType: 'string' }, type: { bsonType: 'string' }, skills: { bsonType: 'array', items: { bsonType: 'string' } } }, additionalProperties: false } },
      alumni: { $jsonSchema: { bsonType: 'object', required: ['name','batch','department','location','role','company'], properties: { name: { bsonType: 'string' }, batch: { anyOf: [{ bsonType: 'int' }, { bsonType: 'double' }] }, department: { bsonType: 'string' }, location: { bsonType: 'string' }, role: { bsonType: 'string' }, company: { bsonType: 'string' } }, additionalProperties: false } },
      services: { $jsonSchema: { bsonType: 'object', required: ['id','title','description','category'], properties: { id: { bsonType: 'string' }, title: { bsonType: 'string' }, description: { bsonType: 'string' }, category: { bsonType: 'string' } }, additionalProperties: false } }
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
          } catch (e) {
            console.warn(`Validator not applied to '${name}'`, e?.codeName || e?.message || e)
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
    await ensureCollection('services', validators.services)
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

let users = [{ id: 1, email: 'demo@riphah.edu.pk', name: 'Demo User' }]
let eventsLocal = [...EVENTS]
let jobsLocal = [...JOBS]

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
  res.json({ ok: true, status: 'healthy', ts: Date.now(), db: !!db, mode: db ? 'db' : 'memory' })
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

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {}
  const ok = (name || '').trim().length >= 2 && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email || '') && (message || '').trim().length >= 4
  if (!ok) return res.status(400).json({ error: 'Invalid message' })
  res.json({ status: 'received' })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

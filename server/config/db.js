import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'

import Event from '../models/Event.js'
import Job from '../models/Job.js'
import Mentor from '../models/Mentor.js'
import Alumni from '../models/Alumni.js'
import Service from '../models/Service.js'
import User from '../models/User.js'

import { EVENTS } from '../../src/Frontend/data/events.js'
import { JOBS } from '../../src/Frontend/data/jobs.js'
import { MENTORS } from '../../src/Frontend/data/mentors.js'
import { ALUMNI } from '../../src/Frontend/data/alumni.js'
import { SERVICES } from '../../src/Frontend/data/services.js'

dotenv.config()

export let memServer

export async function initDb() {
  try {
    let uri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/Alumni_portal'
    
    if (!process.env.MONGO_URI && !process.env.MONGO_URL) {
      console.warn('MONGO_URI/MONGO_URL not set; attempting local MongoDB')
    }

    try {
      await mongoose.connect(uri)
      console.log('Connected to MongoDB via Mongoose')
    } catch (e) {
      console.warn('Initial MongoDB connection failed. Trying MongoMemoryServer fallback...')
      memServer = await MongoMemoryServer.create()
      uri = memServer.getUri()
      await mongoose.connect(uri)
      console.log('Connected to fallback MongoMemoryServer instance')
    }

    // Seeding logic
    try {
      const seedIfEmpty = async (Model, docs) => {
        const count = await Model.estimatedDocumentCount()
        if (count === 0 && Array.isArray(docs) && docs.length) {
          await Model.insertMany(docs)
          console.log(`Seeded collection '${Model.collection.name}' with ${docs.length} docs`)
        }
      }

      await seedIfEmpty(Event, EVENTS)
      await seedIfEmpty(Job, JOBS)
      await seedIfEmpty(Mentor, MENTORS)
      await seedIfEmpty(Alumni, ALUMNI)
      await seedIfEmpty(Service, SERVICES)

      const adminEmail = process.env.ADMIN_EMAIL
      const adminPass = process.env.ADMIN_PASSWORD
      const adminName = process.env.ADMIN_NAME || 'Portal Admin'

      if (adminEmail && adminPass) {
        const exists = await User.findOne({ email: adminEmail })
        if (!exists) {
          const hashedPassword = await bcrypt.hash(adminPass, 10)
          await User.create({
            email: adminEmail,
            name: adminName,
            role: 'admin',
            passwordHash: hashedPassword
          })
          console.log(`Seeded admin user '${adminEmail}'`)
        }
      }
    } catch (e) {
      console.warn('Seeding skipped or failed', e?.message || e)
    }

  } catch (e) {
    console.error('MongoDB connection failed', e)
  }
}

// Export a property mimicking the old native "db" object slightly for drop-in compatibility check hooks if required,
// though all operations should move to Models.
export const db = mongoose.connection;

// backend-node/config/db.js
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

let client = null
let db = null
let memServer = null

export default async function initDb() {
  // Prevent multiple connections
  if (db) return db

  const uri =
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    'mongodb://127.0.0.1:27017'

  try {
    // Try real MongoDB (Atlas / Local)
    client = new MongoClient(uri)
    await client.connect()
    console.log('✅ MongoDB connected')
  } catch (err) {
    // Fallback to in-memory MongoDB
    console.warn('⚠️ MongoDB connection failed, using in-memory DB')

    memServer = await MongoMemoryServer.create()
    client = new MongoClient(memServer.getUri())
    await client.connect()
  }

  db = client.db(process.env.DB_NAME || 'Alumni_portal')
  return db
}

// Named export so routes can access db directly
export { db }

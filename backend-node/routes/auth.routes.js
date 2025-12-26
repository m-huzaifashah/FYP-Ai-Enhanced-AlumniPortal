// backend-node/routes/auth.routes.js
import express from 'express'
import crypto from 'crypto'
import { db } from '../config/db.js'

const router = express.Router()

// ----------------------
// Helpers
// ----------------------
function hashPassword(p) {
  return crypto.createHash('sha256').update(String(p)).digest('hex')
}

function makeSalt() {
  return crypto.randomBytes(16).toString('hex')
}

// ----------------------
// LOGIN
// ----------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const user = await db.collection('users_v2').findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const ok =
      user.passwordHash ===
      hashPassword((user.salt || '') + password)

    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // simple token (DEV / FYP)
    const token = crypto.randomBytes(24).toString('hex')

    res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ----------------------
// SIGNUP
// ----------------------
router.post('/signup', async (req, res) => {
  const { name, email, password, role, secret } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Invalid signup data' })
  }

  const allowedRoles = ['student', 'alumni', 'admin']
  const finalRole = allowedRoles.includes(role) ? role : 'student'

  // protect admin signup
  if (finalRole === 'admin') {
    if (secret !== process.env.ADMIN_SIGNUP_SECRET) {
      return res.status(403).json({ error: 'Admin signup not allowed' })
    }
  }

  try {
    const existing = await db.collection('users_v2').findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const salt = makeSalt()
    const passwordHash = hashPassword(salt + password)

    const doc = {
      name,
      email,
      role: finalRole,
      salt,
      passwordHash
    }

    const result = await db.collection('users_v2').insertOne(doc)

    res.json({
      id: String(result.insertedId),
      email,
      name,
      role: finalRole
    })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Signup failed' })
  }
})

// ----------------------
// LOGOUT (frontend-only)
// ----------------------
router.post('/logout', (req, res) => {
  // token is client-side only for now
  res.json({ ok: true })
})

export default router

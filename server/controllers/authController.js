import { hashPassword, comparePassword } from '../utils/crypto.js'
import User from '../models/User.js'
import crypto from 'crypto'

export const login = async (req, res) => {
  const { email, password } = req.body || {}
  const emailOk = typeof email === 'string' && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email)
  const passOk = typeof password === 'string' && password.length >= 6
  if (!emailOk || !passOk) return res.status(400).json({ error: 'Invalid credentials' })
  
  try {
    let user = await User.findOne({ email })
    
    if (!user && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL) {
      const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD)
      user = await User.create({ 
        email: process.env.ADMIN_EMAIL, 
        name: process.env.ADMIN_NAME || 'Portal Admin', 
        role: 'admin', 
        passwordHash: hashedPassword 
      })
      console.log(`Created admin user '${email}' on login`)
    }
    
    if (user) {
      const ok = await comparePassword(password, user.passwordHash)
      if (!ok) return res.status(401).json({ error: 'Incorrect password' })
      return res.json({ 
        token: crypto.randomBytes(16).toString('hex'), 
        user: { id: String(user._id), email: user.email, name: user.name, role: user.role } 
      })
    }
    
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL) {
      const isEnvAdminPassword = await comparePassword(password, await hashPassword(process.env.ADMIN_PASSWORD))
      if (isEnvAdminPassword) {
        return res.json({ 
          token: crypto.randomBytes(16).toString('hex'), 
          user: { id: 'admin-env', email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME || 'Portal Admin', role: 'admin' } 
        })
      }
    }
    
    return res.status(401).json({ error: 'User not found' })
  } catch (e) {
    console.error('Login error', e?.message || e)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const signup = async (req, res) => {
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
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    
    const hashedPassword = await hashPassword(password)
    const user = await User.create({ 
      email, 
      name, 
      role: roleVal, 
      passwordHash: hashedPassword 
    })
    
    return res.json({ id: String(user._id), email: user.email, name: user.name, role: user.role })
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    console.warn('DB signup error', e?.message || e)
    return res.status(500).json({ error: `Signup failed: ${e?.message || 'unknown error'}` })
  }
}

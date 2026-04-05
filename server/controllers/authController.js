import { hashPassword, comparePassword } from '../utils/crypto.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-me'
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

export const login = async (req, res) => {
  const { email, password } = req.body || {}
  const emailOk = typeof email === 'string' && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email)
  const passOk = typeof password === 'string' && password.length >= 6
  if (!emailOk || !passOk) return res.status(400).json({ error: 'Invalid credentials' })
  
  try {
    let user = await User.findOne({ email }).catch(() => null)
    const isEnvAdminLogin = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL
    
    // 1. If it's the ENV admin logging in, check against .env first!
    // This allows the user to login even if the DB has an outdated password hash.
    if (isEnvAdminLogin) {
      if (password === process.env.ADMIN_PASSWORD) {
        
        if (!user) {
           // Attempt to auto-create the admin in DB if missing
          try {
            const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD)
            user = await User.create({ 
              email: process.env.ADMIN_EMAIL, 
              name: process.env.ADMIN_NAME || 'Portal Admin', 
              role: 'admin', 
              passwordHash: hashedPassword 
            })
            console.log(`Created admin user '${email}' on login`)
          } catch (e) {
            console.warn('Could not auto-create admin user in DB, using stateless env session fallback')
          }
        } else {
           // Check if we need to update the hash because the .env password changed
           const ok = await comparePassword(password, user.passwordHash)
           if (!ok) {
             console.log(`Updating DB password hash for admin to match .env`)
             user.passwordHash = await hashPassword(process.env.ADMIN_PASSWORD)
             await user.save()
           }
        }
        
        const userPayload = { 
          id: user ? String(user._id) : 'admin-env', 
          email: process.env.ADMIN_EMAIL, 
          name: user ? user.name : (process.env.ADMIN_NAME || 'Portal Admin'), 
          role: 'admin' 
        }
        return res.json({ token: signToken(userPayload), user: userPayload })
      } else {
        // Only return 401 here if they specifically tried to login as the env admin
        // but used the WRONG .env password.
        return res.status(401).json({ error: 'Incorrect password' })
      }
    }
    
    // 2. Normal DB user login flow
    if (user) {
      const ok = await comparePassword(password, user.passwordHash)
      if (!ok) return res.status(401).json({ error: 'Incorrect password' })
      const userPayload = { id: String(user._id), email: user.email, name: user.name, role: user.role }
      return res.json({ token: signToken(userPayload), user: userPayload })
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

export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body || {}
  const emailOk = typeof email === 'string' && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email)
  const passOk = typeof password === 'string' && password.length >= 6
  const nameOk = typeof name === 'string' && name.trim().length >= 2
  
  if (!emailOk || !passOk || !nameOk) return res.status(400).json({ error: 'Invalid admin data' })
  
  try {
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    
    const hashedPassword = await hashPassword(password)
    const user = await User.create({ 
      email, 
      name, 
      role: 'admin', 
      passwordHash: hashedPassword 
    })
    
    return res.status(201).json({ id: String(user._id), email: user.email, name: user.name, role: user.role })
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    console.error('Admin signup error', e?.message || e)
    return res.status(500).json({ error: `Admin creation failed: ${e?.message || 'unknown error'}` })
  }
}

import User from '../models/User.js'
import Alumni from '../models/Alumni.js'
import Student from '../models/Student.js'

export const getProfile = async (req, res) => {
  const { email } = req.query || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' })

  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    let profile = { id: String(user._id), email: user.email, name: user.name, role: user.role }
    
    if (user.role === 'alumni') {
      const alumniDoc = await Alumni.findOne({ email })
      if (alumniDoc) {
        profile = { ...profile, ...alumniDoc.toObject(), id: String(alumniDoc._id || user._id) }
      }
    } else if (user.role === 'student') {
      const studentDoc = await Student.findOne({ email })
      if (studentDoc) {
        profile = { ...profile, ...studentDoc.toObject(), id: String(studentDoc._id || user._id) }
      }
    }
    res.json(profile)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

export const updateProfile = async (req, res) => {
  const { email, name, ...rest } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' })

  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    if (name) {
      user.name = name
      await user.save()
    }
    
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
      await Alumni.findOneAndUpdate(
        { email }, 
        alumniUpdate, 
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
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
      await Student.findOneAndUpdate(
        { email },
        studentUpdate,
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      )
    }
    res.json({ success: true })
  } catch (e) {
    console.error('Profile update failed', e)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

export const getUsers = async (req, res) => {
  try {
    const items = await User.find({}).select('email name role')
    const dbUsers = items.map(it => ({ id: String(it._id), email: it.email, name: it.name, role: it.role }))
    res.json(dbUsers)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list users' })
  }
}

export const getAlumni = async (req, res) => {
  try {
    const items = await Alumni.find({})
    const mapped = items.map(it => {
        const obj = it.toObject()
        const { _id, ...rest } = obj
        return { ...rest, id: String(_id) }
    })
    
    if (mapped.length) {
        res.json(mapped)
    } else {
        import('../../client/src/data/alumni.js').then(({ ALUMNI }) => res.json(ALUMNI)).catch(() => res.json([]))
    }
  } catch (e) {
    console.warn('⚠ Alumni DB query failed, using fallback data:', e.message)
    import('../../client/src/data/alumni.js').then(({ ALUMNI }) => res.json(ALUMNI)).catch(() => res.json([]))
  }
}


import Event from '../models/Event.js'
import { uploadToImageKit } from '../utils/imagekit.js'

// In-memory fallback
let eventsLocal = []
import('../../client/src/data/events.js').then(module => {
    eventsLocal = [...module.EVENTS]
}).catch(e => console.warn('Could not load local events data', e))

export const getEvents = async (req, res) => {
  try {
    const items = await Event.find({}).sort({ date: 1 })
    const mapped = items.map(it => {
        const obj = it.toObject()
        const { _id, ...rest } = obj
        return { ...rest, id: String(_id) }
    })
    res.json(mapped.length ? mapped : eventsLocal)
  } catch (e) {
    console.warn('⚠ Events DB query failed, using fallback data:', e.message)
    res.json(eventsLocal)
  }
}

export const createEvent = async (req, res) => {
  const { title, date, time, location, description } = req.body || {}
  const ok = typeof title === 'string' && title.trim().length > 0 && typeof date === 'string' && typeof location === 'string' && location.trim().length > 0
  if (!ok) return res.status(400).json({ error: 'Invalid event data (title/date/location required)' })

  let image = null
  if (req.file) {
    try {
      image = await uploadToImageKit(req.file.buffer, req.file.originalname, 'events')
    } catch (e) {
      console.error('ImageKit upload failed:', e)
    }
  }

  try {
    const doc = { title, date, time: time || '', location, description: description || '', ...(image && { image }) }
    const event = await Event.create(doc)
    return res.json({ ...event.toObject(), id: String(event._id) })
  } catch (e) {
    console.error('Create event error:', e)
    res.status(500).json({ error: `Failed to create event: ${e?.message || e}` })
  }
}

export const updateEvent = async (req, res) => {
  const id = req.params.id
  const { title, date, time, location, description } = req.body || {}

  let image = null
  if (req.file) {
    try {
      image = await uploadToImageKit(req.file.buffer, req.file.originalname, 'events')
    } catch (e) {
      console.error('ImageKit upload failed:', e)
    }
  }

  try {
    const updateDoc = { title, date, time, location, description }
    // Only overwrite image if a new one was uploaded; if 'removeImage' flag sent, clear it
    if (image) updateDoc.image = image
    if (req.body.removeImage === 'true') updateDoc.image = null

    const updated = await Event.findByIdAndUpdate(id, updateDoc, { new: true })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    const { _id, ...rest } = updated.toObject()
    return res.json({ ...rest, id: String(_id) })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update event' })
  }
}

export const deleteEvent = async (req, res) => {
  const id = req.params.id
  try {
    await Event.findByIdAndDelete(id)
    return res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete event' })
  }
}

export const toggleRSVP = async (req, res) => {
  const id = req.params.id
  const userId = req.user?.email || req.user?.id // Fallback to email if id not available
  if (!userId) return res.status(401).json({ error: 'Unauthorized: User identity not found' })

  try {
    const event = await Event.findById(id)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    // Initialize fields if they don't exist
    if (!event.registrants) event.registrants = []
    if (event.rsvpCount === undefined) event.rsvpCount = event.registrants.length

    const index = event.registrants.indexOf(userId)
    let isRegistered = false

    if (index === -1) {
      // Register
      event.registrants.push(userId)
      event.rsvpCount = (event.rsvpCount || 0) + 1
      isRegistered = true
    } else {
      // Unregister
      event.registrants.splice(index, 1)
      event.rsvpCount = Math.max(0, (event.rsvpCount || 0) - 1)
      isRegistered = false
    }

    await event.save()
    res.json({ rsvpCount: event.rsvpCount, isRegistered })
  } catch (e) {
    console.error('RSVP toggle error:', e)
    res.status(500).json({ error: 'Failed to toggle RSVP' })
  }
}

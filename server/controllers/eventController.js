import Event from '../models/Event.js'

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
  const { title, date, location, description } = req.body || {}
  const ok = typeof title === 'string' && title.trim().length > 0 && typeof date === 'string' && typeof location === 'string' && location.trim().length > 0
  if (!ok) return res.status(400).json({ error: 'Invalid event data (title/date/location required)' })
  
  try {
    const doc = { title, date, location, description: description || '' }
    const event = await Event.create(doc)
    return res.json({ ...event.toObject(), id: String(event._id) })
  } catch (e) {
    console.error('Create event error:', e)
    res.status(500).json({ error: `Failed to create event: ${e?.message || e}` })
  }
}

export const updateEvent = async (req, res) => {
  const id = req.params.id
  const { title, date, location, description } = req.body || {}
  try {
    const updated = await Event.findByIdAndUpdate(
        id, 
        { title, date, location, description },
        { new: true }
    )
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

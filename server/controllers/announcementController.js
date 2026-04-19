import Announcement from '../models/Announcement.js'

export const getAnnouncements = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    const list = await Announcement.find({ expiresAt: { $gte: today } }).sort({ createdAt: -1 })
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch announcements' })
  }
}

export const createAnnouncement = async (req, res) => {
  const { title, body, expiresAt } = req.body || {}
  if (!title || !body || !expiresAt) {
    return res.status(400).json({ error: 'Title, body, and expiration date are required' })
  }

  try {
    const created = await Announcement.create({ title, body, expiresAt })
    res.json(created)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create announcement' })
  }
}

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params
  try {
    await Announcement.findByIdAndDelete(id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete announcement' })
  }
}

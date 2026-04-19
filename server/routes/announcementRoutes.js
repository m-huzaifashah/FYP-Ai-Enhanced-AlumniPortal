import express from 'express'
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', getAnnouncements)
router.post('/', authenticate, requireAdmin, createAnnouncement)
router.delete('/:id', authenticate, requireAdmin, deleteAnnouncement)

export default router

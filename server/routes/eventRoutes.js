import express from 'express'
import { getEvents, createEvent, updateEvent, deleteEvent, toggleRSVP } from '../controllers/eventController.js'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'
import upload from '../utils/upload.js'

const router = express.Router()

router.get('/', getEvents)
router.post('/:id/rsvp', authenticate, toggleRSVP)
router.post('/', authenticate, requireAdmin, upload.single('image'), createEvent)
router.put('/:id', authenticate, requireAdmin, upload.single('image'), updateEvent)
router.delete('/:id', authenticate, requireAdmin, deleteEvent)

export default router

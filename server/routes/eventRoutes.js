import express from 'express'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', getEvents)
router.post('/', authenticate, requireAdmin, createEvent)
router.put('/:id', authenticate, requireAdmin, updateEvent)
router.delete('/:id', authenticate, requireAdmin, deleteEvent)

export default router

import express from 'express'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'
import { createTicket, getTickets, updateTicketStatus } from '../controllers/ticketController.js'

const router = express.Router()

router.post('/', authenticate, createTicket)
router.get('/', authenticate, getTickets)
router.put('/:id/status', authenticate, requireAdmin, updateTicketStatus)

export default router

import express from 'express'
import { login, signup, registerAdmin } from '../controllers/authController.js'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/admin', authenticate, requireAdmin, registerAdmin)

export default router

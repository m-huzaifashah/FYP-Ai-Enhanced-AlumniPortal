import express from 'express'
import { getProfile, updateProfile, getUsers, getAlumni, getMentors } from '../controllers/userController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate, updateProfile)
router.get('/users', getUsers)
router.get('/alumni', getAlumni)
router.get('/mentors', getMentors)

export default router

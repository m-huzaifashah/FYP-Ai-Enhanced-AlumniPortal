import express from 'express'
import { getProfile, updateProfile, getUsers, getAlumni, getMentors } from '../controllers/userController.js'

const router = express.Router()

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/users', getUsers)
router.get('/alumni', getAlumni)
router.get('/mentors', getMentors)

export default router

import express from 'express'
import { getRoles, getJobs, getJobById, createJob, updateJob, deleteJob, getJobsByRole, getJobsByRoleLevel } from '../controllers/jobController.js'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'
import upload from '../utils/upload.js'

const router = express.Router()

router.get('/', getJobs)
router.get('/roles', getRoles)
router.get('/by-role/:role', getJobsByRole)
router.get('/by-role-level', getJobsByRoleLevel)
router.get('/:id', getJobById)
router.post('/', authenticate, requireAdmin, upload.single('image'), createJob)
router.put('/:id', authenticate, requireAdmin, upload.single('image'), updateJob)
router.delete('/:id', authenticate, requireAdmin, deleteJob)

export default router

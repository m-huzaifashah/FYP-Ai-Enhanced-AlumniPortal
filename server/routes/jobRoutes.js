import express from 'express'
import { getRoles, getJobs, getJobById, createJob, updateJob, deleteJob, getJobsByRole, getJobsByRoleLevel } from '../controllers/jobController.js'

const router = express.Router()

router.get('/', getJobs)
router.get('/roles', getRoles)
router.get('/by-role/:role', getJobsByRole)
router.get('/by-role-level', getJobsByRoleLevel)
router.get('/:id', getJobById)
router.post('/', createJob)
router.put('/:id', updateJob)
router.delete('/:id', deleteJob)

export default router

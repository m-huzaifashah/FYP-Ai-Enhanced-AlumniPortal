import express from 'express'
import { getSkills, getSkillsByRole, getSkillsByRoleLevel } from '../controllers/skillController.js'

const router = express.Router()

router.get('/', getSkills)
router.get('/by-role/:role', getSkillsByRole)
router.get('/by-role-level', getSkillsByRoleLevel)

export default router

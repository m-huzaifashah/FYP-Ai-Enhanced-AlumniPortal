import { skillVocabulary, ROLE_SKILLS, jobsLocal } from '../controllers/jobController.js'
import { CORE_STACK_SKILLS } from '../../backend-core/constants/skillOntology.js'

export const getSkills = (req, res) => {
  res.json(skillVocabulary)
}

export const getSkillsByRole = (req, res) => {
  const role = req.params.role
  const skills = ROLE_SKILLS[role]

  if (!skills) {
    return res.status(404).json({ error: 'Role not found' })
  }

  res.json(skills)
}

export const getSkillsByRoleLevel = (req, res) => {
  const { role, level } = req.query

  if (!role || !level) {
    return res.status(400).json({ error: 'role and level required' })
  }

  if (!['intern', 'junior', 'senior'].includes(level)) {
    return res.status(400).json({ error: 'invalid level' })
  }

  const relevantJobs = jobsLocal.filter(
    job => job.role === role && job.level === level
  )

  if (!relevantJobs.length) {
    return res.json([])
  }

  const skillFrequency = {}

  relevantJobs.forEach(job => {
    job.skills.forEach(skill => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1
    })
  })

  const sortedSkills = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1]) // highest frequency first
    .map(([skill]) => skill)

  const LEVEL_SKILL_LIMITS = {
    intern: 8,
    junior: 12,
    senior: 25
  }

  const limit = LEVEL_SKILL_LIMITS[level]
  let datasetSkills = sortedSkills.slice(0, limit)

  if (datasetSkills.length > 1) {
    datasetSkills = datasetSkills.slice(0, datasetSkills.length - 1)
  }

  const coreSkills = CORE_STACK_SKILLS[role] || []
  const finalSkills = Array.from(
    new Set([...coreSkills, ...datasetSkills])
  )

  res.json(finalSkills)
}

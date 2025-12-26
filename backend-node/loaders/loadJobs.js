// backend-node/loaders/loadJobs.js

import { loadJobs } from '../../backend-core/utils/loadjobs'

// In-memory cache (single source of truth)
let JOBS = []
let SKILLS = []

/**
 * Load jobs + skills ONLY ONCE at server startup
 */
export async function loadJobsOnce() {
  // Prevent re-loading on hot reload / multiple imports
  if (JOBS.length > 0 && SKILLS.length > 0) return

  try {
    const data = await loadJobs()

    JOBS = data.jobs || []
    SKILLS = data.skillVocabulary || []

    console.log(`✅ Jobs loaded: ${JOBS.length}`)
    console.log(`✅ Skills loaded: ${SKILLS.length}`)
  } catch (err) {
    console.error('❌ Failed to load jobs CSV:', err.message || err)
    JOBS = []
    SKILLS = []
  }
}

/**
 * Get all jobs (read-only)
 */
export function getJobs() {
  return JOBS
}

/**
 * Get skill vocabulary (read-only)
 */
export function getSkills() {
  return SKILLS
}

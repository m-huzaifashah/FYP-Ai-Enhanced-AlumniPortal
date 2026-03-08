// ===============================
// JOB ROLE KEYWORDS
// ===============================
const ROLE_KEYWORDS = {
  backend: ["backend", "api", "server", "microservice"],
  frontend: ["frontend", "ui", "react", "angular", "vue"],
  fullstack: ["full stack", "fullstack"],
  data: ["data", "analytics"],
  ml: ["machine learning", "deep learning", "nlp", "computer vision"],
  devops: ["devops", "cloud", "aws", "docker", "kubernetes"],
  mobile: ["android", "ios", "flutter", "react native"],
  security: ["security", "cyber", "infosec"],
  qa: ["qa", "testing", "automation", "selenium"],
  blockchain: ["blockchain", "web3", "solidity"],
  enterprise: ["erp", "sap", "oracle"],
}

export function detectRole(title = '') {
  const t = title.toLowerCase()

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) {
      return role
    }
  }
  return 'other'
}

export function buildRoleSkillMap(jobs) {
  const roleSkills = {}

  for (const job of jobs) {
    if (!roleSkills[job.role]) {
      roleSkills[job.role] = new Set()
    }

    job.skills.forEach(skill => {
      roleSkills[job.role].add(skill)
    })
  }

  // Convert Set → Array
  const result = {}
  for (const role in roleSkills) {
    result[role] = Array.from(roleSkills[role]).sort()
  }

  return result
}

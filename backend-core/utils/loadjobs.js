import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// ===============================
// TECH SKILL ONTOLOGY (DATASET SIDE)
// ===============================
const TECH_SKILLS = new Set([


  // ===============================
  // Programming Languages (15)
  // ===============================
  "python", "java", "javascript", "typescript", "c", "c++", "c#",
  "go", "scala", "ruby", "php", "swift", "kotlin", "rust", "bash",

  // ===============================
  // Backend Frameworks (15)
  // ===============================
  "node.js", "node js", "express", "express.js",
  "fastapi", "flask", "django",
  "spring", "spring boot", "nestjs",
  "laravel", "rails", "koa", "hapi", "micronaut",

  // ===============================
  // Frontend Frameworks (15)
  // ===============================
  "react", "react.js", "angular", "vue", "vue.js",
  "next.js", "nuxt", "svelte",
  "redux", "tailwind", "bootstrap",
  "jquery", "webpack", "vite", "babel",

  // ===============================
  // Databases – SQL (10)
  // ===============================
  "sql", "postgresql", "mysql", "sqlite",
  "oracle", "mssql", "sql server",
  "cockroachdb", "mariadb", "snowflake",

  // ===============================
  // Databases – NoSQL (10)
  // ===============================
  "mongodb", "redis", "cassandra",
  "dynamodb", "firebase", "neo4j",
  "couchdb", "elasticsearch",
  "opensearch", "arangodb",

  // ===============================
  // APIs & Communication (10)
  // ===============================
  "rest api", "restful api", "graphql",
  "grpc", "websocket",
  "soap", "json", "xml",
  "openapi", "swagger",

  // ===============================
  // Authentication & Security (10)
  // ===============================
  "jwt", "oauth", "oauth2", "sso",
  "bcrypt", "argon2",
  "ssl", "tls",
  "keycloak", "auth0",

  // ===============================
  // DevOps & Containers (10)
  // ===============================
  "docker", "kubernetes", "helm",
  "terraform", "ansible",
  "jenkins", "github actions",
  "gitlab ci", "circleci", "argo cd",

  // ===============================
  // Cloud Platforms (10)
  // ===============================
  "aws", "azure", "gcp",
  "ec2", "s3", "lambda",
  "cloud functions",
  "cloud run", "eks", "aks",

  // ===============================
  // Data / ML (10)
  // ===============================
  "pandas", "numpy", "scikit-learn",
  "tensorflow", "pytorch",
  "keras", "xgboost",
  "lightgbm", "matplotlib", "seaborn",

  // ===============================
  // Messaging & Streaming (5)
  // ===============================
  "kafka", "rabbitmq", "activemq",
  "redis pubsub", "nats",

  // ===============================
  // Testing & QA (5)
  // ===============================
  "pytest", "jest", "mocha", "junit", "selenium",

  // ===============================
  // Version Control & Tools (5)
  // ===============================
  "git", "github", "gitlab", "bitbucket", "postman"
])



// ===============================
// NORMALIZATION (SAME AS ML BACKEND)
// ===============================
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}


// ===============================
// LOAD JOBS FROM CSV
// ===============================
export function loadJobs() {
  return new Promise((resolve, reject) => {
    const jobs = []
    const skillSet = new Set()

    const csvPath = path.join(__dirname, '../data/clean_postings2.csv')

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (!row.job_title || !row.job_skills) return

        // Handle cases like "['python', 'java']"
        const rawSkills = row.job_skills
          .replace(/[\[\]]/g, '')
          .split(',')

        // 🔒 STRICT FILTERING USING TECH_SKILLS
        const skills = rawSkills
          .map(s => normalize(s))
          .filter(s => TECH_SKILLS.has(s))

        if (!skills.length) return

        skills.forEach(s => skillSet.add(s))

        jobs.push({
          id: jobs.length + 1,
          title: row.job_title,
          skills
        })
      })
      .on('end', () => {
        resolve({
          jobs,
          skillVocabulary: Array.from(skillSet)
        })
      })
      .on('error', (err) => reject(err))
  })
}

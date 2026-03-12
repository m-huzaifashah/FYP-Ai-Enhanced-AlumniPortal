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

  // Programming Languages
  "python","java","javascript","typescript","c","c++","c#",
  "go","scala","ruby","php","swift","kotlin","rust","bash",

  // Backend Frameworks
  "node.js","node js","express","express.js",
  "fastapi","flask","django",
  "spring","spring boot","nestjs",
  "laravel","rails","koa","micronaut",

  // Frontend Frameworks
  "react","react.js","angular","vue","vue.js",
  "next.js","nuxt","svelte",
  "redux","tailwind","bootstrap",
  "jquery","webpack","vite","babel",

  // Databases (SQL)
  "sql","postgresql","mysql","sqlite",
  "oracle","mssql","sql server",
  "cockroachdb","mariadb","snowflake",

  // Databases (NoSQL)
  "mongodb","redis","cassandra",
  "dynamodb","firebase","neo4j",
  "couchdb","elasticsearch",
  "opensearch","arangodb",

  // APIs & Communication
  "rest api","restful api","graphql",
  "grpc","websocket",
  "soap","json","xml",
  "openapi","swagger",

  // Auth & Security
  "jwt","oauth","oauth2","sso",
  "ssl","tls","keycloak","auth0",

  // DevOps & Containers
  "docker","kubernetes","helm",
  "terraform","ansible",
  "jenkins","github actions",
  "gitlab ci","circleci","argo cd",

  // Cloud
  "aws","azure","gcp",
  "ec2","s3","lambda",
  "cloud functions","cloud run",
  "eks","aks",

  // Data / ML
  "pandas","numpy","scikit-learn",
  "tensorflow","pytorch",
  "keras","xgboost",
  "lightgbm","matplotlib","seaborn",

  // Messaging
  "kafka","rabbitmq","activemq","nats",

  // Testing
  "pytest","jest","mocha","junit","selenium",

  // Tools
  "git","github","gitlab","bitbucket","postman"
])


// ===============================
// NORMALIZATION (MATCHES ML BACKEND)
// ===============================
function normalize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}


// ===============================
// LOAD JOBS FROM CSV (FINAL)
// ===============================
export function loadJobs() {
  return new Promise((resolve, reject) => {
    const jobs = []
    const skillSet = new Set()

    const csvPath = path.join(__dirname, '../data/jobs_with_level.csv')

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Required fields
        if (!row.job_title || !row.job_skills || !row.level) return

        const level = row.level.toLowerCase()
        if (!['intern','junior','senior'].includes(level)) return

        // Handle "['python', 'java']"
        const rawSkills = row.job_skills
          .replace(/[\[\]]/g, '')
          .split(',')

        const skills = rawSkills
          .map(s => normalize(s))
          .filter(s => TECH_SKILLS.has(s))

        if (!skills.length) return

        skills.forEach(s => skillSet.add(s))

        jobs.push({
          id: jobs.length + 1,
          title: row.job_title,
          company: row.company || '',
          location: row.job_location || '',
          skills,
          level          // 🔥 intern / junior / senior
        })
      })
      .on('end', () => {
        resolve({
          jobs,
          skillVocabulary: Array.from(skillSet).sort()
        })
      })
      .on('error', (err) => reject(err))
  })
}

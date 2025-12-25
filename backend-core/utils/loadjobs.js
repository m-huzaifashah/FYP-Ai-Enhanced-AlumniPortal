import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function loadJobs() {
  return new Promise((resolve, reject) => {
    const jobs = []
    const skillSet = new Set()

    const csvPath = path.join(__dirname, '../data/clean_postings2.csv')

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (!row.job_title || !row.job_skills) return

        const skills = row.job_skills
          .toLowerCase()
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

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
      .on('error', (err) => {
        reject(err)
      })
  })
}

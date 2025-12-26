import { useState,useEffect } from 'react'

const ML_API = (import.meta as any).env.VITE_ML_API_URL
const API_BASE = 'http://localhost:3008/api'



type SkillGapResult = {
  matched_skills: string[]
  missing_skills: string[]
  raw_coverage_percent: number
  ml_match_percentage: number
  note?: string
}

export default function CareerSupport() {
  // ===============================
  // Skill Gap Analysis State
  // ===============================
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [selectedJobId] = useState<number>(1) // 🔧 later connect to real job selection
  const [result, setResult] = useState<SkillGapResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const [jobs, setJobs] = useState<any[]>([])
const [selectedJob, setSelectedJob] = useState<any>(null)

useEffect(() => {
  fetch(`${API_BASE}/jobs`)
    .then(res => res.json())
    .then(data => {
      console.log('ALL JOBS:', data)
      setJobs(data)
    })
    .catch(err => console.error('Job fetch failed', err))
}, [])


  // ===============================
  // HANDLE ANALYZE RESUME (PDF)
  // ===============================
  const handleAnalyzeResume = async () => {
    if (!resumeFile) {
      setError('Please upload a PDF resume')
      return
    }
    if (!selectedJob) {
      setError('Please select a job position')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('job_id', String(selectedJob.id))

      const res = await fetch(`${ML_API}/skill-gap/analyze-pdf`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        throw new Error('Skill gap analysis failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Failed to analyze resume. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* ====================================== */}
      {/* SKILL GAP ANALYSIS */}
      {/* ====================================== */}
      <div className="rounded-3xl bg-slate-50 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Skill Gap Analysis</h2>
        <p className="text-sm text-slate-600">
          Upload your resume to see how well it matches job requirements using AI.
        </p>

        {/* FILE INPUT & JOB SELECTION */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
             <label className="mb-1 block text-sm font-medium text-slate-700">Resume (PDF)</label>
             <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  setResumeFile(e.target.files?.[0] || null)
                  setError('')
                  setResult(null)
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              />
          </div>

          <div className="flex-1">
             <label className="mb-1 block text-sm font-medium text-slate-700">Target Job</label>
             <select
                value={selectedJob?.id || ''}
                onChange={(e) => {
                  const job = jobs.find(j => j.id === Number(e.target.value))
                  setSelectedJob(job)
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Job Position</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
          </div>

          <button
            onClick={handleAnalyzeResume}
            disabled={loading}
            className="mb-[1px] rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 space-y-4">
            <div className="flex gap-6 text-sm">
              <div>
                <strong>Raw Match:</strong> {result.raw_coverage_percent}%
              </div>
              <div>
                <strong>ML Suitability:</strong> {result.ml_match_percentage}%
              </div>
            </div>

            {result.note && (
              <div className="text-sm text-orange-600">
                {result.note}
              </div>
            )}

            <div>
              <h4 className="font-semibold text-sm text-green-700">Matched Skills</h4>
              <ul className="mt-1 list-disc ml-5 text-sm text-green-700">
                {result.matched_skills.map(skill => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-red-700">Missing Skills</h4>
              <ul className="mt-1 list-disc ml-5 text-sm text-red-600">
                {result.missing_skills.map(skill => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ====================================== */}
      {/* OTHER SECTIONS (UNCHANGED) */}
      {/* ====================================== */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Career Assessments</h2>
        <p className="text-sm text-slate-600">
          Take assessments to understand your strengths and career direction.
        </p>
        <button className="mt-4 rounded-full border px-4 py-2 text-sm">
          Take Assessment
        </button>
      </div>
    </div>
  )
}

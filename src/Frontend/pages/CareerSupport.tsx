import { useEffect, useState } from 'react'

const API_BASE =
  (import.meta as any).env?.VITE_CORE_API_URL ||
  'http://localhost:3008/api'

const ML_API =
  (import.meta as any).env?.VITE_ML_API_URL ||
  'http://127.0.0.1:8000'

type Job = {
  id: number
  title: string
}

export default function CareerSupport() {
  const [roles, setRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // ===============================
  // LOAD ROLES
  // ===============================
  useEffect(() => {
    fetch(`${API_BASE}/roles`)
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(() => setError('Failed to load roles'))
  }, [])

  // ===============================
  // LOAD JOBS BY ROLE
  // ===============================
  useEffect(() => {
    if (!selectedRole) return

    setJobs([])
    setSelectedJob(null)

    fetch(`${API_BASE}/jobs/by-role/${selectedRole}`)
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(() => setError('Failed to load jobs'))
  }, [selectedRole])

  // ===============================
  // ANALYZE RESUME
  // ===============================
  async function analyzeResume() {
    if (!resumeFile || !selectedJob) {
      setError('Please select job and upload resume')
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('job_id', String(selectedJob.id))

      const res = await fetch(`${ML_API}/skill-gap/analyze-pdf`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      setResult(data)
    } catch {
      setError('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Career Support & Skill Gap Analysis
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your resume to see how well you match with your target job role and identify areas for improvement.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8">
            
            {/* Step 1: Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  1. Select Job Role
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-[#0B4C72] focus:border-[#0B4C72] block p-3 pr-8 transition-colors"
                  >
                    <option value="">Select a Role...</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role.toUpperCase()}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  2. Select Target Job
                </label>
                <div className="relative">
                  <select
                    disabled={!jobs.length}
                    value={selectedJob?.id || ''}
                    onChange={e => {
                      const job = jobs.find(j => j.id === Number(e.target.value))
                      setSelectedJob(job || null)
                    }}
                    className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-[#0B4C72] focus:border-[#0B4C72] block p-3 pr-8 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <option value="">{jobs.length ? 'Select a Job...' : 'Select Role First'}</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                3. Upload Resume (PDF)
              </label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-[#0B4C72] transition-all group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-[#0B4C72] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  </div>
                  <div className="text-slate-600">
                    {resumeFile ? (
                      <span className="font-semibold text-[#0B4C72]">{resumeFile.name}</span>
                    ) : (
                      <>
                        <span className="font-medium text-[#0B4C72]">Click to upload</span> or drag and drop
                        <p className="text-xs text-slate-400 mt-1">PDF files only (max 5MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={analyzeResume}
              disabled={loading || !resumeFile || !selectedJob}
              className="w-full bg-[#0B4C72] text-white font-semibold py-3.5 rounded-xl shadow-lg hover:bg-[#093d5c] focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Profile...
                </div>
              ) : 'Analyze Skill Gap'}
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 animate-fade-in">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-8 space-y-6 animate-fade-in-up">
            
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Resume Match Score</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-[#0B4C72]">{result.raw_coverage_percent}%</span>
                  <span className="text-slate-400 mb-1">keyword match</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3">
                  <div className="bg-[#0B4C72] h-2.5 rounded-full transition-all duration-1000" style={{ width: `${result.raw_coverage_percent}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Suitability Score</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-emerald-600">{result.ml_match_percentage}%</span>
                  <span className="text-slate-400 mb-1">semantic match</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${result.ml_match_percentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                  <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="font-semibold text-emerald-900">Matched Skills</h3>
                </div>
                <div className="p-6">
                  {result.matched_skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.matched_skills.map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No exact skill matches found.</p>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <div className="bg-amber-50/50 px-6 py-4 border-b border-amber-100 flex items-center gap-2">
                  <div className="bg-amber-100 p-1.5 rounded-full text-amber-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <h3 className="font-semibold text-amber-900">Missing Skills</h3>
                </div>
                <div className="p-6">
                  {result.missing_skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.missing_skills.map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Great job! No missing critical skills found.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

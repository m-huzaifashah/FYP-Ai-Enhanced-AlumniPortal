import { useEffect, useState } from 'react'

const API_BASE =
  (import.meta as any).env?.VITE_CORE_API_URL ||
  'http://localhost:3008/api'

const ML_API =
  (import.meta as any).env?.VITE_ML_API_URL ||
  'http://127.0.0.1:8000'

const LEVELS = [
  { label: 'Intern', value: 'intern' },
  { label: 'Junior', value: 'junior' },
  { label: 'Senior', value: 'senior' }
]

export default function CareerSupport() {
  const [roles, setRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')

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
  // ANALYZE RESUME (ROLE + LEVEL)
  // ===============================
  async function analyzeResume() {
    if (!resumeFile || !selectedRole || !selectedLevel) {
      setError('Please select role, level and upload resume')
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('role', selectedRole)
      formData.append('level', selectedLevel)

      const res = await fetch(
        `${ML_API}/skill-gap/analyze-role-level`,
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data?.error || 'Analysis failed')

      setResult(data)
    } catch {
      setError('Skill gap analysis failed')
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
            Select your target role and level, then upload your resume to
            identify skill gaps.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8">

            {/* Step 1: Role + Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  1. Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3"
                >
                  <option value="">Select Role...</option>
                  {roles.map(r => (
                    <option key={r} value={r}>{r.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  2. Select Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3"
                >
                  <option value="">Select Level...</option>
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                3. Upload Resume (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setResumeFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Action */}
            <button
              onClick={analyzeResume}
              disabled={loading}
              className="w-full bg-[#0B4C72] text-white py-3 rounded-xl"
            >
              {loading ? 'Analyzing...' : 'Analyze Skill Gap'}
            </button>

            {error && (
              <p className="mt-4 text-red-600">{error}</p>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-semibold">Coverage</h3>
                <p className="text-3xl font-bold">
                  {result.raw_coverage_percent}%
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-semibold">AI Match</h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {result.ml_match_percentage}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-semibold mb-2">Matched Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(result.matched_skills || []).map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-semibold mb-2">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(result.missing_skills || []).map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium border border-amber-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

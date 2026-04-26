import { useEffect, useState } from 'react'
import { analyzeResume } from '../api'

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || '/api'
const ML_API_BASE =
  (import.meta as any).env?.VITE_ML_API_URL || 'http://127.0.0.1:8000'

const LEVELS = [
  { label: 'Intern', value: 'intern' },
  { label: 'Junior', value: 'junior' },
  { label: 'Senior', value: 'senior' },
]

// ─── Score utilities ────────────────────────────────────────
function gradeColor(grade: string) {
  if (grade === 'A') return 'text-emerald-400'
  if (grade === 'B') return 'text-blue-400'
  if (grade === 'C') return 'text-amber-400'
  if (grade === 'D') return 'text-orange-400'
  return 'text-red-400'
}
function severityBadge(s: string) {
  if (s === 'critical') return 'bg-red-500/20 text-red-300 border-red-500/30'
  if (s === 'major') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
}
function priorityBadge(p: string) {
  if (p === 'high') return 'bg-red-500/20 text-red-300'
  if (p === 'medium') return 'bg-amber-500/20 text-amber-300'
  return 'bg-emerald-500/20 text-emerald-300'
}
function ProgressBar({ value, label, weight }: { value: number; label: string; weight?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-primary">{label}</span>
        <span className="text-primary/70">{Math.round(value)}%{weight ? ` (${weight})` : ''}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-stone-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ─── Score Ring SVG ─────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 54, c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e7e5e4" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          className="transition-all duration-1000" />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-primary">{score}</span>
        <span className={`text-lg font-bold ${gradeColor(grade)}`}>{grade}</span>
      </div>
    </div>
  )
}

export default function CareerSupport() {
  const [tab, setTab] = useState<'skillgap' | 'ats'>('skillgap')

  // ─── Skill Gap state (preserved) ─────────────────────────
  const [roles, setRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [sgFile, setSgFile] = useState<File | null>(null)
  const [sgLoading, setSgLoading] = useState(false)
  const [sgResult, setSgResult] = useState<any>(null)
  const [sgError, setSgError] = useState<string | null>(null)

  // ─── ATS Analyzer state ──────────────────────────────────
  const [atsFile, setAtsFile] = useState<File | null>(null)
  const [atsJD, setAtsJD] = useState('')
  const [atsLoading, setAtsLoading] = useState(false)
  const [atsResult, setAtsResult] = useState<any>(null)
  const [atsError, setAtsError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/roles`)
      .then(r => r.json())
      .then(d => setRoles(d))
      .catch(() => setSgError('Failed to load roles'))
  }, [])

  // ─── Skill Gap handler (unchanged) ──────────────────────
  async function analyzeSkillGap() {
    if (!sgFile || !selectedRole || !selectedLevel) {
      setSgError('Please select role, level and upload resume'); return
    }
    setSgError(null); setSgLoading(true); setSgResult(null)
    try {
      const fd = new FormData()
      fd.append('resume', sgFile); fd.append('role', selectedRole); fd.append('level', selectedLevel)
      const res = await fetch(`${ML_API_BASE}/skill-gap/analyze-role-level`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data?.error || 'Analysis failed')
      setSgResult(data)
    } catch { setSgError('Skill gap analysis failed') }
    finally { setSgLoading(false) }
  }

  // ─── ATS handler ────────────────────────────────────────
  async function handleAtsAnalyze() {
    if (!atsFile) { setAtsError('Please upload a resume'); return }
    if (!atsJD.trim()) { setAtsError('Please enter a job description'); return }
    setAtsError(null); setAtsLoading(true); setAtsResult(null)
    try {
      const data = await analyzeResume(atsFile, atsJD)
      setAtsResult(data)
    } catch (e: any) { setAtsError(e?.message || 'ATS analysis failed') }
    finally { setAtsLoading(false) }
  }

  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-light-section py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Career Support</h1>
          <p className="mt-2 text-primary/70 max-w-2xl mx-auto">
            AI-powered tools to optimize your resume and identify skill gaps
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['skillgap', 'ats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white text-primary ring-1 ring-secondary hover:bg-stone-50'}`}>
              {t === 'skillgap' ? '🎯 Skill Gap Analysis' : '📄 ATS Resume Analyzer'}
            </button>
          ))}
        </div>

        {/* ═══ TAB 1 — SKILL GAP (preserved) ═══ */}
        {tab === 'skillgap' && (
          <>
            <div className="bg-white rounded-2xl shadow-xl border border-secondary overflow-hidden">
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">1. Select Role</label>
                    <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                      className="w-full bg-light-section border border-secondary rounded-lg p-3">
                      <option value="">Select Role...</option>
                      {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">2. Select Level</label>
                    <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}
                      className="w-full bg-light-section border border-secondary rounded-lg p-3">
                      <option value="">Select Level...</option>
                      {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-primary mb-2">3. Upload Resume (PDF)</label>
                  <input type="file" accept=".pdf" onChange={e => setSgFile(e.target.files?.[0] || null)} />
                </div>
                <button onClick={analyzeSkillGap} disabled={sgLoading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold">
                  {sgLoading ? 'Analyzing...' : 'Analyze Skill Gap'}
                </button>
                {sgError && <p className="mt-4 text-accent">{sgError}</p>}
              </div>
            </div>

            {sgResult && (
              <div className="mt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow ring-1 ring-secondary">
                    <h3 className="font-semibold text-primary">AI Match</h3>
                    <p className="text-3xl font-bold text-emerald-600">{sgResult.ml_match_percentage}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow ring-1 ring-secondary">
                    <h3 className="font-semibold mb-2 text-primary">Matched Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(sgResult.matched_skills || []).map((s: string) => (
                        <span key={s} className="px-2 py-1 bg-secondary text-primary rounded-md text-sm font-medium border border-green-200">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow ring-1 ring-secondary">
                    <h3 className="font-semibold mb-2 text-primary">Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(sgResult.missing_skills || []).map((s: string) => (
                        <span key={s} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium border border-amber-200">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ TAB 2 — ATS RESUME ANALYZER ═══ */}
        {tab === 'ats' && (
          <>
            {/* Input Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-secondary overflow-hidden">
              <div className="p-8">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-primary mb-2">1. Upload Resume (PDF / DOCX)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-light-section border border-secondary hover:bg-stone-100 transition text-sm font-medium text-primary">
                      <span>📎</span>
                      <span>{atsFile ? atsFile.name : 'Choose file...'}</span>
                      <input type="file" accept=".pdf,.docx,.doc" className="hidden"
                        onChange={e => setAtsFile(e.target.files?.[0] || null)} />
                    </label>
                    {atsFile && (
                      <span className="text-xs text-primary/50">{(atsFile.size / 1024).toFixed(0)} KB</span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-primary mb-2">2. Paste Job Description</label>
                  <textarea value={atsJD} onChange={e => setAtsJD(e.target.value)} rows={6}
                    placeholder="Paste the full job description here..."
                    className="w-full bg-light-section border border-secondary rounded-xl p-4 text-sm text-primary resize-y" />
                </div>

                <button onClick={handleAtsAnalyze} disabled={atsLoading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50">
                  {atsLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      Analyzing...
                    </span>
                  ) : 'Analyze Resume'}
                </button>
                {atsError && <p className="mt-4 text-red-500 text-sm font-medium">{atsError}</p>}
              </div>
            </div>

            {/* ─── Results ─── */}
            {atsResult && (
              <div className="mt-8 space-y-6">

                {/* Row 1: Score Hero + Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Score Hero */}
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-8 text-center">
                    <ScoreRing score={atsResult.ats_score} grade={atsResult.grade} />
                    <p className="mt-4 text-sm font-semibold text-primary">{atsResult.score_label}</p>
                    {atsResult.xgb_detail && (
                      <div className="mt-3 flex justify-center gap-3 text-xs">
                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          {atsResult.xgb_detail.model_used === 'blended' ? '🤖 XGBoost + SBERT' : '🧠 SBERT Only'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                          Confidence: {atsResult.xgb_detail.confidence}
                        </span>
                      </div>
                    )}
                    {atsResult.score_potential > atsResult.ats_score && (
                      <p className="mt-3 text-xs text-primary/60">
                        Potential score with quick fixes: <span className="font-bold text-emerald-600">{atsResult.score_potential}</span>
                      </p>
                    )}
                  </div>

                  {/* Breakdown Bars */}
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-8">
                    <h3 className="font-bold text-primary mb-5">Score Breakdown</h3>
                    <div className="space-y-4">
                      <ProgressBar value={atsResult.breakdown.semantic_score} label="Semantic Match" weight="45%" />
                      <ProgressBar value={atsResult.breakdown.keyword_score} label="Keyword Coverage" weight="25%" />
                      <ProgressBar value={atsResult.breakdown.formatting_score} label="Formatting" weight="15%" />
                      <ProgressBar value={atsResult.breakdown.section_score} label="Section Completeness" weight="15%" />
                    </div>
                  </div>
                </div>

                {/* Row 2: XGBoost Detail */}
                {atsResult.xgb_detail?.explanations?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6">
                    <h3 className="font-bold text-primary mb-4">🧠 AI Score Drivers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {atsResult.xgb_detail.explanations.map((e: any, i: number) => (
                        <div key={i} className={`flex items-center gap-3 rounded-xl p-3 ${e.direction === 'positive' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-red-50 ring-1 ring-red-200'}`}>
                          <span className="text-lg">{e.direction === 'positive' ? '✅' : '⚠️'}</span>
                          <div>
                            <p className={`text-sm font-medium ${e.direction === 'positive' ? 'text-emerald-800' : 'text-red-800'}`}>{e.driver}</p>
                            {e.value != null && <p className="text-xs text-primary/50">Value: {e.value}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {atsResult.xgb_detail.model_used === 'blended' && (
                      <div className="mt-4 flex gap-4 text-xs text-primary/60">
                        <span>SBERT: {atsResult.xgb_detail.sbert_score}</span>
                        <span>XGBoost: {atsResult.xgb_detail.xgb_score}</span>
                        <span>Weights: {atsResult.xgb_detail.blend_weights.sbert * 100}% / {atsResult.xgb_detail.blend_weights.xgb * 100}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Row 3: Skills */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6">
                    <h3 className="font-bold text-primary mb-1">✅ Matched</h3>
                    <p className="text-xs text-primary/50 mb-3">{atsResult.skills?.matched_skills?.length || 0} of {atsResult.skills?.jd_required?.length || 0} required skills found</p>
                    <div className="flex flex-wrap gap-2">
                      {(atsResult.skills?.matched_skills || []).map((s: string) => (
                        <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium ring-1 ring-emerald-200">{s}</span>
                      ))}
                      {!(atsResult.skills?.matched_skills?.length) && <p className="text-sm text-primary/40">None found</p>}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6">
                    <h3 className="font-bold text-primary mb-1">❌ Missing</h3>
                    <p className="text-xs text-primary/50 mb-3">Add these to improve your score</p>
                    <div className="flex flex-wrap gap-2">
                      {(atsResult.skills?.missing_skills || []).map((s: string) => (
                        <span key={s} className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium ring-1 ring-amber-200">{s}</span>
                      ))}
                      {!(atsResult.skills?.missing_skills?.length) && <p className="text-sm text-emerald-600 font-medium">All required skills found! 🎉</p>}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6">
                    <h3 className="font-bold text-primary mb-1">🌟 Extra Skills</h3>
                    <p className="text-xs text-primary/50 mb-3">Skills on resume not required by JD</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const resumeSkills = atsResult.skills?.resume_skills || [];
                        const matchedSkills = atsResult.skills?.matched_skills || [];
                        const preferredSkills = atsResult.skills?.jd_preferred || [];
                        const extraSkills = resumeSkills.filter((s: string) => !matchedSkills.includes(s) && !preferredSkills.includes(s));
                        return extraSkills.length > 0 ? extraSkills.map((s: string) => (
                          <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium ring-1 ring-blue-200">{s}</span>
                        )) : <p className="text-sm text-primary/40">None found</p>;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Row 4: Profile + Formatting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile */}
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6">
                    <h3 className="font-bold text-primary mb-4">👤 Extracted Profile</h3>
                    <div className="space-y-3 text-sm">
                      {atsResult.profile?.degrees?.length > 0 && (
                        <div><span className="font-medium text-primary/70">Degrees:</span>{' '}
                          {atsResult.profile.degrees.map((d: any, i: number) => (
                            <span key={i} className="inline-block mr-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded ring-1 ring-blue-200 text-xs">{d.degree} — {d.field}</span>
                          ))}
                        </div>
                      )}
                      {atsResult.profile?.organizations?.length > 0 && (
                        <div><span className="font-medium text-primary/70">Organizations:</span> {atsResult.profile.organizations.join(', ')}</div>
                      )}
                      {atsResult.profile?.years_experience != null && (
                        <div><span className="font-medium text-primary/70">Experience:</span> {atsResult.profile.years_experience} years</div>
                      )}
                      {atsResult.profile?.gpa && (
                        <div><span className="font-medium text-primary/70">GPA:</span> {atsResult.profile.gpa.score}/{atsResult.profile.gpa.out_of}</div>
                      )}
                      <div><span className="font-medium text-primary/70">Word Count:</span> {atsResult.profile?.word_count}</div>
                      <div><span className="font-medium text-primary/70">Contact Info:</span> {atsResult.profile?.has_contact_info ? '✅ Found' : '❌ Not found'}</div>
                    </div>
                  </div>

                  {/* Formatting */}
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-primary">📋 Formatting</h3>
                      <span className="text-sm font-bold text-primary">{atsResult.formatting?.score}/100</span>
                    </div>
                    {atsResult.formatting?.issues?.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {atsResult.formatting.issues.map((iss: any, i: number) => (
                          <div key={i} className="rounded-xl bg-light-section p-3 ring-1 ring-secondary">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${severityBadge(iss.severity)}`}>{iss.severity}</span>
                              <span className="text-xs text-red-500 font-medium">-{iss.penalty} pts</span>
                            </div>
                            <p className="text-sm text-primary font-medium">{iss.issue}</p>
                            <p className="text-xs text-primary/60 mt-1">💡 {iss.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-emerald-600 font-medium">No formatting issues found! ✨</p>
                    )}
                  </div>
                </div>

                {/* Row 5: Suggestions */}
                {atsResult.suggestions?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6">
                    <h3 className="font-bold text-primary mb-4">💡 Improvement Suggestions</h3>
                    <div className="space-y-3">
                      {atsResult.suggestions.map((s: any, i: number) => (
                        <div key={i} className="rounded-xl bg-light-section p-4 ring-1 ring-secondary">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityBadge(s.priority)}`}>{s.priority}</span>
                            <span className="text-xs text-primary/50">{s.category}</span>
                          </div>
                          <p className="text-sm font-semibold text-primary">{s.title}</p>
                          {s.detail && <p className="text-xs text-primary/70 mt-1">{s.detail}</p>}
                          {s.example && <pre className="mt-2 text-xs bg-white p-2 rounded-lg ring-1 ring-secondary text-primary/80 whitespace-pre-wrap">{s.example}</pre>}
                          {s.impact && <p className="text-xs text-emerald-600 mt-1 font-medium">📈 {s.impact}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Row 6: Quick Wins */}
                {atsResult.quick_wins?.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl shadow-lg ring-1 ring-emerald-200 p-6">
                    <h3 className="font-bold text-emerald-800 mb-3">⚡ Quick Wins</h3>
                    <ul className="space-y-2">
                      {atsResult.quick_wins.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                          <span className="mt-0.5">✦</span><span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Row 7: Radar Chart */}
                {atsResult.radar_chart_b64 && (
                  <div className="bg-white rounded-2xl shadow-lg ring-1 ring-secondary p-6 text-center">
                    <h3 className="font-bold text-primary mb-4">📊 Skill Gap Radar</h3>
                    <img src={`data:image/png;base64,${atsResult.radar_chart_b64}`} alt="Skill gap radar chart"
                      className="mx-auto max-w-md w-full rounded-xl" />
                  </div>
                )}

                {/* Warnings */}
                {atsResult.warnings?.length > 0 && (
                  <div className="bg-amber-50 rounded-2xl ring-1 ring-amber-200 p-6">
                    <h3 className="font-bold text-amber-800 mb-3">⚠️ Warnings</h3>
                    <ul className="space-y-1">
                      {atsResult.warnings.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-amber-800">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

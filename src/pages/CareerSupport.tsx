import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Modal } from '../ui'

type Job = { id: number | string; title: string; company: string; location: string }
type Internship = { id: number; title: string; company: string; location: string }

export default function CareerSupport({ jobs, internships }: { jobs: Job[]; internships: Internship[] }) {
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyItem, setApplyItem] = useState<{ type: 'job' | 'internship'; id: number | string; title: string } | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [resumeMsg, setResumeMsg] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [sgFile, setSgFile] = useState<File | null>(null)
  const [sgError, setSgError] = useState('')
  const [sgData, setSgData] = useState<{ comm: number; tech: number; tools: number; domain: number; gap: number } | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<{ type: 'job' | 'internship'; id: number | string; title: string; company: string; location: string } | null>(null)
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachName, setCoachName] = useState('')
  const [coachEmail, setCoachEmail] = useState('')
  const [coachMsg, setCoachMsg] = useState('')
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const [q, setQ] = useState('')
  const [loc, setLoc] = useState('All')
  const [kind, setKind] = useState<'All' | 'Jobs' | 'Internships'>('All')

  const openApply = (type: 'job' | 'internship', id: number | string, title: string) => { setApplyItem({ type, id, title }); setApplyOpen(true) }
  const openDetails = (type: 'job' | 'internship', id: number | string, title: string, company: string, location: string) => { setDetailItem({ type, id, title, company, location }); setDetailOpen(true) }

  const locations = useMemo(() => ['All', ...Array.from(new Set([...jobs.map(j=>j.location), ...internships.map(i=>i.location)]))], [jobs, internships])
  const filteredJobs = useMemo(() => {
    let rows = jobs
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      rows = rows.filter(j => j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s) || j.location.toLowerCase().includes(s))
    }
    if (loc !== 'All') rows = rows.filter(j => j.location === loc)
    return rows
  }, [jobs, q, loc])
  const filteredInterns = useMemo(() => {
    let rows = internships
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      rows = rows.filter(i => i.title.toLowerCase().includes(s) || i.company.toLowerCase().includes(s) || i.location.toLowerCase().includes(s))
    }
    if (loc !== 'All') rows = rows.filter(i => i.location === loc)
    return rows
  }, [internships, q, loc])
  const featuredJobs = useMemo(() => (kind === 'All' || kind === 'Jobs') ? filteredJobs.slice(0, 6) : [], [filteredJobs, kind])
  const featuredInterns = useMemo(() => (kind === 'All' || kind === 'Internships') ? filteredInterns.slice(0, 6) : [], [filteredInterns, kind])

  return (
    <section className="space-y-8">
      <div className="text-center">
        <div className="text-3xl font-bold">Student Career Support</div>
        <div className="mt-2 text-slate-600">Practical pathways for internships, jobs, and skill growth with trusted guidance.</div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_160px] items-center">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search jobs or internships" />
          <select value={loc} onChange={e=>setLoc(e.target.value)} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={kind} onChange={e=>setKind(e.target.value as any)} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
            {(['All','Jobs','Internships'] as const).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Internships</div>
            <Button variant="outline">See All</Button>
          </div>
          <ul className="mt-4 space-y-3">
            {featuredInterns.map(i => (
              <li key={i.id} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{i.title}</div>
                  <div className="text-sm text-slate-600">{i.company} • {i.location}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => openDetails('internship', i.id, i.title, i.company, i.location)}>Details</Button>
                  <Button variant="primary" onClick={() => openApply('internship', i.id, i.title)}>Apply</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Job Board</div>
            <Button variant="outline">See All</Button>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {featuredJobs.map(j => (
              <li key={j.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                <div className="font-semibold">{j.title}</div>
                <div className="text-sm text-slate-600">{j.company}</div>
                <div className="text-xs text-slate-500">{j.location}</div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" onClick={() => openDetails('job', j.id, j.title, j.company, j.location)} className="flex-1">Details</Button>
                  <Button variant="primary" onClick={() => openApply('job', j.id, j.title)} className="flex-1">Apply</Button>
                  <Button variant="subtle" onClick={() => setSaved(prev => ({ ...prev, ['job-'+j.id]: !prev['job-'+j.id] }))}>{saved['job-'+j.id] ? 'Saved' : 'Save'}</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="text-xl font-semibold">Resume Review</div>
          <div className="mt-2 text-sm text-slate-600">Upload your resume for a quick quality check and tailored tips.</div>
          <div className="mt-4 flex items-center gap-3">
            <input type="file" onChange={e => setResume(e.target.files?.[0] || null)} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200" />
            <Button variant="primary" onClick={() => {
              if (!resume) { setResumeMsg('Attach a resume file to continue'); return }
              setResumeMsg('Resume received. Our team will review and follow up via email.')
            }}>Upload for Review</Button>
            <Button variant="outline" onClick={() => setCoachOpen(true)}>Request Coach</Button>
          </div>
          {resumeMsg && <div className="mt-3 text-sm text-slate-700">{resumeMsg}</div>}
        </Card>

        <Card className="p-6">
          <div className="text-xl font-semibold">Skill Gap Analysis</div>
          <div className="mt-2 text-sm text-slate-600">See where you stand and what to learn next. Personalized insights coming soon.</div>
          <div className="mt-4 flex items-center gap-3">
            <input type="file" accept=".txt,text/plain" onChange={e => { setSgFile(e.target.files?.[0] || null); setSgError('') }} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200" />
            <Button variant="primary" onClick={() => {
              if (!sgFile) { setSgError('Attach a .txt resume to analyze'); return }
              if (!(sgFile.type.startsWith('text') || sgFile.name.toLowerCase().endsWith('.txt'))) { setSgError('Upload a .txt file'); return }
              const r = new FileReader()
              r.onload = () => {
                const text = String(r.result || '')
                const t = text.toLowerCase()
                const dict = {
                  comm: ['communication','presentation','writing','collaboration','leadership','team','stakeholder'],
                  tech: ['algorithm','data structure','database','api','backend','frontend','cloud','security','ml','python','java','typescript','react','node','sql'],
                  tools: ['git','jira','confluence','docker','kubernetes','aws','azure','gcp','figma','excel','powerpoint'],
                  domain: ['finance','health','education','manufacturing','marketing','research','statistics','regulation']
                }
                const score = (arr: string[]) => {
                  const hits = new Set<string>()
                  arr.forEach(k => { if (t.includes(k)) hits.add(k) })
                  return Math.round((hits.size / arr.length) * 100)
                }
                const comm = score(dict.comm)
                const tech = score(dict.tech)
                const tools = score(dict.tools)
                const domain = score(dict.domain)
                const gap = Math.max(0, 100 - Math.round((comm + tech + tools + domain) / 4))
                setSgData({ comm, tech, tools, domain, gap })
                setSgError('')
              }
              r.readAsText(sgFile)
            }}>Analyze Resume</Button>
          </div>
          {sgError && <div className="mt-2 text-sm text-slate-700">{sgError}</div>}
          <div className="mt-4 rounded-2xl bg-white ring-1 ring-slate-200 p-4">
            <div className="grid grid-cols-4 gap-3 h-32">
              {[(sgData?.comm ?? 40),(sgData?.tech ?? 70),(sgData?.tools ?? 55),(sgData?.domain ?? 30)].map((h,i)=> (
                <div key={i} className="relative">
                  <div className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 text-center text-xs text-slate-600">
              {['Comm','Tech','Tools','Domain'].map((t,i)=> (<div key={i}>{t}</div>))}
            </div>
          </div>
          {sgData && (
            <div className="mt-3 text-sm text-slate-700">Gap Score: {sgData.gap}</div>
          )}
          <div className="mt-3">
            <Button variant="outline">Take Assessment</Button>
          </div>
        </Card>
      </div>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={applyItem ? `Apply: ${applyItem.title}` : 'Apply'}>
        <div className="space-y-3">
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" />
          <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Back</Button>
            <Button variant="primary" onClick={() => {
              const ok = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email) && name.trim().length >= 2
              if (!ok) return
              setApplyOpen(false)
              setName('')
              setEmail('')
            }}>Submit Application</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailOpen && !!detailItem} onClose={() => setDetailOpen(false)} title={detailItem ? `${detailItem.title}` : 'Details'}>
        {detailItem && (
          <div className="space-y-3">
            <div className="text-sm text-slate-300">{detailItem.company} • {detailItem.location}</div>
            <div className="rounded-md bg-white/5 ring-1 ring-slate-800 p-3 text-sm text-slate-100">Opportunity details will be available soon. You can apply now or save for later.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>Back</Button>
              <Button variant="primary" onClick={() => { setDetailOpen(false); openApply(detailItem.type, detailItem.id, detailItem.title) }}>Apply</Button>
              <Button variant="subtle" onClick={() => setSaved(prev => ({ ...prev, [detailItem.type+'-'+detailItem.id]: !prev[detailItem.type+'-'+detailItem.id] }))}>{saved[detailItem.type+'-'+detailItem.id] ? 'Saved' : 'Save'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={coachOpen} onClose={() => setCoachOpen(false)} title="Request Career Coach">
        <div className="space-y-3">
          <Input value={coachName} onChange={e=>setCoachName(e.target.value)} placeholder="Full Name" />
          <Input value={coachEmail} onChange={e=>setCoachEmail(e.target.value)} placeholder="Email" />
          <Input value={coachMsg} onChange={e=>setCoachMsg(e.target.value)} placeholder="What do you need help with?" />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCoachOpen(false)}>Back</Button>
            <Button variant="primary" onClick={() => {
              const ok = coachName.trim().length >= 2 && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(coachEmail) && coachMsg.trim().length >= 6
              if (!ok) return
              setCoachOpen(false)
              setCoachName('')
              setCoachEmail('')
              setCoachMsg('')
            }}>Send Request</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

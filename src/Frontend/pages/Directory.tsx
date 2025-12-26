import React, { useMemo, useState } from 'react'
import { Button, Input, Card, Modal } from '../../ui'

type Alumni = { id: number; name: string; batch: number; department: string; location: string; role: string; company: string; email?: string }

export default function Directory({ alumni, query, onQueryChange }: { alumni: Alumni[]; query: string; onQueryChange: (v: string) => void }) {
  const [dept, setDept] = useState('All')
  const [batch, setBatch] = useState('All')
  const [skill, setSkill] = useState('')
  const [page, setPage] = useState(1)
  const [selectedProfile, setSelectedProfile] = useState<Alumni | null>(null)
  const pageSize = 12

  const departments = useMemo(() => ['All', ...Array.from(new Set(alumni.map(a => a.department)))], [alumni])
  const batches = useMemo(() => ['All', ...Array.from(new Set(alumni.map(a => String(a.batch))))], [alumni])

  const filtered = useMemo(() => {
    let rows = alumni
    if (dept !== 'All') rows = rows.filter(a => a.department === dept)
    if (batch !== 'All') rows = rows.filter(a => String(a.batch) === batch)
    if (skill.trim()) {
      const s = skill.trim().toLowerCase()
      rows = rows.filter(a => a.role.toLowerCase().includes(s) || a.department.toLowerCase().includes(s))
    }
    return rows
  }, [alumni, dept, batch, skill])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const start = (page - 1) * pageSize
  const pageRows = filtered.slice(start, start + pageSize)

  const resetPage = () => setPage(1)

  return (
    <section className="space-y-6">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_160px_1fr] items-center">
          <Input value={query} onChange={e => { onQueryChange(e.target.value); resetPage() }} placeholder="Search by name, department, company, location" />
          <select value={dept} onChange={e => { setDept(e.target.value); resetPage() }} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={batch} onChange={e => { setBatch(e.target.value); resetPage() }} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <Input value={skill} onChange={e => { setSkill(e.target.value); resetPage() }} placeholder="Filter by skill or title" />
        </div>
      </Card>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageRows.map(a => (
          <li key={a.id}>
            <Card className="p-5 group relative overflow-hidden transition-all hover:shadow-md border-slate-200">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full bg-[#1669bb] text-white grid place-items-center text-lg font-bold shadow-sm ring-4 ring-slate-50">
                  {a.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-lg font-bold text-slate-900 truncate">{a.name}</div>
                      <div className="text-sm font-medium text-[#1669bb] truncate">{a.role}</div>
                      <div className="text-sm text-slate-500 truncate">{a.company}</div>
                    </div>
                    <Button variant="outline"  className="shrink-0 border-slate-200 text-slate-600 hover:text-[#1669bb] hover:border-[#1669bb]">
                      Contact
                    </Button>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      {a.department}
                    </span>
                    <span>•</span>
                    <span>{a.batch}</span>
                    <span>•</span>
                    <span>{a.location}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[a.department, a.role.split(' ')[0]].map((t,i)=> (
                      <span key={i} className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] transition-all duration-300">
                <Button variant="primary" onClick={() => setSelectedProfile(a)} className="shadow-xl transform hover:scale-105">View Profile</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Modal open={!!selectedProfile} onClose={() => setSelectedProfile(null)} title="Alumni Profile">
        {selectedProfile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-[#1669bb] text-white grid place-items-center text-2xl font-bold shadow-md ring-4 ring-slate-50">
                {selectedProfile.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{selectedProfile.name}</div>
                <div className="text-[#1669bb] font-medium">{selectedProfile.role}</div>
                <div className="text-slate-600">{selectedProfile.company}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Department</div>
                <div className="font-medium text-slate-900">{selectedProfile.department}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Batch</div>
                <div className="font-medium text-slate-900">{selectedProfile.batch}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Location</div>
                <div className="font-medium text-slate-900">{selectedProfile.location}</div>
              </div>
              {selectedProfile.email && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Email</div>
                  <div className="font-medium text-slate-900 truncate" title={selectedProfile.email}>{selectedProfile.email}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedProfile(null)}>Close</Button>
              <Button variant="primary">Connect</Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Page {page} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page-3), Math.max(0, page-3)+5).map(p => (
            <button key={p} onClick={() => setPage(p)} className={(p===page ? 'bg-slate-100 ring-1 ring-slate-200' : 'bg-white') + ' rounded-full px-3 py-1 text-sm text-slate-700 shadow-sm'}>{p}</button>
          ))}
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</Button>
        </div>
      </div>
    </section>
  )
}

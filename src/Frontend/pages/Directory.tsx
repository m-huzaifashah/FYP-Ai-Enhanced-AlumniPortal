import React, { useMemo, useState } from 'react'
import { Button, Input, Card } from '../../ui'

type Alumni = { id: number; name: string; batch: number; department: string; location: string; role: string; company: string }

export default function Directory({ alumni, query, onQueryChange }: { alumni: Alumni[]; query: string; onQueryChange: (v: string) => void }) {
  const [dept, setDept] = useState('All')
  const [batch, setBatch] = useState('All')
  const [skill, setSkill] = useState('')
  const [page, setPage] = useState(1)
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
            <Card className="p-4 group relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 grid place-items-center text-white text-sm font-semibold">
                  {a.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold">{a.name}</div>
                  <div className="text-sm text-slate-600">{a.role} • {a.company}</div>
                  <div className="text-xs text-slate-500">{a.department} • {a.batch} • {a.location}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[a.department, a.role.split(' ')[0]].map((t,i)=> (
                      <span key={i} className="rounded-full bg-white px-2 py-1 text-xs ring-1 ring-slate-200 text-slate-700 shadow-sm">{t}</span>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="whitespace-nowrap">Contact</Button>
              </div>
              <div className="absolute inset-0 hidden group-hover:grid place-items-center bg-black/5">
                <Button variant="primary" className="">View Profile</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

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

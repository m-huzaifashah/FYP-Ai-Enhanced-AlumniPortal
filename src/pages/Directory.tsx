import React from 'react'

type Alumni = { id: number; name: string; batch: number; department: string; location: string; role: string; company: string }

export default function Directory({ alumni, query, onQueryChange }: { alumni: Alumni[]; query: string; onQueryChange: (v: string) => void }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Search by name, batch, department, location" className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600" />
      </div>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alumni.map(a => (
          <li key={a.id} className="group rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-blue-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#0B4C72] grid place-items-center text-white text-sm font-medium">
                {a.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold">{a.name}</div>
                <div className="text-sm text-slate-300">{a.department} • {a.batch}</div>
                <div className="text-sm text-slate-400">{a.role} at {a.company}</div>
              </div>
              <div className="text-xs text-slate-400">{a.location}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}


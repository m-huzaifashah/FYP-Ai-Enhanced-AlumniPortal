import React from 'react'
import { Reveal } from '../ui'

type Service = { id: string; title: string; description: string; category: 'Career' | 'Community' | 'Benefits' | 'Support' }

export default function Services({
  services,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  onOpenService,
}: {
  services: Service[]
  query: string
  onQueryChange: (v: string) => void
  category: 'All' | 'Career' | 'Community' | 'Benefits' | 'Support'
  onCategoryChange: (c: 'All' | 'Career' | 'Community' | 'Benefits' | 'Support') => void
  onOpenService: (id: string) => void
}) {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-[#0B4C72] text-white px-6 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-3xl font-bold">Alumni Services</div>
            <p className="mt-2 text-slate-200 max-w-2xl">Discover exclusive resources, benefits, and programs designed to empower alumni, strengthen connections, and celebrate achievements.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-white/90 text-slate-900 px-4 py-2 text-sm font-medium" onClick={() => onOpenService('login')}>Get Started</button>
            <button className="rounded-md bg-black/30 text-white px-4 py-2 text-sm font-medium" onClick={() => onOpenService('contact')}>Contact Us</button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input value={query} onChange={e=>onQueryChange(e.target.value)} placeholder="Search services" className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600" />
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['All','Career','Community','Benefits','Support'] as const).map(cat => (
            <button key={cat} onClick={() => onCategoryChange(cat)} className={(category===cat ? 'bg-[#0B4C72] text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10') + ' rounded-full px-3 py-1 text-xs'}>{cat}</button>
          ))}
        </div>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(s => (
          <li key={s.id} className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-[#0B4C72]">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0B4C72] to-[#D29B2A] grid place-items-center text-white">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a5 5 0 015 5v2h1a3 3 0 013 3v7a3 3 0 01-3 3H6a3 3 0 01-3-3v-7a3 3 0 013-3h1V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v2h6V7a3 3 0 00-3-3z"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold">{s.title}</div>
                <p className="text-sm text-slate-300 mt-1">{s.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  {s.id==='login' ? (
                    <button onClick={() => onOpenService(s.id)} className="rounded-md bg-[#D29B2A] hover:bg-[#c18c21] px-3 py-2 text-sm text-slate-900 font-medium">Open</button>
                  ) : (
                    <button onClick={() => onOpenService(s.id)} className="rounded-md bg-slate-800 px-3 py-2 text-sm">Learn more</button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}


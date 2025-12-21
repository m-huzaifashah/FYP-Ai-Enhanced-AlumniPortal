import React from 'react'
import { Reveal, IconCard, Button } from '../../ui'

type Service = {
  id: string;
  title: string;
  description: string;
  category: 'Career' | 'Community' | 'Benefits' | 'Support'
}

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
  const SERVICE_IMAGES: Record<string, string> = {
    jobs: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    mentorship: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    events: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    scholarship: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    transcript: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    card: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    stories: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    profile: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
  }
  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-[#1669bb] text-white px-6 py-10 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-3xl font-bold">Alumni Services</div>
            <p className="mt-2 text-blue-100 max-w-2xl">Discover exclusive resources, benefits, and programs designed to empower alumni, strengthen connections, and celebrate achievements.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlineWhite" onClick={() => onOpenService('contact')}>Contact Support</Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-center">
          <div className="rounded-xl ring-1 ring-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Available Services</div>
            <div className="text-2xl font-bold mt-1">{services.length}</div>
          </div>
          <div className="rounded-xl ring-1 ring-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Categories</div>
            <div className="text-2xl font-bold mt-1">4</div>
          </div>
          <div className="rounded-xl ring-1 ring-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Featured</div>
            <div className="text-2xl font-bold mt-1">Mentorship</div>
          </div>
        </div>
      </div>

      <div className="relative flex items:center gap-3">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search services"
          className="w-full rounded-lg ring-1 ring-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-600 focus:outline-none hover:ring-slate-300"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {(['All', 'Career', 'Community', 'Benefits', 'Support'] as const).map(c => (
          <button
            key={c}
            onClick={() => onCategoryChange(c)}
            className={(category === c
              ? 'bg-[#1669bb] text-white shadow-md ring-1 ring-[#1669bb]'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-[#1669bb] hover:ring-[#1669bb]') + ' rounded-full px-4 py-1.5 text-sm font-medium transition-all'}
          >{c}</button>
        ))}
      </div>

      {services.length === 0 && (
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 text-sm text-slate-700">No services match your search or category.</div>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map(s => (
          <li key={s.id}>
            <Reveal>
              <IconCard title={s.title} description={s.description} src={SERVICE_IMAGES[s.id] || SERVICE_IMAGES.jobs} onClick={() => onOpenService(s.id)} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}

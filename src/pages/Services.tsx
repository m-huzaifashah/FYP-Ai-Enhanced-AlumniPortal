import React from 'react'
import { Reveal, IconCard } from '../ui'

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
  const SERVICE_IMAGES: Record<string, string> = {
    login: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    jobs: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    events: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    contact: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    spotlight: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    'give-back': 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    snapshot: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    advantage: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    email: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    network: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    faqs: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    'message-vc': 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
  }
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
        <div className="mt-6 grid gap-3 sm:grid-cols-3 text-center">
          <div className="rounded-xl bg-white/10 p-3">
            <div className="text-xs text-white/80">Available Services</div>
            <div className="text-xl font-semibold">{services.length}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <div className="text-xs text-white/80">Categories</div>
            <div className="text-xl font-semibold">4</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <div className="text-xs text-white/80">New & Featured</div>
            <div className="text-xl font-semibold">Spotlight</div>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search services"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none hover:border-slate-400"
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
        {(['All','Career','Community','Benefits','Support'] as const).map(c => (
          <button
            key={c}
            onClick={() => onCategoryChange(c)}
            className={(category===c ? 'bg-[#0B4C72] text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200') + ' rounded-full px-3 py-1 text-sm shadow-sm'}
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
              <IconCard title={s.title} description={s.description} src={SERVICE_IMAGES[s.id] || SERVICE_IMAGES.login} onClick={() => onOpenService(s.id)} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}

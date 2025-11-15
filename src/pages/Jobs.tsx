import React from 'react'

type Job = { id: number; title: string; company: string; location: string; link: string }

export default function Jobs({ jobs }: { jobs: Job[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map(j => (
        <div key={j.id} className="group rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-[#0B4C72]">
          <div className="text-base font-semibold">{j.title}</div>
          <div className="text-sm text-slate-300">{j.company} • {j.location}</div>
          <a href={j.link} className="mt-2 inline-block text-sm text-[#0B4C72]">Apply</a>
        </div>
      ))}
    </section>
  )
}


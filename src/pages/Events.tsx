import React from 'react'

type Event = { id: number; title: string; date: string; location: string; description: string }

export default function Events({ events }: { events: Event[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map(ev => (
        <div key={ev.id} className="group rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-[#0B4C72]">
          <div className="text-base font-semibold">{ev.title}</div>
          <div className="text-sm text-slate-300">{ev.date} • {ev.location}</div>
          <p className="text-sm text-slate-400 mt-2">{ev.description}</p>
        </div>
      ))}
    </section>
  )
}


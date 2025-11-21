import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Modal, IconButton, Icon } from '../ui'

type Event = { id: number; title: string; date: string; location: string; description: string }

export default function Events({ events }: { events: Event[] }) {
  const [city, setCity] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Event | null>(null)
  const [rsvp, setRsvp] = useState<Record<number, number>>(() => Object.fromEntries(events.map(e => [e.id, Math.floor(Math.random()*40)+10])))

  const filtered = useMemo(() => {
    const s = start ? new Date(start) : null
    const e = end ? new Date(end) : null
    return events.filter(ev => {
      const locOk = !city.trim() || ev.location.toLowerCase().includes(city.trim().toLowerCase())
      const d = new Date(ev.date)
      const afterOk = !s || d >= s
      const beforeOk = !e || d <= e
      return locOk && afterOk && beforeOk
    })
  }, [events, city, start, end])

  const now = useMemo(() => new Date(), [])
  const upcoming = useMemo(() => filtered.filter(ev => new Date(ev.date) >= now), [filtered, now])
  const past = useMemo(() => filtered.filter(ev => new Date(ev.date) < now), [filtered, now])

  const register = (ev: Event) => {
    setRsvp(prev => ({ ...prev, [ev.id]: (prev[ev.id] || 0) + 1 }))
    setActive(ev)
    setOpen(true)
  }

  const ICON = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'

  return (
    <section className="space-y-8">
      <div className="text-center">
        <div className="text-3xl font-bold">Events</div>
        <div className="mt-2 text-slate-600">Discover upcoming activities and revisit past highlights.</div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px] items-center">
          <Input value={city} onChange={e=>setCity(e.target.value)} placeholder="Filter by city or venue" />
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200" />
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-200" />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Upcoming Events</div>
          </div>
          <ul className="mt-4 space-y-4">
            {upcoming.map(ev => (
              <li key={ev.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 grid place-items-center rounded-xl bg-white/70">
                    <img src={ICON} alt="Event" className="h-12 w-12 object-contain" onError={(e)=>{(e.currentTarget as HTMLImageElement).src = `https://placehold.co/64x64/EEF2FF/0B4C72?text=${encodeURIComponent(ev.title.split(' ')[0])}`}} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-sm text-slate-600">{new Date(ev.date).toLocaleDateString()} • {ev.location}</div>
                    <div className="mt-2 text-sm text-slate-700 line-clamp-2">{ev.description}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="primary" onClick={() => register(ev)}>Register</Button>
                      <Button variant="outline" onClick={() => { setActive(ev); setOpen(true) }}>Details</Button>
                      <IconButton aria-label="Add to Calendar">
                        <Icon name="calendar" />
                      </IconButton>
                      <div className="ml-auto text-xs text-slate-600">RSVP: {rsvp[ev.id] || 0}</div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {upcoming.length === 0 && (
              <li className="text-sm text-slate-600">No upcoming events match your filters.</li>
            )}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="text-xl font-semibold">Past Events</div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {past.map(ev => (
              <li key={ev.id} className="rounded-xl overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm">
                <img src={`https://placehold.co/600x360/FFFFFF/0B4C72?text=${encodeURIComponent(ev.title)}`} alt={ev.title} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <div className="text-sm font-semibold">{ev.title}</div>
                  <div className="text-xs text-slate-600">{new Date(ev.date).toLocaleDateString()} • {ev.location}</div>
                </div>
              </li>
            ))}
            {past.length === 0 && (
              <li className="text-sm text-slate-600">No past events to show.</li>
            )}
          </ul>
        </Card>
      </div>

      <Modal open={open && !!active} onClose={() => setOpen(false)} title={active ? active.title : 'Event'}>
        {active && (
          <div className="space-y-3">
            <div className="text-sm text-slate-300">{new Date(active.date).toLocaleString()}</div>
            <div className="text-sm text-slate-300">{active.location}</div>
            <div className="rounded-md bg-white/5 ring-1 ring-slate-800 p-3 text-sm text-slate-100">{active.description}</div>
            <div className="flex items-center gap-2">
              <IconButton aria-label="Add to Calendar">
                <Icon name="calendar" />
              </IconButton>
              <Button variant="primary" onClick={() => {
                if (!active) return
                setRsvp(prev => ({ ...prev, [active.id]: (prev[active.id] || 0) + 1 }))
                setOpen(false)
              }}>Register</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

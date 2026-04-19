import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, Modal, IconButton, Icon } from '../ui'
import { getEvents } from '../api'

type Event = { id: number | string; title: string; date: string; time?: string; location: string; description: string; image?: string; rsvpCount?: number; registrants?: string[] }

export default function Events() {
  const [city, setCity] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rsvp, setRsvp] = useState<Record<string | number, number>>({})

  useEffect(() => {
    let stop = false
    ;(async () => {
      setLoading(true); setError('')
      try {
        const data: Event[] = await getEvents()
        if (!stop) {
          setEvents(data)
          const counts: Record<string|number, number> = {}
          data.forEach(e => { counts[e.id] = e.rsvpCount || 0 })
          setRsvp(counts)
        }
      } catch (e: any) {
        if (!stop) setError(e?.message || 'Failed to load events')
      } finally {
        if (!stop) setLoading(false)
      }
    })()
    return () => { stop = true }
  }, [])

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

  const handleToggleRSVP = async (ev: Event) => {
    try {
      const res = await (import('../api').then(m => m.toggleRSVP(ev.id)))
      setRsvp(prev => ({ ...prev, [ev.id]: res.rsvpCount }))
      
      const userEmail = localStorage.getItem('email')
      if (!userEmail) throw new Error('You must be logged in to register')

      setEvents(prev => prev.map(item => {
        if (String(item.id) === String(ev.id)) {
          const registrants = [...(item.registrants || [])]
          if (res.isRegistered) {
             if (!registrants.includes(userEmail)) registrants.push(userEmail)
          } else {
             const idx = registrants.indexOf(userEmail)
             if (idx !== -1) registrants.splice(idx, 1)
          }
          return { ...item, rsvpCount: res.rsvpCount, registrants }
        }
        return item
      }))
    } catch (err: any) {
      alert(err.message || 'Failed to update registration')
    }
  }

  const isRegistered = (ev: Event) => {
    const userEmail = localStorage.getItem('email')
    if (!userEmail) return false
    return ev.registrants?.includes(userEmail) || false
  }

  const ICON = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'

  return (
    <section className="space-y-8">
      <div className="text-center">
        <div className="text-3xl font-bold">Events</div>
        <div className="mt-2 text-primary">Discover upcoming activities and revisit past highlights.</div>
      </div>

      {error && <div className="mx-auto max-w-7xl text-sm text-accent">{error}</div>}
      {loading && <div className="mx-auto max-w-7xl text-sm text-primary">Loading…</div>}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px] items-center">
          <Input value={city} onChange={e=>setCity(e.target.value)} placeholder="Filter by city or venue" />
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-secondary" />
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="rounded-full bg-white px-3 py-2 text-sm ring-1 ring-secondary" />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Upcoming Events</div>
          </div>
          <ul className="mt-4 space-y-4">
            {upcoming.map(ev => (
              <li key={ev.id} className="rounded-xl bg-white ring-1 ring-secondary p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 grid place-items-center rounded-xl bg-white/70">
                    <img 
                      src={ev.image || ICON} 
                      alt="Event" 
                      className={ev.image ? "h-full w-full object-cover rounded-xl" : "h-12 w-12 object-contain"} 
                      onError={(e)=>{(e.currentTarget as HTMLImageElement).src = `https://placehold.co/64x64/EEF2FF/0B4C72?text=${encodeURIComponent(ev.title.split(' ')[0])}`}} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-sm text-primary">{new Date(ev.date).toLocaleDateString()} {ev.time && `• ${new Date(`2000-01-01T${ev.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} • {ev.location}</div>
                    <div className="mt-2 text-sm text-primary line-clamp-2">{ev.description}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button 
                        variant={isRegistered(ev) ? 'outline' : 'primary'} 
                        onClick={() => handleToggleRSVP(ev)}
                        className={isRegistered(ev) ? 'bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/20' : ''}
                      >
                        {isRegistered(ev) ? '✓ Registered' : 'Register'}
                      </Button>
                      <Button variant="outline" onClick={() => { setActive(ev); setOpen(true) }}>Details</Button>
                      <IconButton aria-label="Add to Calendar">
                        <Icon name="calendar" />
                      </IconButton>
                      <div className="ml-auto text-xs text-primary">RSVP: {rsvp[ev.id] || 0}</div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {upcoming.length === 0 && (
              <li className="text-sm text-primary">No upcoming events match your filters.</li>
            )}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="text-xl font-semibold">Past Events</div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {past.map(ev => (
              <li key={ev.id} className="rounded-xl overflow-hidden bg-white ring-1 ring-secondary shadow-sm">
                <img src={ev.image || `https://placehold.co/600x360/FFFFFF/0B4C72?text=${encodeURIComponent(ev.title)}`} alt={ev.title} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <div className="text-sm font-semibold">{ev.title}</div>
                  <div className="text-xs text-primary">{new Date(ev.date).toLocaleDateString()} {ev.time && `• ${new Date(`2000-01-01T${ev.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} • {ev.location}</div>
                </div>
              </li>
            ))}
            {past.length === 0 && (
              <li className="text-sm text-primary">No past events to show.</li>
            )}
          </ul>
        </Card>
      </div>

      <Modal open={open && !!active} onClose={() => setOpen(false)} title={active ? active.title : 'Event'}>
        {active && (
          <div className="space-y-3">
            <div className="text-sm text-secondary">{new Date(active.date).toLocaleDateString()} {active.time && `at ${new Date(`2000-01-01T${active.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</div>
            <div className="text-sm text-secondary">{active.location}</div>
            <div className="rounded-md bg-white/5 ring-1 ring-secondary p-3 text-sm text-secondary">{active.description}</div>
            <div className="flex items-center gap-2">
              <IconButton aria-label="Add to Calendar">
                <Icon name="calendar" />
              </IconButton>
              <Button 
                variant={active && isRegistered(active) ? 'outline' : 'primary'} 
                onClick={() => { if(active) { handleToggleRSVP(active); setOpen(false); } }}
                className={active && isRegistered(active) ? 'bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/20' : ''}
              >
                {active && isRegistered(active) ? '✓ Registered' : 'Register Now'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

import React, { useMemo, useState } from 'react'
import { Button, Card, Counter, Input, Modal } from '../ui'

type Event = { id: number; title: string; date: string; location: string; description: string }
type Job = { id: number; title: string; company: string; location: string; link: string }

export default function Admin({ events, jobs, alumniCount }: { events: Event[]; jobs: Job[]; alumniCount: number }) {
  const [evs, setEvs] = useState<Event[]>(events)
  const [evOpen, setEvOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evLocation, setEvLocation] = useState('')
  const [evDesc, setEvDesc] = useState('')

  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')
  const [annStatus, setAnnStatus] = useState('')

  const now = useMemo(() => new Date(), [])
  const upcomingCount = useMemo(() => evs.filter(e => new Date(e.date) >= now).length, [evs, now])
  const jobsCount = jobs.length

  const openCreate = () => {
    setEditId(null)
    setEvTitle('')
    setEvDate('')
    setEvLocation('')
    setEvDesc('')
    setEvOpen(true)
  }

  const openEdit = (e: Event) => {
    setEditId(e.id)
    setEvTitle(e.title)
    setEvDate(e.date)
    setEvLocation(e.location)
    setEvDesc(e.description)
    setEvOpen(true)
  }

  const saveEvent = () => {
    const ok = evTitle.trim().length >= 2 && /\d{4}-\d{2}-\d{2}/.test(evDate) && evLocation.trim().length >= 2
    if (!ok) return
    if (editId == null) {
      const id = Math.max(0, ...evs.map(x => x.id)) + 1
      setEvs(prev => [...prev, { id, title: evTitle.trim(), date: evDate, location: evLocation.trim(), description: evDesc.trim() }])
    } else {
      setEvs(prev => prev.map(x => x.id === editId ? { ...x, title: evTitle.trim(), date: evDate, location: evLocation.trim(), description: evDesc.trim() } : x))
    }
    setEvOpen(false)
  }

  const removeEvent = (id: number) => setEvs(prev => prev.filter(x => x.id !== id))

  const REPORTS = useMemo(() => ([
    { id: 1, user: 'Aisha Khan', type: 'Issue', date: '2025-10-01', status: 'Open' },
    { id: 2, user: 'Bilal Ahmed', type: 'Request', date: '2025-10-03', status: 'Open' },
    { id: 3, user: 'Sara Waheed', type: 'Issue', date: '2025-10-05', status: 'Resolved' },
    { id: 4, user: 'Usman Ali', type: 'Request', date: '2025-10-06', status: 'Open' },
  ]), [])
  const [reports, setReports] = useState(REPORTS)

  return (
    <section className="space-y-8">
      <div className="text-2xl font-bold">Admin Dashboard</div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-slate-600">Active Alumni</div>
          <div className="mt-1 text-3xl font-bold text-slate-900"><Counter to={alumniCount} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Upcoming Events</div>
          <div className="mt-1 text-3xl font-bold text-slate-900"><Counter to={upcomingCount} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Open Jobs</div>
          <div className="mt-1 text-3xl font-bold text-slate-900"><Counter to={jobsCount} /></div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Event Management</div>
            <Button variant="primary" onClick={openCreate}>Add Event</Button>
          </div>
          <ul className="mt-4 space-y-3">
            {evs.map(e => (
              <li key={e.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-slate-600">{new Date(e.date).toLocaleDateString()} • {e.location}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{e.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(e)}>Edit</Button>
                    <Button variant="outline" onClick={() => removeEvent(e.id)}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="text-xl font-semibold">Announcement Composer</div>
          <div className="mt-4 space-y-3">
            <Input value={annTitle} onChange={e=>setAnnTitle(e.target.value)} placeholder="Subject" />
            <textarea value={annBody} onChange={e=>setAnnBody(e.target.value)} rows={5} className="w-full rounded-2xl bg-white px-4 py-2 text-sm text-slate-900 ring-1 ring-slate-200 shadow-sm" placeholder="Write announcement" />
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={() => {
                const ok = annTitle.trim().length >= 2 && annBody.trim().length >= 10
                setAnnStatus(ok ? 'Announcement published' : 'Fill subject and message')
                if (ok) { setAnnTitle(''); setAnnBody('') }
              }}>Publish</Button>
              {annStatus && <div className={(annStatus.includes('published') ? 'text-green-700' : 'text-red-700') + ' text-sm'}>{annStatus}</div>}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-xl font-semibold">User Reports</div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{r.user}</td>
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">
                    <Button variant="outline" onClick={() => setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'Resolved' } : x))}>Resolve</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={evOpen} onClose={() => setEvOpen(false)} title={editId == null ? 'Add Event' : 'Edit Event'}>
        <div className="space-y-3">
          <Input value={evTitle} onChange={e=>setEvTitle(e.target.value)} placeholder="Title" />
          <input type="date" value={evDate} onChange={e=>setEvDate(e.target.value)} className="w-full rounded-2xl bg-white px-4 py-2 text-sm text-slate-900 ring-1 ring-slate-200 shadow-sm" />
          <Input value={evLocation} onChange={e=>setEvLocation(e.target.value)} placeholder="Location" />
          <textarea value={evDesc} onChange={e=>setEvDesc(e.target.value)} rows={4} className="w-full rounded-2xl bg-white px-4 py-2 text-sm text-slate-900 ring-1 ring-slate-200 shadow-sm" placeholder="Description" />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEvOpen(false)}>Back</Button>
            <Button variant="primary" onClick={saveEvent}>Save</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}


import React, { useMemo, useState } from 'react'
import { Button, Card, Counter, Input, Modal } from '../ui'
import { createEvent, updateEvent, deleteEvent, createJob, updateJob, deleteJob, getTickets, updateTicketStatus, createAdminAccount, getAnnouncements, createAnnouncement, deleteAnnouncement } from '../api'

type Event = { id: number | string; title: string; date: string; time?: string; location: string; description: string; image?: string }
type Job = { id: number | string; title: string; company: string; location: string; link: string; image?: string; deadline?: string }
type Announcement = { _id: string; title: string; body: string; expiresAt: string; createdAt: string }

export default function Admin({ events, jobs, alumniCount, onEventsChanged, dataMode }: { events: Event[]; jobs: Job[]; alumniCount: number; onEventsChanged?: (next: Event[]) => void; dataMode?: 'db' | 'memory' }) {
  const [admOpen, setAdmOpen] = useState(false)
  const [admName, setAdmName] = useState('')
  const [admEmail, setAdmEmail] = useState('')
  const [admPass, setAdmPass] = useState('')
  const [admStatus, setAdmStatus] = useState('')
  const [admLoading, setAdmLoading] = useState(false)

  const handleCreateAdmin = async () => {
    if (admName.length < 2 || !admEmail.includes('@') || admPass.length < 6) {
       setAdmStatus('Please fill all fields properly (password >= 6 chars)');
       return;
    }
    setAdmLoading(true)
    setAdmStatus('')
    try {
      await createAdminAccount({ name: admName, email: admEmail, password: admPass })
      setAdmStatus('Success: Admin account created!')
      setTimeout(() => {
        setAdmOpen(false)
        setAdmName('')
        setAdmEmail('')
        setAdmPass('')
        setAdmStatus('')
      }, 1500)
    } catch(err: any) {
      setAdmStatus(err?.message || 'Failed to create admin')
    } finally {
      setAdmLoading(false)
    }
  }

  const [evs, setEvs] = useState<Event[]>(events)
  const [evOpen, setEvOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evTime, setEvTime] = useState('')
  const [evLocation, setEvLocation] = useState('')
  const [evDesc, setEvDesc] = useState('')
  const [evImage, setEvImage] = useState<File | null>(null)
  const [evImagePreview, setEvImagePreview] = useState<string>('')
  const [evRemoveImage, setEvRemoveImage] = useState(false)
  const [evError, setEvError] = useState('')
  const [evSaving, setEvSaving] = useState(false)
  const [evQuery, setEvQuery] = useState('')

  const [jobOpen, setJobOpen] = useState(false)
  const [jobEditId, setJobEditId] = useState<number | string | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [jobLink, setJobLink] = useState('')
  const [jobDeadline, setJobDeadline] = useState('')
  const [jobImage, setJobImage] = useState<File | null>(null)
  const [jobImagePreview, setJobImagePreview] = useState<string>('')
  const [jobRemoveImage, setJobRemoveImage] = useState(false)

  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')
  const [annExpiresAt, setAnnExpiresAt] = useState('')
  const [annStatus, setAnnStatus] = useState('')
  const [annList, setAnnList] = useState<Announcement[]>([])
  const [annLoading, setAnnLoading] = useState(false)

  const now = useMemo(() => new Date(), [])
  const upcomingCount = useMemo(() => evs.filter(e => new Date(e.date) >= now).length, [evs, now])
  const [jobsState, setJobsState] = useState<Job[]>(jobs)
  const jobsCount = jobsState.length
  const [jobQuery, setJobQuery] = useState('')

  React.useEffect(() => { setEvs(events) }, [events])
  React.useEffect(() => { setJobsState(jobs) }, [jobs])

  const evsFiltered = useMemo(() => {
    const q = evQuery.trim().toLowerCase()
    if (!q) return evs
    return evs.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    )
  }, [evs, evQuery])

  const jobsFiltered = useMemo(() => {
    const q = jobQuery.trim().toLowerCase()
    if (!q) return jobsState
    return jobsState.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.link.toLowerCase().includes(q)
    )
  }, [jobsState, jobQuery])

  const downloadCSV = (rows: any[], columns: string[], filename: string) => {
    const header = columns.join(',')
    const body = rows.map(r => columns.map(c => {
      const v = (r as any)[c]
      const s = v == null ? '' : String(v).replace(/"/g, '""')
      return `"${s}"`
    }).join(',')).join('\n')
    const csv = header + '\n' + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportEvents = () => downloadCSV(evs, ['id','title','date','location','description'], 'events.csv')
  const exportJobs = () => downloadCSV(jobsState, ['id','title','company','location','link'], 'jobs.csv')

  const [tab, setTab] = useState<'events' | 'jobs' | 'announcements' | 'reports'>('events')

  const openCreate = () => {
    setEditId(null)
    setEvTitle('')
    setEvDate('')
    setEvTime('')
    setEvLocation('')
    setEvDesc('')
    setEvImage(null)
    setEvImagePreview('')
    setEvRemoveImage(false)
    setEvOpen(true)
  }

  const openEdit = (e: Event) => {
    setEditId(e.id)
    setEvTitle(e.title)
    setEvDate(e.date)
    setEvTime(e.time || '')
    setEvLocation(e.location)
    setEvDesc(e.description)
    setEvImage(null)
    setEvImagePreview(e.image || '')
    setEvRemoveImage(false)
    setEvOpen(true)
  }

  const saveEvent = async () => {
    setEvError('')
    const d = new Date(evDate)
    const ok = evTitle.trim().length >= 2 && !isNaN(d.getTime()) && evLocation.trim().length >= 2
    if (!ok) { setEvError('Please fill title, a valid date, and location'); return }
    const dateNorm = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10)
    setEvSaving(true)
    try {
      if (editId == null) {
        const created = await createEvent({ title: evTitle.trim(), date: dateNorm, time: evTime, location: evLocation.trim(), description: evDesc.trim(), image: evImage })
        const next = [...evs, created]
        setEvs(next)
        onEventsChanged && onEventsChanged(next)
        try { window.dispatchEvent(new CustomEvent('eventsUpdated')) } catch {}
      } else {
        const updated = await updateEvent(editId, { title: evTitle.trim(), date: dateNorm, time: evTime, location: evLocation.trim(), description: evDesc.trim(), image: evImage, removeImage: evRemoveImage })
        const next = evs.map(x => String(x.id) === String(editId) ? updated : x)
        setEvs(next)
        onEventsChanged && onEventsChanged(next)
        try { window.dispatchEvent(new CustomEvent('eventsUpdated')) } catch {}
      }
      setEvOpen(false)
    } catch (e: any) {
      setEvError(e?.message || 'Failed to save event')
    } finally {
      setEvSaving(false)
    }
  }

  const removeEvent = async (id: number | string) => {
    try { await deleteEvent(id) } catch {}
    const next = evs.filter(x => String(x.id) !== String(id))
    setEvs(next)
    onEventsChanged && onEventsChanged(next)
    try { window.dispatchEvent(new CustomEvent('eventsUpdated')) } catch {}
  }

  const openJobCreate = () => {
    setJobEditId(null)
    setJobTitle('')
    setJobCompany('')
    setJobLocation('')
    setJobLink('')
    setJobDeadline('')
    setJobImage(null)
    setJobImagePreview('')
    setJobRemoveImage(false)
    setJobOpen(true)
  }

  const openJobEdit = (j: Job) => {
    setJobEditId(j.id)
    setJobTitle(j.title)
    setJobCompany(j.company)
    setJobLocation(j.location)
    setJobLink(j.link)
    setJobDeadline(j.deadline || '')
    setJobImage(null)
    setJobImagePreview(j.image || '')
    setJobRemoveImage(false)
    setJobOpen(true)
  }

  const saveJob = async () => {
    const ok = jobTitle.trim().length >= 2 && jobCompany.trim().length >= 2 && jobLocation.trim().length >= 2 && jobDeadline
    if (!ok) return
    try {
      if (jobEditId == null) {
        const created = await createJob({ title: jobTitle.trim(), company: jobCompany.trim(), location: jobLocation.trim(), link: jobLink.trim(), deadline: jobDeadline, image: jobImage })
        setJobsState(prev => [...prev, created])
      } else {
        const updated = await updateJob(jobEditId, { title: jobTitle.trim(), company: jobCompany.trim(), location: jobLocation.trim(), link: jobLink.trim(), deadline: jobDeadline, image: jobImage, removeImage: jobRemoveImage })
        setJobsState(prev => prev.map(x => String(x.id) === String(jobEditId) ? updated : x))
      }
    } catch {}
    setJobOpen(false)
  }

  const removeJob = async (id: number | string) => {
    try { await deleteJob(id) } catch {}
    setJobsState(prev => prev.filter(x => String(x.id) !== String(id)))
  }

  const [reports, setReports] = React.useState<any[]>([])
  const [reportsLoading, setReportsLoading] = React.useState(false)

  React.useEffect(() => {
    if (tab === 'reports') {
      setReportsLoading(true)
      getTickets().then(res => {
        setReports(res)
      }).catch(err => console.error(err))
      .finally(() => setReportsLoading(false))
    }
  }, [tab])

  const handleUpdateTicket = async (id: string, newStatus: string) => {
    try {
      const updated = await updateTicketStatus(id, newStatus)
      setReports(prev => prev.map(t => t._id === id ? updated : t))
    } catch(err) {
      alert('Failed to update ticket')
    }
  }

  const fetchAnnouncements = async () => {
    setAnnLoading(true)
    try {
      const data = await getAnnouncements()
      setAnnList(data)
    } finally {
      setAnnLoading(false)
    }
  }

  React.useEffect(() => {
    if (tab === 'announcements') fetchAnnouncements()
  }, [tab])

  const handlePublishAnnouncement = async () => {
    const ok = annTitle.trim().length >= 2 && annBody.trim().length >= 10 && annExpiresAt
    if (!ok) {
       setAnnStatus('Fill subject, message (10+ chars), and expiry date')
       return
    }
    setAnnLoading(true)
    try {
      await createAnnouncement({ title: annTitle.trim(), body: annBody.trim(), expiresAt: annExpiresAt })
      setAnnStatus('Announcement published')
      setAnnTitle('')
      setAnnBody('')
      setAnnExpiresAt('')
      fetchAnnouncements()
    } catch (e: any) {
      setAnnStatus(e?.message || 'Failed to publish')
    } finally {
      setAnnLoading(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncement(id)
      setAnnList(prev => prev.filter(a => a._id !== id))
    } catch (e) {
      alert('Failed to delete')
    }
  }

  return (
    <section className="space-y-8">
      <div className="text-2xl font-bold flex items-center gap-3">
        <span>Admin Dashboard</span>
        {dataMode && (
          <span className={"text-xs rounded-full px-2 py-1 " + (dataMode === 'db' ? 'bg-secondary text-primary' : 'bg-yellow-100 text-yellow-800')}>{dataMode === 'db' ? 'Database' : 'In-Memory'}</span>
        )}
        <Button variant="primary" className="ml-auto text-sm py-1.5 px-3" onClick={() => setAdmOpen(true)}>+ Add Admin</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-primary">Active Alumni</div>
          <div className="mt-1 text-3xl font-bold text-primary"><Counter to={alumniCount} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-primary">Upcoming Events</div>
          <div className="mt-1 text-3xl font-bold text-primary"><Counter to={upcomingCount} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-primary">Open Jobs</div>
          <div className="mt-1 text-3xl font-bold text-primary"><Counter to={jobsCount} /></div>
        </Card>
      </div>

      <div className="text-xs text-primary">Data Source: {dataMode === 'db' ? 'Database' : 'In-Memory (dev)'}
      </div>

      <div className="rounded-2xl bg-white/70 ring-1 ring-secondary p-2 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant={tab==='events'?'primary':'outline'} onClick={() => setTab('events')}>Events</Button>
          <Button variant={tab==='jobs'?'primary':'outline'} onClick={() => setTab('jobs')}>Jobs</Button>
          <Button variant={tab==='announcements'?'primary':'outline'} onClick={() => setTab('announcements')}>Announcements</Button>
          <Button variant={tab==='reports'?'primary':'outline'} onClick={() => setTab('reports')}>Reports</Button>
        </div>
      </div>

      {tab === 'events' && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Event Management</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportEvents}>Export CSV</Button>
              <Button variant="primary" onClick={openCreate}>Add Event</Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px]">
            <Input value={evQuery} onChange={e=>setEvQuery(e.target.value)} placeholder="Search by title, location, description" />
            <div className="hidden" />
          </div>
          <ul className="mt-4 space-y-3">
            {evsFiltered.map(e => (
              <li key={e.id} className="rounded-xl bg-white ring-1 ring-secondary p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {e.image && (
                    <img src={e.image} alt={e.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-primary">{new Date(e.date).toLocaleDateString()} {e.time && `• ${new Date(`2000-01-01T${e.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} • {e.location}</div>
                    <div className="text-xs text-primary line-clamp-2">{e.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(e)}>Edit</Button>
                    <Button variant="outline" onClick={() => { if (confirm('Delete this event?')) removeEvent(e.id) }}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
            {evsFiltered.length === 0 && (
              <li className="text-sm text-primary">No events match your search.</li>
            )}
          </ul>
        </Card>
      )}

      {tab === 'jobs' && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Jobs Management</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportJobs}>Export CSV</Button>
              <Button variant="primary" onClick={openJobCreate}>Add Job</Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px]">
            <Input value={jobQuery} onChange={e=>setJobQuery(e.target.value)} placeholder="Search by title, company, location" />
            <div className="hidden" />
          </div>
          <ul className="mt-4 space-y-3">
            {jobsFiltered.map(j => (
              <li key={j.id} className="rounded-xl bg-white ring-1 ring-secondary p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {j.image && (
                    <img src={j.image} alt={j.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{j.title}</div>
                    <div className="text-sm text-primary">{j.company} • {j.location}</div>
                    <div className="text-xs text-primary">{j.deadline && `Deadline: ${new Date(j.deadline).toLocaleDateString()}`} • {j.link}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openJobEdit(j)}>Edit</Button>
                    <Button variant="outline" onClick={() => { if (confirm('Delete this job?')) removeJob(j.id) }}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
            {jobsFiltered.length === 0 && (
              <li className="text-sm text-primary">No jobs match your search.</li>
            )}
          </ul>
        </Card>
      )}

      {tab === 'announcements' && (
        <Card className="p-6">
          <div className="text-xl font-semibold">Announcement Composer</div>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={annTitle} onChange={e=>setAnnTitle(e.target.value)} placeholder="Subject" className="w-full" />
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-white/50 uppercase whitespace-nowrap">Expires On:</label>
                <input type="date" value={annExpiresAt} onChange={e=>setAnnExpiresAt(e.target.value)} className="w-full rounded-full bg-white px-4 py-2 text-sm text-primary ring-1 ring-secondary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" />
              </div>
            </div>
            <textarea value={annBody} onChange={e=>setAnnBody(e.target.value)} rows={5} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-primary ring-1 ring-secondary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Write announcement details..." />
            <div className="flex items-center gap-2">
              <Button variant="primary" disabled={annLoading} onClick={handlePublishAnnouncement}>
                {annLoading ? 'Publishing...' : 'Publish Announcement'}
              </Button>
              {annStatus && <div className={(annStatus.includes('published') ? 'text-primary' : 'text-accent') + ' text-sm font-medium'}>{annStatus}</div>}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-xl font-semibold mb-4">Active Announcements</div>
            {annLoading && annList.length === 0 ? (
               <div className="text-sm text-primary">Loading...</div>
            ) : annList.length === 0 ? (
               <div className="text-sm text-primary/60 italic">No active announcements.</div>
            ) : (
              <ul className="space-y-4">
                {annList.map(a => (
                  <li key={a._id} className="rounded-xl bg-white ring-1 ring-secondary p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-primary">{a.title}</div>
                        <div className="text-xs text-primary/50 mt-0.5">Expires: {new Date(a.expiresAt).toLocaleDateString()} • Created: {new Date(a.createdAt).toLocaleDateString()}</div>
                        <div className="mt-2 text-sm text-primary whitespace-pre-wrap">{a.body}</div>
                      </div>
                      <Button variant="outline" className="text-accent ring-accent/30 hover:ring-accent ml-4" onClick={() => handleDeleteAnnouncement(a._id)}>Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === 'reports' && (
        <Card className="p-6">
          <div className="text-xl font-semibold">Support Tickets</div>
          {reportsLoading ? (
            <div className="mt-4 text-sm text-primary">Loading tickets...</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-primary">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Summary</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-primary">No tickets found.</td></tr>
                  )}
                  {reports.map(r => (
                    <tr key={r._id} className="border-t border-secondary">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.createdBy?.name || 'Local User'}</div>
                        <div className="text-xs text-primary">{r.createdBy?.email}</div>
                      </td>
                      <td className="px-3 py-2 font-medium">{r.title}</td>
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <span className={"px-2 py-1 rounded-full text-xs font-medium " + (r.status === 'Resolved' ? 'bg-secondary text-primary' : r.status === 'Rejected' ? 'bg-accent text-accent' : 'bg-yellow-100 text-yellow-700')}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex items-center gap-2">
                        {r.status === 'Open' && (
                          <>
                            <Button variant="outline" onClick={() => handleUpdateTicket(r._id, 'Resolved')}>Resolve</Button>
                            <Button variant="outline" className="text-accent hover:ring-red-600" onClick={() => handleUpdateTicket(r._id, 'Rejected')}>Reject</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={evOpen} onClose={() => setEvOpen(false)} title={editId == null ? 'Post New Event' : 'Edit Event'} titleClassName="w-full text-center">
        <div className="space-y-4 pt-2">
          <p className="text-center text-sm text-white/60 -mt-2 mb-1">Fill in the details for the alumni event</p>
          {evError && <div className="rounded-md bg-accent/20 text-accent px-4 py-3 text-sm font-medium border border-red-500/30">{evError}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Event Title</label>
              <Input value={evTitle} onChange={e=>setEvTitle(e.target.value)} placeholder="e.g. Annual Alumni Meetup 2025" className="w-full !rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 ml-1">Date</label>
                <input type="date" value={evDate} onChange={e=>setEvDate(e.target.value)} className="w-full rounded-xl bg-white px-4 py-2 text-sm text-primary ring-1 ring-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 ml-1">Time</label>
                <input type="time" value={evTime} onChange={e=>setEvTime(e.target.value)} className="w-full rounded-xl bg-white px-4 py-2 text-sm text-primary ring-1 ring-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 ml-1">Location</label>
                <Input value={evLocation} onChange={e=>setEvLocation(e.target.value)} placeholder="e.g. Main Auditorium" className="w-full !rounded-xl" />
              </div>
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Description</label>
             <textarea value={evDesc} onChange={e=>setEvDesc(e.target.value)} rows={4} className="w-full rounded-xl bg-white px-4 py-3 text-sm text-primary placeholder-slate-400 ring-1 ring-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" placeholder="Share details about the event..." />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 ml-1">Cover Image</label>
            {(evImagePreview && !evRemoveImage) ? (
              <div className="relative mt-2">
                <img src={evImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-white/10 shadow-sm" />
                <button
                  type="button"
                  onClick={() => { setEvImagePreview(''); setEvImage(null); setEvRemoveImage(true) }}
                  className="absolute top-3 right-3 bg-black/70 hover:bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                >✕ REMOVE</button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/[0.02] cursor-pointer transition-all group">
                <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                  <span className="text-3xl mb-2">🖼️</span>
                  <span className="text-sm font-semibold text-white/60">Drop image here or click to upload</span>
                  <span className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">PNG, JPG or WebP</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setEvImage(f)
                    setEvRemoveImage(false)
                    const reader = new FileReader()
                    reader.onload = ev => setEvImagePreview(ev.target?.result as string)
                    reader.readAsDataURL(f)
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button onClick={() => setEvOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors">Cancel</button>
            <Button 
              variant="primary" 
              onClick={saveEvent} 
              disabled={evSaving || !evTitle.trim() || !evDate || !evTime || !evLocation.trim() || !evDesc.trim()} 
              className={`px-6 py-2 !rounded-xl shadow-lg transition-all ${evSaving || !evTitle.trim() || !evDate || !evTime || !evLocation.trim() || !evDesc.trim() ? 'bg-primary/40 cursor-not-allowed opacity-50' : 'shadow-white/5'}`}
            >
              {evSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Saving...
                </span>
              ) : 'Save Event'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={jobOpen} onClose={() => setJobOpen(false)} title={jobEditId == null ? 'Post New Job' : 'Edit Job'} titleClassName="w-full text-center">
        <div className="space-y-4 pt-2">
          <p className="text-center text-sm text-white/60 -mt-2 mb-1">Share a career opportunity</p>
          <div className="space-y-4">
            <div>
               <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Job Title</label>
               <Input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" className="w-full !rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Company</label>
                <Input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="e.g. Google" className="w-full !rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Location</label>
                <Input value={jobLocation} onChange={e=>setJobLocation(e.target.value)} placeholder="e.g. Remote / Islamabad" className="w-full !rounded-xl" />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Application URL</label>
               <Input value={jobLink} onChange={e=>setJobLink(e.target.value)} placeholder="https://careers.company.com/..." className="w-full !rounded-xl" />
            </div>

            <div>
               <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1 text-accent">Last Date to Apply</label>
               <input type="date" value={jobDeadline} onChange={e=>setJobDeadline(e.target.value)} className="w-full rounded-xl bg-white px-4 py-3 text-sm text-primary ring-1 ring-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Company Logo <span className="text-white/40 normal-case font-normal">(max 5MB)</span></label>
            {(jobImagePreview && !jobRemoveImage) ? (
              <div className="relative mt-2">
                <img src={jobImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-white/10 shadow-sm" />
                <button
                  type="button"
                  onClick={() => { setJobImagePreview(''); setJobImage(null); setJobRemoveImage(true) }}
                  className="absolute top-3 right-3 bg-black/70 hover:bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                >✕ REMOVE</button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/[0.02] cursor-pointer transition-all group">
                <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                  <span className="text-3xl mb-2">🏢</span>
                  <span className="text-sm font-semibold text-white/60">Drop logo here or click to upload</span>
                  <span className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">PNG, JPG or WebP</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setJobImage(f)
                    setJobRemoveImage(false)
                    const reader = new FileReader()
                    reader.onload = ev => setJobImagePreview(ev.target?.result as string)
                    reader.readAsDataURL(f)
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button onClick={() => setJobOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors">Cancel</button>
            <Button 
              variant="primary" 
              onClick={saveJob} 
              disabled={!jobTitle.trim() || !jobCompany.trim() || !jobLocation.trim() || !jobLink.trim() || !jobDeadline} 
              className={`px-6 py-2 !rounded-xl shadow-lg transition-all ${
                !jobTitle.trim() || !jobCompany.trim() || !jobLocation.trim() || !jobLink.trim() || !jobDeadline
                  ? 'bg-primary/40 cursor-not-allowed opacity-50'
                  : 'shadow-white/5'
              }`}
            >
              Save Job
            </Button>
          </div>
        </div>
      </Modal>
    <Modal open={admOpen} onClose={() => setAdmOpen(false)} title="Add Administrator" titleClassName="w-full text-center">
        <div className="space-y-5 pt-4">
          <p className="text-center text-sm text-white/60 -mt-4 mb-2">Create a new administrative user for the portal</p>
          {admStatus && <div className={(admStatus.includes('Success') ? 'bg-secondary text-primary border-green-200' : 'bg-accent text-accent border-red-200') + ' border px-3 py-2 rounded-md text-sm'}>{admStatus}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
              <Input value={admName} onChange={e => setAdmName(e.target.value)} placeholder="Admin Name" className="w-full !rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <Input value={admEmail} onChange={e => setAdmEmail(e.target.value)} placeholder="admin@example.com" type="email" className="w-full !rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <Input value={admPass} onChange={e => setAdmPass(e.target.value)} placeholder="Top secret password" type="password" className="w-full !rounded-xl" />
            </div>
          </div>
          
          <Button variant="primary" onClick={handleCreateAdmin} disabled={admLoading} className="w-full mt-4 !rounded-xl py-3 font-bold shadow-lg shadow-white/5">
            {admLoading ? 'Creating Account...' : 'Create Admin'}
          </Button>
        </div>
      </Modal>
    </section>
  )
}

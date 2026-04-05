import React, { useMemo, useState } from 'react'
import { Button, Card, Counter, Input, Modal } from '../ui'
import { createEvent, updateEvent, deleteEvent, createJob, updateJob, deleteJob, getTickets, updateTicketStatus, createAdminAccount } from '../api'

type Event = { id: number | string; title: string; date: string; location: string; description: string }
type Job = { id: number | string; title: string; company: string; location: string; link: string }

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
  const [evLocation, setEvLocation] = useState('')
  const [evDesc, setEvDesc] = useState('')
  const [evError, setEvError] = useState('')
  const [evSaving, setEvSaving] = useState(false)
  const [evQuery, setEvQuery] = useState('')

  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')
  const [annStatus, setAnnStatus] = useState('')

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

  const saveEvent = async () => {
    setEvError('')
    const d = new Date(evDate)
    const ok = evTitle.trim().length >= 2 && !isNaN(d.getTime()) && evLocation.trim().length >= 2
    if (!ok) { setEvError('Please fill title, a valid date, and location'); return }
    const dateNorm = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10)
    setEvSaving(true)
    try {
      if (editId == null) {
        const created = await createEvent({ title: evTitle.trim(), date: dateNorm, location: evLocation.trim(), description: evDesc.trim() })
        const next = [...evs, created]
        setEvs(next)
        onEventsChanged && onEventsChanged(next)
        try { window.dispatchEvent(new CustomEvent('eventsUpdated')) } catch {}
      } else {
        const updated = await updateEvent(editId, { title: evTitle.trim(), date: dateNorm, location: evLocation.trim(), description: evDesc.trim() })
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

  const [jobOpen, setJobOpen] = useState(false)
  const [jobEditId, setJobEditId] = useState<number | string | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [jobLink, setJobLink] = useState('')

  const openJobCreate = () => {
    setJobEditId(null)
    setJobTitle('')
    setJobCompany('')
    setJobLocation('')
    setJobLink('')
    setJobOpen(true)
  }

  const openJobEdit = (j: Job) => {
    setJobEditId(j.id)
    setJobTitle(j.title)
    setJobCompany(j.company)
    setJobLocation(j.location)
    setJobLink(j.link)
    setJobOpen(true)
  }

  const saveJob = async () => {
    const ok = jobTitle.trim().length >= 2 && jobCompany.trim().length >= 2 && jobLocation.trim().length >= 2
    if (!ok) return
    try {
      if (jobEditId == null) {
        const created = await createJob({ title: jobTitle.trim(), company: jobCompany.trim(), location: jobLocation.trim(), link: jobLink.trim() })
        setJobsState(prev => [...prev, created])
      } else {
        const updated = await updateJob(jobEditId, { title: jobTitle.trim(), company: jobCompany.trim(), location: jobLocation.trim(), link: jobLink.trim() })
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

  return (
    <section className="space-y-8">
      <div className="text-2xl font-bold flex items-center gap-3">
        <span>Admin Dashboard</span>
        {dataMode && (
          <span className={"text-xs rounded-full px-2 py-1 " + (dataMode === 'db' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800')}>{dataMode === 'db' ? 'Database' : 'In-Memory'}</span>
        )}
        <Button variant="primary" className="ml-auto text-sm py-1.5 px-3" onClick={() => setAdmOpen(true)}>+ Add Admin</Button>
      </div>

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

      <div className="text-xs text-slate-600">Data Source: {dataMode === 'db' ? 'Database' : 'In-Memory (dev)'}
      </div>

      <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 p-2 shadow-sm backdrop-blur-sm">
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
              <li key={e.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-slate-600">{new Date(e.date).toLocaleDateString()} • {e.location}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{e.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(e)}>Edit</Button>
                    <Button variant="outline" onClick={() => { if (confirm('Delete this event?')) removeEvent(e.id) }}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
            {evsFiltered.length === 0 && (
              <li className="text-sm text-slate-600">No events match your search.</li>
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
              <li key={j.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{j.title}</div>
                    <div className="text-sm text-slate-600">{j.company} • {j.location}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{j.link}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openJobEdit(j)}>Edit</Button>
                    <Button variant="outline" onClick={() => { if (confirm('Delete this job?')) removeJob(j.id) }}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
            {jobsFiltered.length === 0 && (
              <li className="text-sm text-slate-600">No jobs match your search.</li>
            )}
          </ul>
        </Card>
      )}

      {tab === 'announcements' && (
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
      )}

      {tab === 'reports' && (
        <Card className="p-6">
          <div className="text-xl font-semibold">Support Tickets</div>
          {reportsLoading ? (
            <div className="mt-4 text-sm text-slate-500">Loading tickets...</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
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
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-500">No tickets found.</td></tr>
                  )}
                  {reports.map(r => (
                    <tr key={r._id} className="border-t border-slate-200">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.createdBy?.name || 'Local User'}</div>
                        <div className="text-xs text-slate-500">{r.createdBy?.email}</div>
                      </td>
                      <td className="px-3 py-2 font-medium">{r.title}</td>
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <span className={"px-2 py-1 rounded-full text-xs font-medium " + (r.status === 'Resolved' ? 'bg-green-100 text-green-700' : r.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex items-center gap-2">
                        {r.status === 'Open' && (
                          <>
                            <Button variant="outline" onClick={() => handleUpdateTicket(r._id, 'Resolved')}>Resolve</Button>
                            <Button variant="outline" className="text-red-600 hover:ring-red-600" onClick={() => handleUpdateTicket(r._id, 'Rejected')}>Reject</Button>
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

      <Modal open={evOpen} onClose={() => setEvOpen(false)} title={editId == null ? 'Add Event' : 'Edit Event'} titleClassName="text-white text-xl">
        <div className="space-y-5 pt-3">
          {evError && <div className="rounded-md bg-red-500/20 text-red-200 px-4 py-3 text-sm font-medium border border-red-500/30">{evError}</div>}
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Event Title</label>
            <Input value={evTitle} onChange={e=>setEvTitle(e.target.value)} placeholder="e.g. Annual Alumni Meetup 2025" className="w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Date</label>
              <input type="date" value={evDate} onChange={e=>setEvDate(e.target.value)} className="w-full rounded-full bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-shadow" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Location</label>
              <Input value={evLocation} onChange={e=>setEvLocation(e.target.value)} placeholder="e.g. Main Auditorium" className="w-full" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Description</label>
             <textarea value={evDesc} onChange={e=>setEvDesc(e.target.value)} rows={4} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-shadow" placeholder="Share details about the event..." />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outlineWhite" className="!ring-1 !ring-slate-600 !text-slate-300 hover:!bg-slate-800 hover:!text-white" onClick={() => setEvOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveEvent} disabled={evSaving}>{evSaving ? 'Saving…' : 'Save Event'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={jobOpen} onClose={() => setJobOpen(false)} title={jobEditId == null ? 'Add Job' : 'Edit Job'} titleClassName="text-white text-xl">
        <div className="space-y-5 pt-3">
          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Job Title</label>
             <Input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" className="w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Company</label>
              <Input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="e.g. Google" className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Location</label>
              <Input value={jobLocation} onChange={e=>setJobLocation(e.target.value)} placeholder="e.g. Remote / New York" className="w-full" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Application Link</label>
             <Input value={jobLink} onChange={e=>setJobLink(e.target.value)} placeholder="https://careers.company.com/..." className="w-full" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outlineWhite" className="!ring-1 !ring-slate-600 !text-slate-300 hover:!bg-slate-800 hover:!text-white" onClick={() => setJobOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveJob}>Save Job</Button>
          </div>
        </div>
      </Modal>
    <Modal open={admOpen} onClose={() => setAdmOpen(false)} title="Create Admin Account" titleClassName="text-white text-xl">
        <div className="space-y-4 pt-4">
          {admStatus && <div className={(admStatus.includes('Success') ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200') + ' border px-3 py-2 rounded-md text-sm'}>{admStatus}</div>}
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Full Name</label>
            <Input value={admName} onChange={e => setAdmName(e.target.value)} placeholder="Admin Name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Email Address</label>
            <Input value={admEmail} onChange={e => setAdmEmail(e.target.value)} placeholder="admin@example.com" type="email" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Password</label>
            <Input value={admPass} onChange={e => setAdmPass(e.target.value)} placeholder="Top secret password" type="password" />
          </div>
          
          <Button variant="primary" onClick={handleCreateAdmin} disabled={admLoading} className="w-full mt-2">
            {admLoading ? 'Creating...' : 'Create Admin'}
          </Button>
        </div>
      </Modal>
    </section>
  )
}

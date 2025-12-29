import React, { useEffect, useState } from 'react'
import { IconCard, Modal, Input, Button } from '../../ui'
import { getJobs, createJob } from '../../api'

type Job = { id: number | string; title: string; company: string; location: string; link: string }

export default function Jobs({ role }: { role?: 'student' | 'admin' | 'alumni' | null }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Job Posting State
  const [postOpen, setPostOpen] = useState(false)
  const [jTitle, setJTitle] = useState('')
  const [jCompany, setJCompany] = useState('')
  const [jLoc, setJLoc] = useState('')
  const [jLink, setJLink] = useState('')
  const [posting, setPosting] = useState(false)

  const fetchJobs = async () => {
    setLoading(true); setError('')
    try {
      const data: Job[] = await getJobs()
      setJobs(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handlePostJob = async () => {
    if (!jTitle || !jCompany || !jLoc) return
    setPosting(true)
    try {
      await createJob({ title: jTitle, company: jCompany, location: jLoc, link: jLink || '#' })
      setPostOpen(false)
      setJTitle(''); setJCompany(''); setJLoc(''); setJLink('')
      fetchJobs() // Refresh list
    } catch (e) {
      alert('Failed to post job')
    } finally {
      setPosting(false)
    }
  }

  const ICON = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Jobs & Opportunities</h1>
        {role === 'alumni' && (
          <button 
            onClick={() => setPostOpen(true)}
            className="bg-[#0B4C72] text-white px-4 py-2 rounded-lg hover:bg-[#093d5c] transition-colors font-medium shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Post a Job
          </button>
        )}
      </div>

      {error && <div className="text-sm text-red-700 mb-4">{error}</div>}
      {loading && <div className="text-sm text-slate-600">Loading…</div>}
      
      {!loading && jobs.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-100">
          No job postings available yet.
        </div>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {jobs.map(j => (
          <li key={j.id}>
            <IconCard title={j.title} src={ICON} />
            <div className="mt-2 px-1">
              <div className="text-sm font-medium text-slate-700">{j.company}</div>
              <div className="text-xs text-slate-500">{j.location}</div>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={postOpen} onClose={() => setPostOpen(false)} title="Post a Job Opportunity">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
            <Input value={jTitle} onChange={e => setJTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            <Input value={jCompany} onChange={e => setJCompany(e.target.value)} placeholder="e.g. Tech Corp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <Input value={jLoc} onChange={e => setJLoc(e.target.value)} placeholder="e.g. Remote / Islamabad" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Application Link (Optional)</label>
            <Input value={jLink} onChange={e => setJLink(e.target.value)} placeholder="https://..." />
          </div>
          <div className="pt-2">
            <Button onClick={handlePostJob} disabled={posting || !jTitle || !jCompany || !jLoc} className="w-full justify-center">
              {posting ? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

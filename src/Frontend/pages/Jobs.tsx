import React, { useEffect, useState } from 'react'
import { IconCard } from '../../ui'
import { getJobs } from '../../api'

type Job = { id: number | string; title: string; company: string; location: string; link: string }

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let stop = false
    ;(async () => {
      setLoading(true); setError('')
      try {
        const data: Job[] = await getJobs()
        if (!stop) {
          // Filter out dataset jobs (which have numeric IDs) and keep only DB jobs (string IDs)
          setJobs(data.filter(j => typeof j.id === 'string'))
        }
      } catch (e: any) {
        if (!stop) setError(e?.message || 'Failed to load jobs')
      } finally {
        if (!stop) setLoading(false)
      }
    })()
    return () => { stop = true }
  }, [])
  const ICON = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'
  return (
    <section>
      {error && <div className="text-sm text-red-700">{error}</div>}
      {loading && <div className="text-sm text-slate-600">Loading…</div>}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {jobs.map(j => (
          <li key={j.id}>
            <IconCard title={j.title} src={ICON} />
          </li>
        ))}
      </ul>
    </section>
  )
}

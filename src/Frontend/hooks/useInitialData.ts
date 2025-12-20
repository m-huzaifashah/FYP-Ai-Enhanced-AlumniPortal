import React from 'react'
import { getServices, getAlumni, getJobs, getEvents, getHealth } from '../../api'

export type Service = { id: string; title: string; description: string; category: 'Career' | 'Community' | 'Benefits' | 'Support' }
export type Alumni = { id: number; name: string; batch: number; department: string; location: string; role: string; company: string }
export type Event = { id: number | string; title: string; date: string; location: string; description: string }
export type Job = { id: number | string; title: string; company: string; location: string; link: string }

export function useInitialData() {
  const [services, setServices] = React.useState<Service[]>([])
  const [alumni, setAlumni] = React.useState<Alumni[]>([])
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [events, setEvents] = React.useState<Event[]>([])
  const [apiMode, setApiMode] = React.useState<'db' | 'memory'>('memory')

  React.useEffect(() => {
    let stop = false
    ;(async () => {
      try {
        const [svc, alm, j, ev, health] = await Promise.all([
          getServices().catch(()=>[]),
          getAlumni().catch(()=>[]),
          getJobs().catch(()=>[]),
          getEvents().catch(()=>[]),
          getHealth().catch(()=>({ mode: 'memory' })) as Promise<any>,
        ])
        if (!stop) {
          setServices(svc as Service[])
          setAlumni(alm as Alumni[])
          setJobs(j as Job[])
          setEvents(ev as Event[])
          const m = (health as any)?.mode === 'db' ? 'db' : 'memory'
          setApiMode(m as any)
        }
      } catch {}
    })()
    return () => { stop = true }
  }, [])

  React.useEffect(() => {
    const handler = () => { getEvents().then((ev)=>setEvents(ev)).catch(()=>{}) }
    // @ts-ignore
    window.addEventListener('eventsUpdated', handler)
    return () => {
      // @ts-ignore
      window.removeEventListener('eventsUpdated', handler)
    }
  }, [])

  return { services, alumni, jobs, events, apiMode, setEvents }
}

import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, Modal } from '../../ui'
import { getMentors } from '../../api'

type Mentor = { id: number; name: string; title: string; company: string; city: string; skills: string[]; type: 'mentor' | 'mentee' }

export default function Mentorship() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skill, setSkill] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [target, setTarget] = useState<Mentor | null>(null)
  const [goal, setGoal] = useState('')
  const [message, setMessage] = useState('')
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgTarget, setMsgTarget] = useState<Mentor | null>(null)
  const [msgText, setMsgText] = useState('')

  const filtered = useMemo(() => {
    const s = skill.trim().toLowerCase()
    if (!s) return mentors
    return mentors.filter(m => m.skills.some(k => k.toLowerCase().includes(s)) || m.title.toLowerCase().includes(s) || m.company.toLowerCase().includes(s))
  }, [mentors, skill])

  useEffect(() => {
    let stop = false
    ;(async () => {
      setLoading(true); setError('')
      try {
        const data: Mentor[] = await getMentors()
        if (!stop) setMentors(data)
      } catch (e: any) {
        if (!stop) setError(e?.message || 'Failed to load mentors')
      } finally {
        if (!stop) setLoading(false)
      }
    })()
    return () => { stop = true }
  }, [])

  const suggestions = useMemo(() => filtered.slice(0, 3), [filtered])

  return (
    <section className="space-y-8">
      {error && <div className="mx-auto max-w-7xl text-sm text-red-700">{error}</div>}
      {loading && <div className="mx-auto max-w-7xl text-sm text-slate-600">Loading…</div>}
      <div className="text-center">
        <div className="text-3xl font-bold">Mentorship</div>
        <div className="mt-2 text-slate-600">Find mentors by skill, browse tags, and request guidance.</div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="Find by skill (e.g., React, Data)" className="flex-1" />
          <Button variant="outline" onClick={() => setRequestOpen(true)}>Request Mentor</Button>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Browse Mentors</div>
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {filtered.map(m => (
              <li key={m.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-full bg-[#1669bb] text-white grid place-items-center text-lg font-bold shadow-sm ring-4 ring-slate-50">
                    {m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-slate-900 truncate">{m.name}</div>
                    <div className="text-sm font-medium text-[#1669bb] truncate">{m.title}</div>
                    <div className="text-sm text-slate-500 truncate">{m.company} • {m.city}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[m.type, ...m.skills].slice(0,4).map((t,i)=> (
                        <span key={i} className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setMsgTarget(m); setMsgOpen(true) }}>Message</Button>
                      <Button variant="brand" className="flex-1 shadow-md" onClick={() => { setTarget(m); setRequestOpen(true) }}>Request Mentor</Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="text-xl font-semibold">Match Suggestions</div>
          <div className="mt-2 text-sm text-slate-600">Based on your skill search and tags.</div>
          <ul className="mt-4 space-y-3">
            {suggestions.map(s => (
              <li key={s.id} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-slate-600">{s.title}</div>
                </div>
                <Button variant="primary" onClick={() => { setTarget(s); setRequestOpen(true) }}>Request</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title={target ? `Request Mentor: ${target.name}` : 'Request Mentor'}>
        <div className="space-y-3">
          <Input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="What do you want to achieve?" />
          <Input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Your message" />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Back</Button>
            <Button variant="primary" onClick={() => {
              const ok = goal.trim().length >= 4 && message.trim().length >= 4
              if (!ok) return
              setRequestOpen(false)
              setGoal('')
              setMessage('')
              setTarget(null)
            }}>Send Request</Button>
          </div>
        </div>
      </Modal>

      <Modal open={msgOpen} onClose={() => setMsgOpen(false)} title={msgTarget ? `Message: ${msgTarget.name}` : 'Send Message'}>
        <div className="space-y-3">
          <Input value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Write a concise message" />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setMsgOpen(false)}>Back</Button>
            <Button variant="primary" onClick={() => {
              const ok = msgText.trim().length >= 4
              if (!ok) return
              setMsgOpen(false)
              setMsgText('')
              setMsgTarget(null)
            }}>Send</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

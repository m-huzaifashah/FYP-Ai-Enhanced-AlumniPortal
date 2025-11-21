import React from 'react'
import { Reveal, Button } from '../ui'

export default function Hero({ onNavigate }: { onNavigate: (route: 'contact' | 'events') => void }) {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 ring-1 ring-white/30 shadow-lg">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[1280px] -translate-x-1/2 rounded-[120px] bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-120px] h-[360px] w-[360px] rounded-full bg-white/20 blur-3xl" />
      <div className="px-8 py-20 text-center text-white">
        <Reveal>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Build Meaningful Connections</h1>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-4 max-w-3xl text-white/80">A premium alumni experience for careers, mentorship, and events—powered by a modern university brand.</p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button variant="primary" onClick={() => onNavigate('contact')}>Get Started</Button>
            <Button variant="outline" onClick={() => onNavigate('events')}>Browse Events</Button>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <ul className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            {['Jobs','Mentorship','Events','Directory'].map((t,i)=> (
              <li key={i} className="rounded-full bg-white/70 ring-1 ring-white/60 px-3 py-1 text-xs text-slate-800 shadow-sm">{t}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  )
}

import React from 'react'
import { Reveal, Counter } from '../ui'

export default function Stats() {
  return (
    <div>
      <div className="text-2xl font-bold">Stats</div>
      <p className="mt-2 text-slate-600">A connected alumni network creating impact across departments and sessions.</p>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Reveal delay={0}>
          <div className="rounded-2xl backdrop-blur-sm bg-white/60 p-6 text-center ring-1 ring-white/60 shadow-sm">
            <div className="text-3xl font-extrabold text-slate-900"><Counter to={3373} duration={1500} /></div>
            <div className="text-xs text-slate-600">Members</div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="rounded-2xl backdrop-blur-sm bg-white/60 p-6 text-center ring-1 ring-white/60 shadow-sm">
            <div className="text-3xl font-extrabold text-slate-900"><Counter to={15} duration={900} /></div>
            <div className="text-xs text-slate-600">Departments</div>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="rounded-2xl backdrop-blur-sm bg-white/60 p-6 text-center ring-1 ring-white/60 shadow-sm">
            <div className="text-3xl font-extrabold text-slate-900"><Counter to={6} duration={700} /></div>
            <div className="text-xs text-slate-600">Sessions</div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

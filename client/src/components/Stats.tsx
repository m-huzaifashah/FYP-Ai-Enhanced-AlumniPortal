import React from 'react'
import { Reveal, Counter } from '../ui'

export default function Stats() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-primary tracking-tight">Community Impact</h2>
        <p className="text-sm text-primary/70 leading-relaxed max-w-md">Our growing alumni network is making strides across departments and sessions.</p>
      </div>
      
      <div className="grid grid-cols-3 gap-3 md:gap-4 h-full">
        <Reveal delay={0}>
          <div className="h-full rounded-2xl bg-white p-6 md:p-8 text-center ring-1 ring-secondary shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-default group border border-slate-100">
            <div className="text-3xl md:text-5xl font-black text-[#0B4C72] drop-shadow-sm"><Counter to={5381} duration={2} /></div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary/60 mt-4 group-hover:text-primary transition-colors">Member</div>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="h-full rounded-2xl bg-white p-6 md:p-8 text-center ring-1 ring-secondary shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-default group border border-slate-100">
            <div className="text-3xl md:text-5xl font-black text-[#0B4C72] drop-shadow-sm"><Counter to={25} duration={1.2} /></div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary/60 mt-4 group-hover:text-primary transition-colors">Department's</div>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="h-full rounded-2xl bg-white p-6 md:p-8 text-center ring-1 ring-secondary shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-default group border border-slate-100">
            <div className="text-3xl md:text-5xl font-black text-[#0B4C72] drop-shadow-sm"><Counter to={6} duration={0.8} /></div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary/60 mt-4 group-hover:text-primary transition-colors">Sessions</div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

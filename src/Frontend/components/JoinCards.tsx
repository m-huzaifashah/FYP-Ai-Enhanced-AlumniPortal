import React from 'react'
import { Reveal, IconCard } from '../../ui'

export default function JoinCards({ items, onNavigate, image }: { items: { title: string; go: string; desc?: string; image?: string }[]; onNavigate: (route: string) => void; image: string }) {
  return (
    <div className="rounded-3xl bg-[#FFFBF0] px-6 py-10 md:px-10 md:py-14" style={{ backgroundImage: 'radial-gradient(24rem_24rem at 20% 10%, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.0) 60%), radial-gradient(20rem_20rem at 80% 60%, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.0) 55%)' }}>
      <div className="text-center">
        <Reveal delay={120}>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Why you should join us</h2>
        </Reveal>
      </div>
      <div className="mt-8 grid gap-6 md:gap-8 md:grid-cols-3">
        {items.map((c,i)=> (
          <Reveal key={i} delay={i*120}>
            <div className="flex h-full flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md cursor-pointer" onClick={() => onNavigate(c.go)}>
              <div className="mb-6 h-48 w-full overflow-hidden rounded-xl">
                <img 
                  src={c.image || image} 
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{c.title}</h3>
              {c.desc && <p className="mt-4 text-sm leading-relaxed text-slate-600">{c.desc}</p>}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

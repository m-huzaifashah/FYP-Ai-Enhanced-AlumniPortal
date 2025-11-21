import React from 'react'
import { Reveal, IconCard } from '../ui'

export default function JoinCards({ items, onNavigate, image }: { items: { title: string; go: string; desc?: string }[]; onNavigate: (route: string) => void; image: string }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Reveal>
          <div className="inline-block rounded-full bg-white/70 px-4 py-1 text-xs ring-1 ring-white/60 shadow-sm">Join With Community</div>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">Why you should join us</h2>
        </Reveal>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((c,i)=> (
          <Reveal key={i} delay={i*120}>
            <IconCard title={c.title} src={image} description={c.desc} onClick={() => onNavigate(c.go)} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

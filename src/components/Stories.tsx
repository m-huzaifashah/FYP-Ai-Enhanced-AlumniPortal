import React from 'react'
import { Reveal } from '../ui'

export default function Stories({ stories, image }: { stories: { date: string; title: string }[]; image: string }) {
  return (
    <div>
      <Reveal>
        <div className="text-2xl font-bold">Our Stories</div>
      </Reveal>
      <ul className="mt-4 space-y-4">
        {stories.map((s,i)=> (
          <Reveal key={i} delay={i*120}>
            <li className="grid grid-cols-[64px_1fr] items-center gap-4 rounded-xl bg-white/70 ring-1 ring-slate-200 p-3">
              <img
                src={image}
                alt="Story"
                className="h-16 w-16 rounded-lg object-contain bg-white"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/96x96/EFF6FF/0B4C72?text=Story' }}
              />
              <div>
                <div className="text-xs text-slate-500">{s.date}</div>
                <div className="font-semibold">{s.title}</div>
                <a href="#" className="text-sm text-blue-700">Know More →</a>
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  )
}


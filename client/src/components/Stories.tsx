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
            <li className="grid grid-cols-[64px_1fr] items-center gap-4 rounded-xl bg-white ring-1 ring-secondary p-3 hover:shadow-md transition-shadow">
              <img
                src={image}
                alt="Story"
                className="h-16 w-16 rounded-lg object-contain bg-light-section p-1"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/96x96/EFF6FF/0B4C72?text=Story' }}
              />
              <div>
                <div className="text-xs text-primary font-medium">{s.date}</div>
                <div className="font-bold text-primary line-clamp-1">{s.title}</div>
                <a href="#" className="text-sm font-medium text-primary hover:underline mt-0.5 inline-block">Know More →</a>
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  )
}


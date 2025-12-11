import React from 'react'
import { Reveal, Button } from '../ui'

export default function Hero({ onNavigate, image = '/hero.jpg' }: { onNavigate: (route: 'contact' | 'events') => void; image?: string }) {
  return (
    <div className="relative group rounded-3xl overflow-hidden ring-1 ring-white/30 shadow-lg hover:shadow-xl h-[500px] transition-transform duration-700">
      <img
        src={image}
        alt="Hero"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.03]"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/1280x520/0B4C72/FFFFFF?text=Riphah' }}
      />
      <div className="absolute inset-0 bg-pan opacity-70 mix-blend-multiply" />
      <div className="absolute inset-0 grid place-items-center px-8 text-center text-white">
        <div>
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight transition-transform duration-700 ease-out group-hover:scale-[1.03] group-hover:-translate-y-[2px]">Build Meaningful Connections</h1>
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
        </div>
      </div>
    </div>
  )
}

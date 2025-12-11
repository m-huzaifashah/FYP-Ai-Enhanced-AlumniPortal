import React, { useEffect, useMemo, useState } from 'react'
import { Reveal } from '../ui'
import Hero from '../components/Hero'
import JoinCards from '../components/JoinCards'
import Stories from '../components/Stories'
import Stats from '../components/Stats'

type Featured = { id: number; name: string; role: string; company: string }

export default function Dashboard({ onNavigate, featured }: { onNavigate: (route: 'contact' | 'events' | 'directory') => void; featured: Featured[] }) {
  const RIU_LOGO = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'
  const TESTIMONIALS = useMemo(() => ([
    { quote: 'The alumni network opened doors I didn’t know existed.', author: 'Aisha Khan', role: 'Software Engineer, TechNest' },
    { quote: 'Mentorship here gave me confidence to change careers.', author: 'Bilal Ahmed', role: 'Data Analyst, MarketIQ' },
    { quote: 'Events are well-curated and helped me reconnect.', author: 'Nida Raza', role: 'Product Designer, AutoForm' },
  ]), [])
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [TESTIMONIALS.length])
  return (
    <section className="space-y-12">
      <Hero onNavigate={onNavigate} image="/hero.jpg" />


      <JoinCards
        items={[
          { title: 'Attend Events', go: 'events', desc: 'Stay connected with exclusive gatherings, workshops, and reunions.' },
          { title: 'Advance Your Career', go: 'jobs', desc: 'Access resources, events, and a network to grow professionally.' },
          { title: 'Reconnect your Friend', go: 'directory', desc: 'Find classmates and relive memories with your alumni network.' },
        ]}
        onNavigate={(r) => onNavigate(r as any)}
        image={RIU_LOGO}
      />

      <div className="grid gap-8">
        <Reveal>
          <div className="rounded-2xl bg-white p-6 text-slate-900">
            <div className="text-2xl font-bold">About Riphah</div>
            <ul className="mt-4 space-y-3 text-sm">
              <li>Riphah International University, Islamabad is a private university, chartered by the Federal Government of Pakistan in 2002.</li>

              <li>The University was established with a view to produce professionals with Islamic moral and ethical values. It is sponsored by Islamic International Medical College Trust (IIMCT), a not-for-profit educational trust established in 1995.</li>
              <li>Riphah International University, Islamabad was included in "W Category" universities by the Higher Education Commission (HEC) of Pakistan in 2005 and was later included in the top five universities in the private sector, qualifying to receive research grants from the Government of Pakistan through the HEC. Subsequently, Riphah university ranked in the sixth position among private and public sector national universities of medium size with a quality score of 9.70 on the basis of quality assurance and research output criteria set by the HEC. Further, the Quality Enhancement Cell of the University was given first position among the private sector "W Category" universities of Pakistan according to the score card formulated by the HEC. Riphah was the first university in Pakistan to be certified under ISO 9001:2008 Standard by the UK based Lloyd's Register, one of the top five global independent risk management and safety assurance organizations.</li>
            </ul>
          </div>
        </Reveal>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Stories stories={[{ date: 'May 22, 2025', title: 'ABC test' }, { date: 'Dec 31, 2024', title: 'Engineer Nabeeha Malik' }]} image={RIU_LOGO} />
        <Reveal>
          <Stats />
        </Reveal>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Reveal>
          <div className="rounded-2xl bg-white p-6 text-slate-900">
            <div className="text-2xl font-bold">What Alumni Say</div>
            <div className="mt-4 relative h-40">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={(i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none') + ' absolute inset-0 transition-opacity duration-700'}>
                  <div className="text-lg leading-relaxed">“{t.quote}”</div>
                  <div className="mt-3 text-sm text-slate-600">{t.author}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              ))}
              <div className="absolute bottom-0 left-0 flex items-center gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={(i === idx ? 'bg-blue-600' : 'bg-slate-300') + ' h-2 w-2 rounded-full'} />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="rounded-2xl bg-white p-6 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Featured Alumni</div>
              <button className="rounded-full bg-white ring-1 ring-slate-200 px-3 py-1 text-sm" onClick={() => onNavigate('directory')}>View All</button>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {featured.map(a => (
                <li key={a.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 grid place-items-center text-white text-xs font-semibold">
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-slate-600">{a.role} • {a.company}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

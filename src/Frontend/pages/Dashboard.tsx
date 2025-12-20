import React, { useEffect, useMemo, useState } from 'react'
import { Reveal } from '../../ui'
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


      <div id="why-join-us">
        <JoinCards
          items={[
            {
              title: 'Attend Events',
              go: 'events',
              image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=600',
              desc: 'Stay connected with your alumni community by attending exclusive events designed to inspire, network, and celebrate shared achievements. From reunions and workshops to guest lectures and social gatherings, there’s always something exciting happening. Don’t miss the chance to engage and grow with your fellow alumni!'
            },
            {
              title: 'Advance Your Career',
              go: 'jobs',
              image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=600',
              desc: 'Take your career to the next level with exclusive resources and opportunities tailored for alumni. Access professional development programs, attend career-focused events, and connect with a network of successful professionals. Empower your journey with guidance, support, and tools to achieve your goals.'
            },
            {
              title: 'Reconnect your Friend',
              go: 'directory',
              image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600',
              desc: 'Rekindle old friendships and create new memories with your alumni network. Stay in touch with former classmates, share your experiences, and relive cherished moments through our dedicated platform. Strengthen your bonds and celebrate the connections that last a lifetime!'
            },
          ]}
          onNavigate={(r) => onNavigate(r as any)}
          image={RIU_LOGO}
        />
      </div>

      <div id="about" className="mt-20">
        <Reveal>
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 md:grid md:grid-cols-2">
            <div className="relative h-64 w-full bg-[#0B4C72] md:h-full flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-center bg-cover" style={{ backgroundImage: `url(${RIU_LOGO})`, filter: 'grayscale(100%)' }} />
               <div className="relative z-10 p-8 text-center">
                  <img src={RIU_LOGO} alt="Riphah Logo" className="w-48 h-auto mx-auto brightness-0 invert opacity-90" />
                  <div className="mt-4 text-white/80 text-lg font-serif italic">Islamic Ethical Values</div>
               </div>
            </div>
            <div className="p-8 md:p-12">
              <div className="text-sm font-bold uppercase tracking-wider text-[#0B4C72]">About Us</div>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">About Riphah</h2>
              <div className="mt-8 space-y-6">
                {[
                  "Alumni Association provides and supports alumni programs and services, facilitates communication with alumni, and seeks to strengthen alumni bonds of fellowship, professional association and university affiliation.",
                  "Connect alumni with mentors or coaches who can offer them guidance, advice, or feedback on their personal or professional goals. They can also help them expand their network, explore new opportunities, or overcome challenges.",
                  "The Alumni Association leverages the resources, talents, and initiatives of alumni and friends to advise, guide, advocate for and support the Association and the university in achieving their respective missions and goals."
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <svg className="mt-1 h-6 w-6 flex-shrink-0 text-[#0B4C72]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div id="stories">
          <Stories stories={[{ date: 'May 22, 2025', title: 'ABC test' }, { date: 'Dec 31, 2024', title: 'Engineer Nabeeha Malik' }]} image={RIU_LOGO} />
        </div>
        <Reveal>
          <Stats />
        </Reveal>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Reveal>
          <div id="reviews" className="rounded-2xl bg-white p-6 text-slate-900">
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

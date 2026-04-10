import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Reveal } from '../ui'
import Hero from '../components/Hero'
import JoinCards from '../components/JoinCards'
import Stories from '../components/Stories'
import Stats from '../components/Stats'

type Featured = { id: number; name: string; role: string; company: string }

export default function Dashboard({ onNavigate, featured }: { onNavigate: (route: 'contact' | 'events' | 'directory') => void; featured: Featured[] }) {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location])

  const RIU_LOGO = '/logo.png'
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
    <section className="space-y-32 pb-32">
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

      <div id="about" className="mt-24">
        <Reveal>
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-secondary md:grid md:grid-cols-2">
            <div className="relative h-64 w-full bg-gradient-to-br from-primary to-primary/95 md:h-full flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-15 bg-center bg-cover mix-blend-overlay" style={{ backgroundImage: `url(${RIU_LOGO})`, filter: 'grayscale(100%)' }} />
               <div className="relative z-10 p-8 text-center flex flex-col items-center">
                  <img src={RIU_LOGO} alt="Riphah Logo" className="w-40 h-auto mx-auto drop-shadow-2xl" />
                  <div className="mt-6 text-white/90 text-lg font-serif italic tracking-wide">Islamic Ethical Values</div>
               </div>
            </div>
            <div className="p-8 md:p-12">
              <div className="text-sm font-bold uppercase tracking-wider text-primary">About Us</div>
              <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">About Riphah</h2>
              <div className="mt-8 space-y-6">
                {[
                  "Alumni Association provides and supports alumni programs and services, facilitates communication with alumni, and seeks to strengthen alumni bonds of fellowship, professional association and university affiliation.",
                  "Connect alumni with mentors or coaches who can offer them guidance, advice, or feedback on their personal or professional goals. They can also help them expand their network, explore new opportunities, or overcome challenges.",
                  "The Alumni Association leverages the resources, talents, and initiatives of alumni and friends to advise, guide, advocate for and support the Association and the university in achieving their respective missions and goals."
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <svg className="mt-1 h-6 w-6 flex-shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-primary leading-relaxed text-sm md:text-base">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div id="stories" className="h-full">
           <Reveal>
            <div className="h-full rounded-3xl bg-white p-8 shadow-lg ring-1 ring-secondary">
              <Stories stories={[{ date: 'May 22, 2025', title: 'ABC test' }, { date: 'Dec 31, 2024', title: 'Engineer Nabeeha Malik' }]} image={RIU_LOGO} />
            </div>
          </Reveal>
        </div>
        <div className="h-full">
          <Reveal>
            <Stats />
          </Reveal>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Reveal>
          <div id="reviews" className="h-full rounded-3xl bg-white p-8 text-primary shadow-lg ring-1 ring-secondary relative overflow-hidden">
            <div className="text-2xl font-bold relative z-10">What Alumni Say</div>
            <div className="mt-6 relative h-48">
              <span className="absolute -top-10 -left-6 text-9xl text-secondary/40 font-serif leading-none select-none z-0">"</span>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={(i === idx ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none') + ' absolute inset-0 transition-all duration-700 z-10'}>
                  <div className="text-xl md:text-2xl leading-relaxed font-light italic text-primary drop-shadow-sm">“{t.quote}”</div>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md">
                        {t.author[0]}
                    </div>
                    <div>
                        <div className="text-base font-bold text-primary">{t.author}</div>
                        <div className="text-sm text-primary/80 font-medium">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-0 right-0 flex items-center gap-2 z-10">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={(i === idx ? 'bg-accent w-8' : 'bg-secondary w-2 hover:bg-secondary/80') + ' h-2 rounded-full transition-all duration-300'} title="View Testimonial" />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="h-full rounded-3xl bg-white p-8 text-primary shadow-lg ring-1 ring-secondary">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Featured Alumni</div>
              <button className="rounded-full bg-light-section hover:bg-secondary ring-1 ring-secondary px-4 py-2 text-sm font-medium text-primary transition-colors" onClick={() => onNavigate('directory')}>View All</button>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {featured.map(a => (
                <li key={a.id} className="group rounded-xl bg-white/60 ring-1 ring-secondary p-4 shadow-sm hover:shadow-md hover:ring-accent/50 hover:bg-white transition-all backdrop-blur-sm cursor-pointer" onClick={() => onNavigate('directory')}>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 grid place-items-center text-white text-base font-bold shadow-md group-hover:scale-110 group-hover:shadow-lg transition-transform">
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-primary">{a.name}</div>
                      <div className="text-xs text-primary/80 mt-0.5">{a.role}</div>
                      <div className="text-xs text-accent font-medium mt-1">{a.company}</div>
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

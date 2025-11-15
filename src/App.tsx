import React, { useEffect, useMemo, useRef, useState } from 'react'

type Route = 'dashboard' | 'services' | 'service' | 'directory' | 'events' | 'jobs' | 'contact'

type Service = { id: string; title: string; description: string; category: 'Career' | 'Community' | 'Benefits' | 'Support' }
type Alumni = { id: number; name: string; batch: number; department: string; location: string; role: string; company: string }
type Event = { id: number; title: string; date: string; location: string; description: string }
type Job = { id: number; title: string; company: string; location: string; link: string }

const SERVICES: Service[] = [
  { id: 'login', title: 'Login/Registration', description: 'Create your alumni account and sign in.', category: 'Support' },
  { id: 'give-back', title: 'Give Back', description: 'Support scholarships and campus initiatives.', category: 'Community' },
  { id: 'spotlight', title: 'Alumni Spotlight', description: 'Celebrate achievements of Riphah alumni.', category: 'Community' },
  { id: 'jobs', title: 'Job Portal', description: 'Discover jobs and refer opportunities.', category: 'Career' },
  { id: 'snapshot', title: 'Alumni Snapshot', description: 'Explore alumni distribution and stats.', category: 'Benefits' },
  { id: 'events', title: 'Alumni Events', description: 'Stay updated with meetups and talks.', category: 'Community' },
  { id: 'advantage', title: 'Alumni Advantage', description: 'Exclusive benefits and partnerships.', category: 'Benefits' },
  { id: 'email', title: 'Email', description: 'Official alumni email resources.', category: 'Support' },
  { id: 'network', title: 'Alumni Network', description: 'Join Riphah alumni communities.', category: 'Community' },
  { id: 'faqs', title: 'FAQs', description: 'Find answers to common questions.', category: 'Support' },
  { id: 'contact', title: 'Contact Us', description: 'Reach the Alumni Relations team.', category: 'Support' },
  { id: 'message-vc', title: 'Message the Vice Chancellor', description: 'Share feedback directly to VC.', category: 'Support' }
]

const ALUMNI: Alumni[] = [
  { id: 1, name: 'Aisha Khan', batch: 2019, department: 'Computer Science', location: 'Karachi', role: 'Software Engineer', company: 'TechNest' },
  { id: 2, name: 'Omar Malik', batch: 2018, department: 'Electrical Engineering', location: 'Lahore', role: 'Project Manager', company: 'GridWorks' },
  { id: 3, name: 'Sara Ahmed', batch: 2020, department: 'Business', location: 'Islamabad', role: 'Analyst', company: 'MarketIQ' },
  { id: 4, name: 'Bilal Hussain', batch: 2017, department: 'Mechanical', location: 'Dubai', role: 'Design Lead', company: 'AutoForm' }
]

const EVENTS: Event[] = [
  { id: 1, title: 'Annual Alumni Meetup', date: '2025-12-10', location: 'Campus Auditorium', description: 'Networking and keynote from notable alumni.' },
  { id: 2, title: 'Tech Talks', date: '2026-01-20', location: 'Innovation Lab', description: 'Talks on AI, Cloud, and Startups.' }
]

const JOBS: Job[] = [
  { id: 1, title: 'Frontend Engineer', company: 'TechNest', location: 'Karachi', link: '#' },
  { id: 2, title: 'Data Analyst', company: 'MarketIQ', location: 'Remote', link: '#' }
]

function Logo() {
  const [useFallback, setUseFallback] = useState(false)
  return (
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-lg bg-white grid place-items-center ring-1 ring-white/30">
        {!useFallback ? (
          <img
            src="https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png"
            alt="Riphah International University"
            className="h-12 w-auto"
            onError={() => setUseFallback(true)}
          />
        ) : (
          <div className="text-[#0B4C72] text-sm font-bold">RIU</div>
        )}
      </div>
      <div className="text-2xl font-semibold">Riphah International University</div>
    </div>
  )
}

function Social() {
  return (
    <div className="flex items-center gap-3">
      <a className="p-2 rounded-full bg-white/10 hover:bg-white/20" href="#" aria-label="Facebook">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-white"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.7c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.5.8-1.5 1.5V12h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z"/></svg>
      </a>
      <a className="p-2 rounded-full bg-white/10 hover:bg-white/20" href="#" aria-label="Twitter">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-white"><path d="M22 5.9a7.4 7.4 0 01-2.1.6 3.7 3.7 0 001.6-2 7.4 7.4 0 01-2.3.9 3.7 3.7 0 00-6.3 3.4A10.5 10.5 0 033 5.2a3.7 3.7 0 001.1 5 3.7 3.7 0 01-1.7-.5v.1a3.7 3.7 0 003 3.6 3.7 3.7 0 01-1.7.1 3.7 3.7 0 003.5 2.6A7.5 7.5 0 034 18.1a10.6 10.6 0 005.7 1.7c6.8 0 10.5-5.6 10.5-10.5v-.5A7.5 7.5 0 0022 5.9z"/></svg>
      </a>
      <a className="p-2 rounded-full bg-white/10 hover:bg-white/20" href="#" aria-label="Instagram">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-white"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm6.5-.8a1.2 1.2 0 110 2.3 1.2 1.2 0 010-2.3z"/></svg>
      </a>
      <a className="p-2 rounded-full bg-white/10 hover:bg-white/20" href="#" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-white"><path d="M4 3a2 2 0 100 4 2 2 0 000-4zM3 8h3v13H3V8zm7 0h3v2h.1a3.3 3.3 0 012.9-1.6c3.1 0 3.7 2 3.7 4.7V21h-3v-6.1c0-1.5 0-3.4-2.1-3.4-2.2 0-2.5 1.6-2.5 3.3V21h-3V8z"/></svg>
      </a>
    </div>
  )
}

function Counter({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      setV(Math.round(p * to))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return <span>{v.toLocaleString()}</span>
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setInView(true)
      })
    }, { threshold })
    obs.observe(node)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView(0.15)
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={(inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4') + ' transition-[opacity,transform] duration-700 ease-out'}
    >
      {children}
    </div>
  )
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState<Route>('dashboard')
  const [query, setQuery] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirm, setSuConfirm] = useState('')
  const [suError, setSuError] = useState('')
  const [suSuccess, setSuSuccess] = useState('')
  const [svcQuery, setSvcQuery] = useState('')
  const [svcDetail, setSvcDetail] = useState<Service | null>(null)
  const [svcCategory, setSvcCategory] = useState<'All' | 'Career' | 'Community' | 'Benefits' | 'Support'>('All')
  const NAV: [Route, string][] = [
    ['dashboard','Dashboard'],
    ['services','Alumni Services'],
    ['directory','Directory'],
    ['events','Events'],
    ['jobs','Jobs'],
    ['contact','Contact']
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALUMNI
    return ALUMNI.filter(a =>
      a.name.toLowerCase().includes(q) ||
      String(a.batch).includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    )
  }, [query])

  const servicesFiltered = useMemo(() => {
    const q = svcQuery.trim().toLowerCase()
    return SERVICES.filter(s => {
      const matchesText = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      const matchesCat = svcCategory === 'All' || s.category === svcCategory
      return matchesText && matchesCat
    })
  }, [svcQuery, svcCategory])

  const openService = (id: string) => {
    if (id === 'login') { setLoginOpen(true); return }
    if (id === 'jobs') { setRoute('jobs'); return }
    if (id === 'events') { setRoute('events'); return }
    if (id === 'contact') { setRoute('contact'); return }
    const s = SERVICES.find(x => x.id === id) || null
    setSvcDetail(s)
    setRoute('service')
  }


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="bg-[#0B4C72] text-white">
        <div className="bg-slate-100 text-slate-900">
          <div className="mx-auto max-w-7xl px-8 h-10 flex items-center justify-between">
            <div className="text-sm">Email : alumni@riphah.edu.pk</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setLoginOpen(true)} className="rounded-md bg-black text-white px-3 py-1 text-sm">Login</button>
              <button onClick={() => setSignupOpen(true)} className="rounded-md bg-[#0B4C72] text-white px-3 py-1 text-sm">Sign Up</button>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-8 h-20 flex items-center justify-between">
          <Logo />
          <Social />
        </div>
        <div className="mx-auto max-w-7xl px-8 h-12 flex items-center gap-2">
          {NAV.map(([r,label]) => (
            <button
              key={r}
              onClick={() => setRoute(r)}
              className={
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm ' +
                (route===r ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10')
              }
            >
              <span>{label}</span>
              <span className="text-xs">›</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        <main className="px-4 py-8">
          {route === 'dashboard' && (
            <section className="space-y-12">
              <div className="rounded-2xl overflow-hidden bg-[#0B4C72] bg-pan">
                <div className="relative px-8 py-20 text-center">
                  <img src="https://placehold.co/1200x500/0B4C72/FFFFFF?text=Riphah+Alumni" alt="Alumni" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  <Reveal>
                    <h1 className="text-4xl md:text-5xl font-extrabold">A New Day At Riphah Meeting the Moment, Together</h1>
                  </Reveal>
                  <Reveal delay={100}>
                    <p className="mx-auto mt-4 max-w-3xl text-slate-200">Embark on a timeless voyage where cherished memories, lifelong friendships, and boundless opportunities converge. Welcome to our vibrant University Alumni Network, where the past meets the present, and the future unfolds before your eyes.</p>
                  </Reveal>
                  <Reveal delay={200}>
                    <div className="mt-8 flex items-center justify-center gap-3">
                      <button onClick={() => setRoute('contact')} className="rounded-md bg-white/90 text-slate-900 px-4 py-2 text-sm font-medium">About Us</button>
                      <button onClick={() => setRoute('events')} className="rounded-md bg-black/30 text-white px-4 py-2 text-sm font-medium">All Events</button>
                    </div>
                  </Reveal>
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <Reveal>
                    <div className="inline-block rounded-full bg-slate-800/50 px-4 py-1 text-sm">Join With Community</div>
                  </Reveal>
                  <Reveal delay={120}>
                    <h2 className="mt-4 text-2xl md:text-3xl font-bold text-white">Why you should join us</h2>
                  </Reveal>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {[{title:'Attend Events',desc:'Stay connected with your alumni community by attending exclusive events designed to inspire, network, and celebrate shared achievements.'},{title:'Advance Your Career',desc:'Take your career to the next level with exclusive resources and opportunities tailored for alumni.'},{title:'Reconnect your Friend',desc:'Rekindle old friendships and create new memories with your alumni network.'}].map((c,i)=> (
                    <Reveal key={i} delay={i*120}>
                      <div className="rounded-2xl border border-slate-800 bg-white/5 p-6 transition-transform duration-300 hover:scale-[1.02]">
                        <img src={`https://placehold.co/600x300/0B4C72/FFFFFF?text=${encodeURIComponent(c.title)}`} alt={c.title} className="h-40 w-full rounded-lg object-cover" />
                        <div className="mt-4 text-xl font-semibold text-white">{c.title}</div>
                        <p className="mt-2 text-sm text-slate-300">{c.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>

              

              <div className="grid gap-8 md:grid-cols-2">
                <Reveal>
                  <div className="rounded-2xl bg-white p-6 text-slate-900">
                    <div className="text-2xl font-bold">About Riphah</div>
                    <ul className="mt-4 space-y-3 text-sm">
                      <li>Alumni Association provides and supports alumni programs and services.</li>
                      <li>Connect alumni with mentors or coaches for guidance and advice.</li>
                      <li>Leverage resources and initiatives of alumni and friends to support the University.</li>
                      <li>Encourages alumni engagement in the life of the university.</li>
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={150}>
                  <div className="rounded-2xl overflow-hidden">
                    <img src="https://placehold.co/800x500/0B4C72/FFFFFF?text=Riphah+Campus" alt="Riphah campus" className="w-full h-64 md:h-full object-cover" />
                  </div>
                </Reveal>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <Reveal>
                    <div className="text-2xl font-bold">Our Stories</div>
                  </Reveal>
                  <ul className="mt-4 space-y-4">
                    {[{date:'May 22, 2025', title:'ABC test'},{date:'Dec 31, 2024', title:'Engineer Nabeeha Malik'}].map((s,i)=> (
                      <Reveal key={i} delay={i*120}>
                        <li className="flex items-center gap-4">
                          <img src="https://placehold.co/96x96/0B4C72/FFFFFF?text=Story" alt="Story" className="h-16 w-16 rounded-lg object-cover" />
                          <div>
                            <div className="text-xs text-slate-300">{s.date}</div>
                            <div className="font-semibold">{s.title}</div>
                            <a href="#" className="text-sm text-[#0B4C72]">Know More →</a>
                          </div>
                        </li>
                      </Reveal>
                    ))}
                  </ul>
                </div>
                <Reveal>
                  <div>
                    <div className="text-2xl font-bold">Your network around the globe.</div>
                    <p className="mt-2 text-slate-300">Connect alumni with mentors or coaches who can offer them guidance, advice, or feedback on their personal or professional goals.</p>
                    <button className="mt-4 rounded-md bg-[#0B4C72] px-4 py-2 text-sm">Join Community</button>
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <Reveal delay={0}>
                        <div className="rounded-xl bg-white/10 p-4 text-center transition-transform duration-300 hover:scale-[1.03]">
                          <div className="text-2xl font-bold"><Counter to={3373} duration={1500} /></div>
                          <div className="text-xs text-slate-300">Member</div>
                        </div>
                      </Reveal>
                      <Reveal delay={100}>
                        <div className="rounded-xl bg-white/10 p-4 text-center transition-transform duration-300 hover:scale-[1.03]">
                          <div className="text-2xl font-bold"><Counter to={15} duration={900} /></div>
                          <div className="text-xs text-slate-300">Departments</div>
                        </div>
                      </Reveal>
                      <Reveal delay={200}>
                        <div className="rounded-xl bg-white/10 p-4 text-center transition-transform duration-300 hover:scale-[1.03]">
                          <div className="text-2xl font-bold"><Counter to={6} duration={700} /></div>
                          <div className="text-xs text-slate-300">Sessions</div>
                        </div>
                      </Reveal>
                    </div>
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          {route === 'services' && (
            <section className="space-y-8">
              <div className="rounded-2xl bg-[#0B4C72] text-white px-6 py-10">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-3xl font-bold">Alumni Services</div>
                    <p className="mt-2 text-slate-200 max-w-2xl">Discover exclusive resources, benefits, and programs designed to empower alumni, strengthen connections, and celebrate achievements.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setLoginOpen(true)} className="rounded-md bg-white/90 text-slate-900 px-4 py-2 text-sm font-medium">Get Started</button>
                    <button onClick={() => setContactOpen(true)} className="rounded-md bg-black/30 text-white px-4 py-2 text-sm font-medium">Contact Us</button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input value={svcQuery} onChange={e=>setSvcQuery(e.target.value)} placeholder="Search services" className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <div className="flex items-center gap-2 overflow-x-auto">
                  {(['All','Career','Community','Benefits','Support'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSvcCategory(cat)}
                      className={(svcCategory===cat ? 'bg-[#0B4C72] text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10') + ' rounded-full px-3 py-1 text-xs'}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {servicesFiltered.map(s => (
                  <li key={s.id} className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-[#0B4C72]">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0B4C72] to-[#D29B2A] grid place-items-center text-white">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a5 5 0 015 5v2h1a3 3 0 013 3v7a3 3 0 01-3 3H6a3 3 0 01-3-3v-7a3 3 0 013-3h1V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v2h6V7a3 3 0 00-3-3z"/></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold">{s.title}</div>
                        <p className="text-sm text-slate-300 mt-1">{s.description}</p>
                        <div className="mt-4 flex items-center gap-2">
                          {s.id==='login' ? (
                            <button onClick={() => openService(s.id)} className="rounded-md bg-[#D29B2A] hover:bg-[#c18c21] px-3 py-2 text-sm text-slate-900 font-medium">Open</button>
                          ) : (
                            <button onClick={() => openService(s.id)} className="rounded-md bg-slate-800 px-3 py-2 text-sm">Learn more</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {route === 'service' && svcDetail && (
            <section className="space-y-6">
              <div className="rounded-2xl overflow-hidden bg-white/5 ring-1 ring-slate-800">
                <img src={`https://placehold.co/1200x400/0B4C72/FFFFFF?text=${encodeURIComponent(svcDetail.title)}`} alt={svcDetail.title} className="w-full h-56 object-cover" />
                <div className="p-6">
                  <div className="text-2xl font-bold text-white">{svcDetail.title}</div>
                  <p className="mt-2 text-slate-300">{svcDetail.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => setRoute('services')} className="rounded-md bg-slate-800 px-3 py-2 text-sm">Back to Services</button>
                    {svcDetail.id==='login' && (
                      <button onClick={() => setLoginOpen(true)} className="rounded-md bg-[#D29B2A] px-3 py-2 text-sm text-slate-900 font-medium">Open Login</button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {route === 'directory' && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, batch, department, location" className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(a => (
                  <li key={a.id} className="group rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-blue-700">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#0B4C72] grid place-items-center text-white text-sm font-medium">
                        {a.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold">{a.name}</div>
                        <div className="text-sm text-slate-300">{a.department} • {a.batch}</div>
                        <div className="text-sm text-slate-400">{a.role} at {a.company}</div>
                      </div>
                      <div className="text-xs text-slate-400">{a.location}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {route === 'events' && (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {EVENTS.map(ev => (
                <div key={ev.id} className="group rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-[#0B4C72]">
                  <div className="text-base font-semibold">{ev.title}</div>
                  <div className="text-sm text-slate-300">{ev.date} • {ev.location}</div>
                  <p className="text-sm text-slate-400 mt-2">{ev.description}</p>
                </div>
              ))}
            </section>
          )}

          {route === 'jobs' && (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {JOBS.map(j => (
                <div key={j.id} className="group rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-[#0B4C72]">
                  <div className="text-base font-semibold">{j.title}</div>
                  <div className="text-sm text-slate-300">{j.company} • {j.location}</div>
                  <a href={j.link} className="mt-2 inline-block text-sm text-[#0B4C72]">Apply</a>
                </div>
              ))}
            </section>
          )}

          {route === 'contact' && (
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                <div className="text-xl font-semibold">Contact Us</div>
                <p className="text-slate-300 mt-2">Riphah International University Alumni Relations</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-800 p-4">
                    <div className="text-sm text-slate-300">Address</div>
                    <div className="text-sm">Sector I-14, Islamabad</div>
                  </div>
                  <div className="rounded-lg bg-slate-800 p-4">
                    <div className="text-sm text-slate-300">Mail Us</div>
                    <div className="text-sm">alumni@riphah.edu.pk</div>
                  </div>
                  <div className="rounded-lg bg-slate-800 p-4">
                    <div className="text-sm text-slate-300">Telephone</div>
                    <div className="text-sm">(+92) 51 111 RIPHAH</div>
                  </div>
                </div>
                <button onClick={() => setContactOpen(true)} className="mt-4 rounded-md bg-[#0B4C72] px-3 py-2 text-sm">Send a Message</button>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <iframe title="Location Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-[320px]" src="https://www.google.com/maps?q=Riphah+International+University+Islamabad&output=embed" />
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-400">© {new Date().getFullYear()} Riphah Alumni Network</div>
      </footer>

      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="Login">
        <div className="space-y-3">
          {loginError && <div className="rounded-md bg-red-900/40 text-red-200 text-sm px-3 py-2">{loginError}</div>}
          <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Email" />
          <input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Password" type="password" />
          <button onClick={() => {
            const ok = /.+@.+\..+/.test(loginEmail) && loginPassword.length >= 6
            if (!ok) { setLoginError('Enter a valid email and 6+ char password'); return }
            setLoginError('')
            setLoginOpen(false)
          }} className="w-full rounded-md bg-[#D29B2A] hover:bg-[#c18c21] px-4 py-2 text-sm font-medium text-slate-900">Sign In</button>
          <div className="text-xs text-slate-400 text-center">No account? <button onClick={() => { setLoginOpen(false); setSignupOpen(true) }} className="underline">Sign Up</button></div>
        </div>
      </Modal>

      <Modal open={signupOpen} onClose={() => setSignupOpen(false)} title="Sign Up">
        <div className="space-y-3">
          {suError && <div className="rounded-md bg-red-900/40 text-red-200 text-sm px-3 py-2">{suError}</div>}
          {suSuccess && <div className="rounded-md bg-green-900/30 text-green-200 text-sm px-3 py-2">{suSuccess}</div>}
          <input value={suName} onChange={e=>setSuName(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Full Name" />
          <input value={suEmail} onChange={e=>setSuEmail(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Email" />
          <input value={suPassword} onChange={e=>setSuPassword(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Password" type="password" />
          <input value={suConfirm} onChange={e=>setSuConfirm(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Confirm Password" type="password" />
          <button onClick={() => {
            const emailOk = /.+@.+\..+/.test(suEmail)
            const passOk = suPassword.length >= 6 && suPassword === suConfirm
            const nameOk = suName.trim().length >= 2
            if (!nameOk || !emailOk || !passOk) { setSuError('Fill all fields correctly'); setSuSuccess(''); return }
            setSuError('')
            setSuSuccess('Account created. You can sign in now.')
          }} className="w-full rounded-md bg-[#0B4C72] px-4 py-2 text-sm font-medium">Create Account</button>
          <div className="text-xs text-slate-400 text-center">Already have an account? <button onClick={() => { setSignupOpen(false); setLoginOpen(true) }} className="underline">Login</button></div>
        </div>
      </Modal>

      

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="Send a Message">
        <div className="space-y-3">
          <input className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Name" />
          <input className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Email" />
          <textarea className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Message" rows={4} />
          <button className="w-full rounded-md bg-[#0B4C72] px-4 py-2 text-sm font-medium">Send</button>
        </div>
      </Modal>
    </div>
  )
}

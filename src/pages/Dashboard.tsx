import React from 'react'
import { Reveal, Counter } from '../ui'

export default function Dashboard({ onNavigate }: { onNavigate: (route: 'contact' | 'events') => void }) {
  return (
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
              <button onClick={() => onNavigate('contact')} className="rounded-md bg-white/90 text-slate-900 px-4 py-2 text-sm font-medium">About Us</button>
              <button onClick={() => onNavigate('events')} className="rounded-md bg-black/30 text-white px-4 py-2 text-sm font-medium">All Events</button>
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
  )
}


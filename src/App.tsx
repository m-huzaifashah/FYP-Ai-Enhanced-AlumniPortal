import React, { useMemo, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CareerSupport from './pages/CareerSupport'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Directory from './pages/Directory'
import Events from './pages/Events'
import Jobs from './pages/Jobs'
import Contact from './pages/Contact'
import Signup from './pages/Signup'
import Forgot from './pages/Forgot'
import Mentorship from './pages/Mentorship'
import Admin from './pages/Admin'
import { Modal } from './ui'

type Route = 'dashboard' | 'services' | 'service' | 'directory' | 'events' | 'jobs' | 'contact' | 'career' | 'mentorship' | 'admin' | 'signup' | 'forgot' | 'profile' | 'settings'

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

const MENTORS = [
  { id: 1, name: 'Sara Ahmed', title: 'Frontend Engineer', company: 'TechNest', city: 'Karachi', skills: ['React', 'TypeScript', 'UI'], type: 'mentor' as const },
  { id: 2, name: 'Bilal Hussain', title: 'Data Analyst', company: 'MarketIQ', city: 'Lahore', skills: ['Python', 'SQL', 'PowerBI'], type: 'mentor' as const },
  { id: 3, name: 'Nida Raza', title: 'Product Designer', company: 'AutoForm', city: 'Islamabad', skills: ['Figma', 'UX', 'Prototyping'], type: 'mentor' as const },
  { id: 4, name: 'Usman Ali', title: 'Backend Developer', company: 'GridWorks', city: 'Rawalpindi', skills: ['Node.js', 'Express', 'MongoDB'], type: 'mentor' as const },
  { id: 5, name: 'Ahsan Khan', title: 'Cloud Engineer', company: 'SkyOps', city: 'Remote', skills: ['AWS', 'Docker', 'CI/CD'], type: 'mentor' as const },
  { id: 6, name: 'Hira Siddiqui', title: 'Business Analyst', company: 'BizCore', city: 'Lahore', skills: ['Agile', 'Stakeholder', 'Docs'], type: 'mentee' as const },
  { id: 7, name: 'Farhan Saeed', title: 'Mobile Developer', company: 'Appify', city: 'Karachi', skills: ['Flutter', 'Firebase', 'UI'], type: 'mentor' as const },
  { id: 8, name: 'Maryam Noor', title: 'AI Researcher', company: 'DeepLabs', city: 'Islamabad', skills: ['ML', 'TensorFlow', 'NLP'], type: 'mentor' as const },
]

const EVENTS: Event[] = [
  { id: 1, title: 'Annual Alumni Meetup', date: '2025-12-10', location: 'Campus Auditorium', description: 'Networking and keynote from notable alumni.' },
  { id: 2, title: 'Tech Talks', date: '2026-01-20', location: 'Innovation Lab', description: 'Talks on AI, Cloud, and Startups.' }
]

const JOBS: Job[] = [
  { id: 1, title: 'Frontend Engineer', company: 'TechNest', location: 'Karachi', link: '#' },
  { id: 2, title: 'Data Analyst', company: 'MarketIQ', location: 'Remote', link: '#' }
]



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
    ['career','Career Support'],
    ['mentorship','Mentorship'],
    ['admin','Admin'],
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
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] via-[#E8F4FF] to-white text-slate-800">
      <Navbar route={route as any} onNavigate={setRoute as any} onOpenLogin={() => setLoginOpen(true)} nav={NAV as any} />

      <div className="mx-auto max-w-7xl">
        <main className="px-4 py-8">
          {route === 'dashboard' && (
            <Dashboard onNavigate={(r) => setRoute(r)} featured={ALUMNI.slice(0,6).map(a => ({ id: a.id, name: a.name, role: a.role, company: a.company }))} />
          )}

          {route === 'services' && (
            <Services
              services={servicesFiltered}
              query={svcQuery}
              onQueryChange={setSvcQuery}
              category={svcCategory}
              onCategoryChange={setSvcCategory}
              onOpenService={openService}
            />
          )}

          {route === 'service' && svcDetail && (
            <ServiceDetail
              service={svcDetail}
              onBack={() => setRoute('services')}
              onOpenLogin={() => setLoginOpen(true)}
            />
          )}

          {route === 'directory' && (
            <Directory alumni={filtered} query={query} onQueryChange={setQuery} />
          )}

          {route === 'events' && (
            <Events events={EVENTS} />
          )}

          {route === 'jobs' && (
            <Jobs jobs={JOBS} />
          )}

          {route === 'career' && (
            <CareerSupport
              jobs={JOBS}
              internships={[
                { id: 101, title: 'Software Intern', company: 'TechNest', location: 'Karachi' },
                { id: 102, title: 'Data Intern', company: 'MarketIQ', location: 'Remote' },
                { id: 103, title: 'Design Intern', company: 'AutoForm', location: 'Islamabad' },
                { id: 104, title: 'Marketing Intern', company: 'GridWorks', location: 'Lahore' },
                { id: 105, title: 'QA Intern', company: 'TechNest', location: 'Karachi' },
                { id: 106, title: 'Cloud Intern', company: 'MarketIQ', location: 'Remote' },
              ]}
            />
          )}

          {route === 'mentorship' && (
            <Mentorship mentors={MENTORS} />
          )}

          {route === 'admin' && (
            <Admin events={EVENTS} jobs={JOBS} alumniCount={ALUMNI.length} />
          )}

          {route === 'contact' && (
            <Contact onOpenMessage={() => setContactOpen(true)} />
          )}

          {route === 'signup' && (
            <Signup onOpenLogin={() => setLoginOpen(true)} onBack={() => setRoute('dashboard')} onOpenForgot={() => setRoute('forgot')} />
          )}

          {route === 'forgot' && (
            <Forgot onBack={() => setRoute('signup')} />
          )}

          {route === 'profile' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 p-6 shadow-sm backdrop-blur-sm">
                <div className="text-xl font-semibold">Profile</div>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200" placeholder="Full Name" />
                  <input className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200" placeholder="Email" />
                  <input className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200" placeholder="Department" />
                  <input className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200" placeholder="Company" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRoute('dashboard')} className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-2 text-sm">Back</button>
                    <button className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold">Save</button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 p-6 shadow-sm backdrop-blur-sm">
                <div className="text-xl font-semibold">Public Card Preview</div>
                <div className="mt-4 rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                  <div className="font-semibold">Your Name</div>
                  <div className="text-sm text-slate-600">Role at Company</div>
                  <div className="text-xs text-slate-500">Location</div>
                </div>
              </div>
            </div>
          )}

          {route === 'settings' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 p-6 shadow-sm backdrop-blur-sm">
                <div className="text-xl font-semibold">Settings</div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white ring-1 ring-slate-200 p-3">
                    <div>
                      <div className="font-semibold">Email Notifications</div>
                      <div className="text-xs text-slate-600">Receive updates about events and jobs</div>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white ring-1 ring-slate-200 p-3">
                    <div>
                      <div className="font-semibold">Mentorship Invites</div>
                      <div className="text-xs text-slate-600">Allow mentors to contact you</div>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRoute('dashboard')} className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-2 text-sm">Back</button>
                    <button className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold">Save Changes</button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 p-6 shadow-sm backdrop-blur-sm">
                <div className="text-xl font-semibold">Theme</div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <button className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
                    <button className="h-10 w-10 rounded-lg bg-white ring-1 ring-slate-200" />
                    <button className="h-10 w-10 rounded-lg bg-slate-900" />
                  </div>
                  <div className="text-xs text-slate-600">Theme switching is mocked for demo.</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

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
          <div className="mt-2 text-right text-xs">
            <button onClick={() => { setLoginOpen(false); setRoute('forgot') }} className="underline text-[#0B4C72]">Forgot Password?</button>
          </div>
          <div className="text-xs text-slate-400 text-center">No account? <button onClick={() => { setLoginOpen(false); setRoute('signup') }} className="underline">Sign Up</button></div>
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

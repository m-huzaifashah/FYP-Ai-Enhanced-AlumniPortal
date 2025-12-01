import React, { useMemo, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
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
import LoginModal from './components/LoginModal'
import SignupModal from './components/SignupModal'
import ContactModal from './components/ContactModal'
import { SERVICES } from './data/services.js'
import { ALUMNI } from './data/alumni.js'
import { MENTORS } from './data/mentors.js'
import { EVENTS } from './data/events.js'
import { JOBS } from './data/jobs.js'

type Route = 'dashboard' | 'services' | 'service' | 'directory' | 'events' | 'jobs' | 'contact' | 'career' | 'mentorship' | 'admin' | 'signup' | 'forgot' | 'profile' | 'settings'

type Service = { id: string; title: string; description: string; category: 'Career' | 'Community' | 'Benefits' | 'Support' }
type Alumni = { id: number; name: string; batch: number; department: string; location: string; role: string; company: string }
type Event = { id: number; title: string; date: string; location: string; description: string }
type Job = { id: number; title: string; company: string; location: string; link: string }
type Mentor = { id: number; name: string; title: string; company: string; city: string; skills: string[]; type: 'mentor' | 'mentee' }

// data moved to JS files and imported above



const ROUTE_TO_PATH: Record<Route, string> = {
  dashboard: '/',
  services: '/services',
  service: '/service',
  directory: '/directory',
  events: '/events',
  jobs: '/jobs',
  contact: '/contact',
  career: '/career',
  mentorship: '/mentorship',
  admin: '/admin',
  signup: '/signup',
  forgot: '/forgot',
  profile: '/profile',
  settings: '/settings',
}
const PATH_TO_ROUTE: Record<string, Route> = Object.fromEntries(Object.entries(ROUTE_TO_PATH).map(([k, v]) => [v, k as Route]))
const NAV_ITEMS: [Route, string][] = [
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
const SERVICES_LIST: Service[] = SERVICES as Service[]
const MENTORS_LIST: Mentor[] = MENTORS as Mentor[]

export default function App() {
  const [state, setState] = useState({
    route: 'dashboard' as Route,
    query: '',
    loginOpen: false,
    authed: false,
    contactOpen: false,
    signupOpen: false,
    loginEmail: '',
    loginPassword: '',
    loginError: '',
    suName: '',
    suEmail: '',
    suPassword: '',
    suConfirm: '',
    suError: '',
    suSuccess: '',
    svcQuery: '',
    svcDetail: null as Service | null,
    svcCategory: 'All' as 'All' | 'Career' | 'Community' | 'Benefits' | 'Support'
  })
  const navigate = useNavigate()
  const location = useLocation()
  const currentRoute: Route = PATH_TO_ROUTE[location.pathname] ?? 'dashboard'

  const setRoute = (r: Route) => {
    setState(s => ({ ...s, route: r }))
    const p = ROUTE_TO_PATH[r]
    if (p) navigate(p)
    try { localStorage.setItem('last-route', r) } catch {}
  }
  const setQuery = (v: string) => setState(s => ({ ...s, query: v }))
  const setLoginOpen = (v: boolean) => setState(s => ({ ...s, loginOpen: v }))
  const setContactOpen = (v: boolean) => setState(s => ({ ...s, contactOpen: v }))
  const setSignupOpen = (v: boolean) => setState(s => ({ ...s, signupOpen: v }))
  const setLoginEmail = (v: string) => setState(s => ({ ...s, loginEmail: v }))
  const setLoginPassword = (v: string) => setState(s => ({ ...s, loginPassword: v }))
  const setLoginError = (v: string) => setState(s => ({ ...s, loginError: v }))
  const setSuName = (v: string) => setState(s => ({ ...s, suName: v }))
  const setSuEmail = (v: string) => setState(s => ({ ...s, suEmail: v }))
  const setSuPassword = (v: string) => setState(s => ({ ...s, suPassword: v }))
  const setSuConfirm = (v: string) => setState(s => ({ ...s, suConfirm: v }))
  const setSuError = (v: string) => setState(s => ({ ...s, suError: v }))
  const setSuSuccess = (v: string) => setState(s => ({ ...s, suSuccess: v }))
  const setSvcQuery = (v: string) => setState(s => ({ ...s, svcQuery: v }))
  const setSvcDetail = (d: Service | null) => setState(s => ({ ...s, svcDetail: d }))
  const setSvcCategory = (c: 'All' | 'Career' | 'Community' | 'Benefits' | 'Support') => setState(s => ({ ...s, svcCategory: c }))
  

  const filtered = useMemo(() => {
    const q = state.query.trim().toLowerCase()
    if (!q) return ALUMNI
    return ALUMNI.filter(a =>
      a.name.toLowerCase().includes(q) ||
      String(a.batch).includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    )
  }, [state.query])

  const servicesFiltered = useMemo(() => {
    const q = state.svcQuery.trim().toLowerCase()
    return SERVICES_LIST.filter(s => {
      const matchesText = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      const matchesCat = state.svcCategory === 'All' || s.category === state.svcCategory
      return matchesText && matchesCat
    })
  }, [state.svcQuery, state.svcCategory])

  const openService = (id: string) => {
    if (id === 'login') { setLoginOpen(true); return }
    if (id === 'jobs') { setRoute('jobs'); return }
    if (id === 'events') { setRoute('events'); return }
    if (id === 'contact') { setRoute('contact'); return }
    const s = SERVICES_LIST.find(x => x.id === id) || null
    setSvcDetail(s as Service | null)
    setRoute('service')
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] via-[#E8F4FF] to-white text-slate-800 overflow-x-hidden">
      <Navbar route={currentRoute as any} onNavigate={setRoute as any} onOpenLogin={() => setLoginOpen(true)} nav={NAV_ITEMS as any} authed={state.authed} onSignOut={() => setState(s => ({ ...s, authed: false }))} />

      <div className="mx-auto max-w-7xl">
        <main className="px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={<Dashboard onNavigate={(r) => setRoute(r)} featured={ALUMNI.slice(0,6).map(a => ({ id: a.id, name: a.name, role: a.role, company: a.company }))} />}
            />
            <Route
              path="/services"
              element={
                <Services
                  services={servicesFiltered}
                  query={state.svcQuery}
                  onQueryChange={setSvcQuery}
                  category={state.svcCategory}
                  onCategoryChange={setSvcCategory}
                  onOpenService={openService}
                />
              }
            />
            <Route
              path="/service"
              element={
                state.svcDetail ? (
                  <ServiceDetail
                    service={state.svcDetail}
                    onBack={() => setRoute('services')}
                    onOpenLogin={() => setLoginOpen(true)}
                  />
                ) : (
                  <Services
                    services={servicesFiltered}
                    query={state.svcQuery}
                    onQueryChange={setSvcQuery}
                    category={state.svcCategory}
                    onCategoryChange={setSvcCategory}
                    onOpenService={openService}
                  />
                )
              }
            />
            <Route path="/directory" element={<Directory alumni={filtered} query={state.query} onQueryChange={setQuery} />} />
            <Route path="/events" element={<Events />} />
            <Route path="/jobs" element={<Jobs jobs={JOBS} />} />
            <Route
              path="/career"
              element={
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
              }
            />
            <Route path="/mentorship" element={<Mentorship mentors={MENTORS_LIST} />} />
            <Route path="/admin" element={<Admin events={EVENTS} jobs={JOBS} alumniCount={ALUMNI.length} />} />
            <Route path="/contact" element={<Contact onOpenMessage={() => setContactOpen(true)} />} />
            <Route path="/signup" element={<Signup onOpenLogin={() => setLoginOpen(true)} onBack={() => setRoute('dashboard')} onOpenForgot={() => setRoute('forgot')} />} />
            <Route path="/forgot" element={<Forgot onBack={() => setRoute('signup')} />} />
            <Route
              path="/profile"
              element={
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
              }
            />
            <Route
              path="/settings"
              element={
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
              }
            />
          </Routes>
        </main>
      </div>

      <Footer />

      <LoginModal
        open={state.loginOpen}
        onClose={() => setLoginOpen(false)}
        loginEmail={state.loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={state.loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={state.loginError}
        setLoginError={setLoginError}
        onGoForgot={() => { setLoginOpen(false); setRoute('forgot') }}
        onGoSignup={() => { setLoginOpen(false); setRoute('signup') }}
        onLoggedIn={() => setState(s => ({ ...s, authed: true }))}
      />

      <SignupModal
        open={state.signupOpen}
        onClose={() => setSignupOpen(false)}
        suName={state.suName}
        setSuName={setSuName}
        suEmail={state.suEmail}
        setSuEmail={setSuEmail}
        suPassword={state.suPassword}
        setSuPassword={setSuPassword}
        suConfirm={state.suConfirm}
        setSuConfirm={setSuConfirm}
        suError={state.suError}
        suSuccess={state.suSuccess}
        setSuError={setSuError}
        setSuSuccess={setSuSuccess}
        onOpenLogin={() => { setSignupOpen(false); setLoginOpen(true) }}
      />

      

      <ContactModal open={state.contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

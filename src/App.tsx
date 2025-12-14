import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import SignupModal from './components/SignupModal'
import ContactModal from './components/ContactModal'
import AppRoutes from './components/AppRoutes'
import { useInitialData } from './hooks/useInitialData'
import { useFilterAlumni, useFilterServices } from './utils/filter'
import { getIsAdmin, initAuthed, signOut } from './utils/auth'
import { ROUTE_TO_PATH, PATH_TO_ROUTE, NAV_ITEMS } from './constants/routes'
import type { Route as AppRoute } from './constants/routes'

import type { Service } from './hooks/useInitialData'

type Route = AppRoute

export default function App() {
  const [route, setRouteState] = useState<Route>('dashboard')
  const [query, setQuery] = useState('')
  const [authed, setAuthed] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
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
  const { services, alumni, jobs, events, apiMode, setEvents } = useInitialData()
  const navigate = useNavigate()
  const location = useLocation()
  const currentRoute: Route = PATH_TO_ROUTE[location.pathname] ?? 'dashboard'
  const isAdmin = getIsAdmin(authed)

  React.useEffect(() => { initAuthed(setAuthed) }, [])

  const setRoute = (r: Route) => {
    const p = ROUTE_TO_PATH[r]
    if (p) navigate(p)
    try { localStorage.setItem('last-route', r) } catch {}
    setRouteState(r)
  }
  const filtered = useFilterAlumni(query, alumni)
  const servicesFiltered = useFilterServices(svcQuery, svcCategory, services)

  const openService = (id: string) => {
    if (id === 'login') { setLoginOpen(true); return }
    if (id === 'jobs') { setRoute('jobs'); return }
    if (id === 'events') { setRoute('events'); return }
    if (id === 'contact') { setRoute('contact'); return }
    const s = services.find(x => x.id === id) || null
    setSvcDetail(s as Service | null)
    setRoute('service')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] via-[#E8F4FF] to-white text-slate-800 overflow-x-hidden">
      <Navbar route={currentRoute as any} onNavigate={setRoute as any} onOpenLogin={() => setLoginOpen(true)} nav={NAV_ITEMS as any} authed={authed} isAdmin={isAdmin} onSignOut={() => { signOut(() => setAuthed(false)) }} />

      <div className="mx-auto max-w-7xl">
        <main className="px-4 py-8">
          <AppRoutes
            isAdmin={isAdmin}
            alumni={alumni as any}
            filtered={filtered as any}
            jobs={jobs as any}
            events={events as any}
            apiMode={apiMode as any}
            servicesFiltered={servicesFiltered as any}
            svcDetail={svcDetail as any}
            svcQuery={svcQuery}
            svcCategory={svcCategory}
            onSvcQueryChange={setSvcQuery}
            onSvcCategoryChange={setSvcCategory}
            dirQuery={query}
            onDirQueryChange={setQuery}
            setRoute={setRoute as any}
            setEvents={setEvents as any}
            setContactOpen={setContactOpen}
            setLoginOpen={setLoginOpen}
            openService={openService}
          />
        </main>
      </div>

      <Footer />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        setLoginError={setLoginError}
        onGoForgot={() => { setLoginOpen(false); setRoute('forgot') }}
        onGoSignup={() => { setLoginOpen(false); setRoute('signup') }}
        onLoggedIn={() => setAuthed(true)}
      />

      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        suName={suName}
        setSuName={setSuName}
        suEmail={suEmail}
        setSuEmail={setSuEmail}
        suPassword={suPassword}
        setSuPassword={setSuPassword}
        suConfirm={suConfirm}
        setSuConfirm={setSuConfirm}
        suError={suError}
        suSuccess={suSuccess}
        setSuError={setSuError}
        setSuSuccess={setSuSuccess}
        onOpenLogin={() => { setSignupOpen(false); setLoginOpen(true) }}
      />

      

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

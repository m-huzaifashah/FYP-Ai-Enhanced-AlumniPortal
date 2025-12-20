import React, { useState } from 'react'
import { IconButton, Icon } from '../../ui'

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
      <div className="text-sm font-semibold">Riphah International University</div>
    </div>
  )
}

function Social() {
  return (
    <div className="flex items-center gap-2">
      <a className="p-2 rounded-full bg-white ring-1 ring-slate-200 hover:ring-blue-400" href="#" aria-label="Facebook">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-slate-700"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.7c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.5.8-1.5 1.5V12h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z"/></svg>
      </a>
      <a className="p-2 rounded-full bg-white ring-1 ring-slate-200 hover:ring-blue-400" href="#" aria-label="Twitter">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-slate-700"><path d="M22 5.9a7.4 7.4 0 01-2.1.6 3.7 3.7 0 001.6-2 7.4 7.4 0 01-2.3.9 3.7 3.7 0 00-6.3 3.4A10.5 10.5 0 033 5.2a3.7 3.7 0 001.1 5 3.7 3.7 0 01-1.7-.5v.1a3.7 3.7 0 003 3.6 3.7 3.7 0 01-1.7.1 3.7 3.7 0 003.5 2.6A7.5 7.5 0 034 18.1a10.6 10.6 0 005.7 1.7c6.8 0 10.5-5.6 10.5-10.5v-.5A7.5 7.5 0 0022 5.9z"/></svg>
      </a>
      <a className="p-2 rounded-full bg-white ring-1 ring-slate-200 hover:ring-blue-400" href="#" aria-label="Instagram">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-slate-700"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm6.5-.8a1.2 1.2 0 110 2.3 1.2 1.2 0 010-2.3z"/></svg>
      </a>
      <a className="p-2 rounded-full bg-white ring-1 ring-slate-200 hover:ring-blue-400" href="#" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-slate-700"><path d="M4 3a2 2 0 100 4 2 2 0 000-4zM3 8h3v13H3V8zm7 0h3v2h.1a3.3 3.3 0 012.9-1.6c3.1 0 3.7 2 3.7 4.7V21h-3v-6.1c0-1.5 0-3.4-2.1-3.4-2.2 0-2.5 1.6-2.5 3.3V21h-3V8z"/></svg>
      </a>
    </div>
  )
}

function HomeDropdown({ onNavigate, route }: { onNavigate: (r: string) => void; route: string }) {
  const [open, setOpen] = useState(false)
  const isActive = route === 'dashboard' || route === 'services'

  const scrollToSection = (id: string) => {
    if (route !== 'dashboard') {
      onNavigate('dashboard')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
    setOpen(false)
  }

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => onNavigate('dashboard')}
        className={'px-3 py-1 text-sm hover:text-slate-200 flex items-center gap-1 ' + (isActive ? 'underline underline-offset-8' : '')}
      >
        Home
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white text-slate-800 rounded-md shadow-lg py-2 z-50">
          <button onClick={(e) => { e.stopPropagation(); scrollToSection('reviews') }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">What Alumni Say</button>
          <button onClick={(e) => { e.stopPropagation(); scrollToSection('stories') }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">Our Stories</button>
          <button onClick={(e) => { e.stopPropagation(); scrollToSection('about') }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">About</button>
          <button onClick={(e) => { e.stopPropagation(); scrollToSection('why-join-us') }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">Why Join Us</button>
          <div className="h-px bg-slate-100 my-1" />
          <button onClick={(e) => { e.stopPropagation(); onNavigate('services'); setOpen(false) }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">Services</button>
        </div>
      )}
    </div>
  )
}

export default function Navbar({ route, onNavigate, onOpenLogin, nav, authed = false, isAdmin = false, onSignOut }: { route: string; onNavigate: (r: string) => void; onOpenLogin: () => void; nav: [string,string][]; authed?: boolean; isAdmin?: boolean; onSignOut?: () => void }) {
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [drawerAnim, setDrawerAnim] = useState(false)
  const visibleNav = (isAdmin ? nav : nav.filter(([r]) => r !== 'admin'))
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-white text-slate-600 border-b border-slate-200">
        <div className="mx-auto max-w-7xl h-9 px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-[#0B4C72]"><path d="M2 6a3 3 0 013-3h14a3 3 0 013 3v12a3 3 0 01-3 3H5a3 3 0 01-3-3V6zm3-.5a.5.5 0 00-.5.5v.3l7.5 4.3L20.5 6.3V6a.5.5 0 00-.5-.5H5zM20 8.7l-7.9 4.6a1 1 0 01-1 0L3 8.7V18a1 1 0 001 1h16a1 1 0 001-1V8.7z"/></svg>
            <span>Email: alumni@riphah.edu.pk</span>
          </div>
          <div className="flex items-center gap-2">
            {!authed && (
              <>
                <button onClick={onOpenLogin} className="rounded-full text-slate-600 hover:text-[#0B4C72] px-3 py-1 text-xs font-bold">Login</button>
                <button onClick={() => onNavigate('signup')} className="rounded-full bg-[#0B4C72] text-white px-3 py-1 text-xs font-semibold hover:bg-[#093c5a]">Sign Up</button>
              </>
            )}
            {authed && (
              <button onClick={() => onSignOut && onSignOut()} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-200">Sign Out</button>
            )}
          </div>
        </div>
      </div>
      <div className={(mobileOpen ? 'bg-[#0B4C72]' : 'bg-[#0B4C72]') + ' text-white'}>
        <div className="mx-auto max-w-7xl h-16 px-3 sm:px-6 grid grid-cols-[auto_1fr_auto] items-center">
          <div className="flex items-center gap-2">
            <button aria-label="Menu" onClick={() => { setMobileOpen(true); setTimeout(()=>setDrawerAnim(true),0) }} className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
            </button>
            <Logo />
          </div>
          <nav className="hidden md:flex items-center justify-center gap-4">
            {visibleNav.map(([r,label]) => {
              if (r === 'dashboard') return <HomeDropdown key={r} onNavigate={onNavigate} route={route} />
              if (r === 'services') return null
              return (
                <button
                  key={r}
                  onClick={() => onNavigate(r)}
                  className={'px-3 py-1 text-sm hover:text-slate-200 ' + (route===r ? 'underline underline-offset-8' : '')}
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div className="relative flex items-center justify-end gap-3">
            {/* {route !== 'contact' && (
              <button onClick={() => onNavigate('contact')} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                <span>Contact us</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5 12h12l-4.5 4.5 1.4 1.4L21 12l-7.1-5.9-1.4 1.4L17 12H5z"/></svg>
              </button>
            )} */}
            <IconButton>
              <Icon name="bell" />
            </IconButton>
            <IconButton onClick={() => {
              if(isAdmin) 
              {onNavigate('admin')}
              else
              {setOpen(false); onOpenLogin() }}}>
              <Icon name="shield" />
            </IconButton>
            <button onClick={() => setOpen(v=>!v)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
              <div className="text-sm">Account</div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="opacity-80"><path d="M7 10l5 5 5-5H7z"/></svg>
            </button>
             {open && (
               <div className="absolute right-0 top-12 w-48 rounded-xl bg-white ring-1 ring-slate-200 shadow-lg text-slate-800">
                 {!authed && (
                   <button onClick={() => { setOpen(false); onOpenLogin() }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Sign In</button>
                 )}
                 {authed && (
                   <>
                     <button onClick={() => { setOpen(false); onNavigate('profile') }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Profile</button>
                     <button onClick={() => { setOpen(false); onNavigate('settings') }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Settings</button>
                     <button onClick={() => { setOpen(false); onSignOut && onSignOut() }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Sign Out</button>
                   </>
                 )}
               </div>
             )}
          </div>
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setDrawerAnim(false); setTimeout(()=>setMobileOpen(false),300) }} />
            <div className={(drawerAnim ? 'translate-x-0' : '-translate-x-full') + ' absolute left-0 top-0 h-full w-full sm:w-72 sm:max-w-[85vw] bg-[#0B4C72] text-white shadow-xl p-4 transition-transform duration-300'}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Menu</div>
                <button aria-label="Close" onClick={() => { setDrawerAnim(false); setTimeout(()=>setMobileOpen(false),300) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.225 4.811L4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z"/></svg>
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {visibleNav.map(([r,label]) => (
                  <li key={r}>
                    <button onClick={() => { setMobileOpen(false); onNavigate(r) }} className={'w-full text-left rounded-lg px-3 py-2 text-sm ' + (route===r ? 'bg-white/10' : 'hover:bg-white/10')}>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {!authed ? (
                  <button onClick={() => { setMobileOpen(false); onOpenLogin() }} className="w-full rounded-lg bg-white text-[#0B4C72] px-3 py-2 text-sm font-semibold">Sign In</button>
                ) : (
                  <button onClick={() => { setDrawerAnim(false); setTimeout(()=>setMobileOpen(false),300); onSignOut && onSignOut() }} className="w-full rounded-lg bg-white text-[#0B4C72] px-3 py-2 text-sm">Sign Out</button>
                )}
              </div>
              <div className="mt-6">
                <Social />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

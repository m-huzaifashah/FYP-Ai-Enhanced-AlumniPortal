import React, { useState } from 'react'
import { IconButton, Icon } from '../ui'

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

export default function Navbar({ route, onNavigate, onOpenLogin, nav }: { route: string; onNavigate: (r: string) => void; onOpenLogin: () => void; nav: [string,string][] }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl h-16 px-6 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center"><Logo /></div>
        <nav className="hidden md:flex items-center justify-center gap-2">
          {nav.map(([r,label]) => (
            <button
              key={r}
              onClick={() => onNavigate(r)}
              className={'rounded-full px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 ' + (route===r ? 'bg-slate-100 ring-1 ring-slate-200' : '')}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="relative flex items-center justify-end gap-3">
          <IconButton>
            <Icon name="bell" />
          </IconButton>
          <button onClick={() => setOpen(v=>!v)} className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-slate-200 px-2 py-1 shadow-sm">
            <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
            <div className="text-sm text-slate-700">Account</div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-slate-500"><path d="M7 10l5 5 5-5H7z"/></svg>
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-48 rounded-xl bg-white ring-1 ring-slate-200 shadow-lg">
              <button onClick={() => { setOpen(false); onOpenLogin() }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Sign In</button>
              <button onClick={() => { setOpen(false); onNavigate('profile') }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Profile</button>
              <button onClick={() => { setOpen(false); onNavigate('settings') }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Settings</button>
              <button onClick={() => { setOpen(false); onNavigate('dashboard') }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

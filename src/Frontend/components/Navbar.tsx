import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
// import { IconButton, Icon } from '../../ui'

export default function Navbar() {
  const [homeOpen, setHomeOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  const linkClass = (path: string) => `px-3 py-2 rounded-lg transition-all ${isActive(path) ? 'bg-white/10 text-white' : 'hover:bg-white/10 hover:text-white text-white/90'}`


  return (
    <>
      {/* Top Bar */}
      <div className="bg-white text-slate-600 text-xs py-2 hidden sm:block border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-[#0B4C72] font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Email: alumni@riphah.edu.pk
                </span>
            </div>
            <div className="flex items-center gap-4 font-medium">
                <Link to="/login" className="text-[#0B4C72] hover:text-[#0B4C72]/80 transition-colors text-sm">Login</Link>
                <Link to="/signup" className="bg-[#0B4C72] text-white px-5 py-1.5 rounded-full hover:bg-[#0B4C72]/90 transition-colors text-sm font-semibold">Sign Up</Link>
            </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-[#0B4C72] shadow-sm font-sans text-white">
        <div className="mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-slate-100">
                <img 
                  src="https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png" 
                  alt="RIU Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-semibold text-lg tracking-wide hidden sm:block text-white">Riphah International University</span>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-2 text-[15px] font-medium text-white/90">
              <div className="relative h-full flex items-center" onMouseEnter={() => setHomeOpen(true)} onMouseLeave={() => setHomeOpen(false)}>
                <Link to="/" className={`flex items-center gap-1 ${linkClass('/')}`}>
                  Home
                  <svg className={`w-3 h-3 transition-transform ${homeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </Link>
                {homeOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-xl py-2 z-50 ring-1 ring-black/5">
                    <Link to="/#reviews" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">What Alumni Say</Link>
                    <Link to="/#stories" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">Our Stories</Link>
                    <Link to="/#about" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">About</Link>
                    <Link to="/#why-join-us" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">Why Join Us</Link>
                  </div>
                )}
              </div>
              <Link to="/directory" className={linkClass('/directory')}>Directory</Link>
              <Link to="/events" className={linkClass('/events')}>Events</Link>
              <Link to="/jobs" className={linkClass('/jobs')}>Jobs</Link>
              <Link to="/career" className={linkClass('/career')}>Career Support</Link>
              <Link to="/mentorship" className={linkClass('/mentorship')}>Mentorship</Link>
              <Link to="/contact" className={linkClass('/contact')}>Contact</Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              </button>
              
              <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setAccountOpen(!accountOpen)} 
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full pl-1 pr-4 py-1 border border-white/10"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 ring-2 ring-white/20"></div>
                  <span className="text-sm font-medium text-white">Account</span>
                  <svg className={`w-4 h-4 text-white/70 transition-transform ${accountOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white ring-1 ring-black/5 shadow-xl text-slate-800 z-50 py-2">
                    <Link to="/profile" className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">Profile</Link>
                    <Link to="/settings" className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">Settings</Link>
                    <div className="h-px bg-slate-100 my-1" />
                    <button className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-red-600 transition-colors">Sign Out</button>
                  </div>
                )}
              </div>
            </div>
        </div>
      </header>
    </>
  )
}

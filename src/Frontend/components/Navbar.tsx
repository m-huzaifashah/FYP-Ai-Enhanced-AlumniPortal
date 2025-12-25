import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconButton, Icon } from '../../ui'

export default function Navbar() {
  const [homeOpen, setHomeOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm font-sans">
      {/* Top Bar */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 h-9 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-600">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-[#0B4C72]"><path d="M2 6a3 3 0 013-3h14a3 3 0 013 3v12a3 3 0 01-3 3H5a3 3 0 01-3-3V6zm3-.5a.5.5 0 00-.5.5v.3l7.5 4.3L20.5 6.3V6a.5.5 0 00-.5-.5H5zM20 8.7l-7.9 4.6a1 1 0 01-1 0L3 8.7V18a1 1 0 001 1h16a1 1 0 001-1V8.7z"/></svg>
            <span>Email: alumni@riphah.edu.pk</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-slate-600 hover:text-[#0B4C72] font-bold">Login</button>
            <Link to="/signup" className="bg-[#0B4C72] text-white px-3 py-1 rounded-full font-semibold hover:bg-[#093c5a]">Sign Up</Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-[#0B4C72] text-white">
        <div className="mx-auto max-w-7xl px-4 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center p-1">
              <img 
                src="https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png" 
                alt="RIU Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-semibold text-sm hidden sm:block">Riphah International University</span>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center justify-center gap-6 text-sm font-medium">
            <div className="relative" onMouseEnter={() => setHomeOpen(true)} onMouseLeave={() => setHomeOpen(false)}>
              <Link to="/" className="flex items-center gap-1 hover:text-slate-200 hover:underline underline-offset-4">
                Home
                <svg className={`w-3 h-3 transition-transform ${homeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </Link>
              {homeOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white text-slate-800 rounded-md shadow-lg py-2 z-50">
                  <Link to="/#reviews" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">What Alumni Say</Link>
                  <Link to="/#stories" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">Our Stories</Link>
                  <Link to="/#about" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">About</Link>
                  <Link to="/#why-join-us" onClick={() => setHomeOpen(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100">Why Join Us</Link>
                </div>
              )}
            </div>
            <Link to="/directory" className="hover:text-slate-200 hover:underline underline-offset-4">Directory</Link>
            <Link to="/events" className="hover:text-slate-200 hover:underline underline-offset-4">Events</Link>
            <Link to="/jobs" className="hover:text-slate-200 hover:underline underline-offset-4">Jobs</Link>
            <Link to="/career" className="hover:text-slate-200 hover:underline underline-offset-4">Career Support</Link>
            <Link to="/mentorship" className="hover:text-slate-200 hover:underline underline-offset-4">Mentorship</Link>
            <Link to="/contact" className="hover:text-slate-200 hover:underline underline-offset-4">Contact</Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-3 justify-end">
            <IconButton>
              <Icon name="bell" />
            </IconButton>
            <IconButton>
              <Icon name="shield" />
            </IconButton>
            
            <div className="relative">
              <button onClick={() => setAccountOpen(!accountOpen)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 hover:bg-white/20 transition-colors">
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
                <div className="text-sm font-medium">Account</div>
                <svg className={`w-4 h-4 transition-transform opacity-80 ${accountOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white ring-1 ring-slate-200 shadow-lg text-slate-800 z-50 py-1">
                  <Link to="/profile" className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">Profile</Link>
                  <Link to="/settings" className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">Settings</Link>
                  <div className="h-px bg-slate-100 my-1" />
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-red-600">Sign Out</button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}

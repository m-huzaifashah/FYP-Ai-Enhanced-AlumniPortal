import React, { useState } from 'react'
import { Icon } from '../ui'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const BRAND = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
        <div className="mx-auto max-w-4xl rounded-full bg-white/70 ring-1 ring-slate-200 px-4 py-4">
          <div className="text-center text-2xl font-bold">Subscribe Our Newsletter</div>
          <div className="mt-4 flex items-center gap-3">
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm" />
            <button onClick={() => {
              const ok = /.+@.+\..+/.test(email)
              setMsg(ok ? 'Thanks for subscribing!' : 'Enter a valid email')
            }} className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 text-sm font-semibold">Subscribe</button>
          </div>
          {msg && <div className="mt-2 text-center text-sm text-slate-600">{msg}</div>}
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={BRAND} alt="University" className="h-10 w-10 rounded bg-white" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='https://placehold.co/40x40/EEF2FF/0B4C72?text=RIU'}} />
              <div>
                <div className="text-sm font-semibold">Riphah Alumni</div>
                <div className="text-xs text-slate-600">A modern alumni community</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a aria-label="Twitter" href="#" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-700 transition-transform duration-150 hover:scale-[1.05]"><Icon name="twitter" /></a>
              <a aria-label="LinkedIn" href="#" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-700 transition-transform duration-150 hover:scale-[1.05]"><Icon name="linkedin" /></a>
              <a aria-label="Facebook" href="#" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-700 transition-transform duration-150 hover:scale-[1.05]"><Icon name="facebook" /></a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">About</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><a href="#">Mission</a></li>
              <li><a href="#">Team</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Resources</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><a href="#">Directory</a></li>
              <li><a href="#">Jobs</a></li>
              <li><a href="#">Events</a></li>
              <li><a href="#">Mentorship</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Support</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Guidelines</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Connect</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><a href="#">Newsletter</a></li>
              <li><a href="#">Community</a></li>
              <li><a href="#">Give Back</a></li>
              <li><a href="#">Alumni Advantage</a></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">© {new Date().getFullYear()} Riphah International University</div>
      </div>
    </footer>
  )
}

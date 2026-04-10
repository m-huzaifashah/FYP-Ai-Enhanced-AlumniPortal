import React from 'react'
import { Icon } from '../ui'

export default function Footer() {
  const logo = '/logo.png'
  return (
    <footer className="bg-slate-900 text-white border-t-4 border-accent mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
        <div className="grid gap-8 md:grid-cols-5 border-b border-white/10 pb-10">
          <div className="space-y-4 md:col-span-1">
            <div className="flex flex-col gap-2">
              <img src={logo} alt="University Logo" className="h-20 w-auto object-contain self-start" />
              <div className="mt-2">
                <div className="text-base font-bold text-white tracking-wide">Riphah Alumni</div>
                <div className="text-sm text-white/70 mt-1">A modern alumni community</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a aria-label="Twitter" href="#" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/25 hover:scale-110"><Icon name="twitter" /></a>
              <a aria-label="LinkedIn" href="#" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/25 hover:scale-110"><Icon name="linkedin" /></a>
              <a aria-label="Facebook" href="#" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/25 hover:scale-110"><Icon name="facebook" /></a>
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="text-base font-bold text-white mb-4">About</div>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Mission</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Team</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div className="md:col-span-1">
            <div className="text-base font-bold text-white mb-4">Resources</div>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Directory</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Jobs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Events</a></li>
            </ul>
          </div>
          <div className="md:col-span-1">
            <div className="text-base font-bold text-white mb-4">Support</div>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
          <div className="md:col-span-1">
            <div className="text-base font-bold text-white mb-4">Connect</div>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Give Back</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Alumni Advantage</a></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-sm text-white/50 tracking-wide">© {new Date().getFullYear()} Riphah International University. All rights reserved.</div>
      </div>
    </footer>
  )
}

import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Services from '../pages/Services'
import ServiceDetail from '../pages/ServiceDetail'
import Directory from '../pages/Directory'
import Events from '../pages/Events'
import Jobs from '../pages/Jobs'
import CareerSupport from '../pages/CareerSupport'
import Mentorship from '../pages/Mentorship'
import Admin from '../pages/Admin'
import Contact from '../pages/Contact'
import Signup from '../pages/Signup'
import Forgot from '../pages/Forgot'

import type { Service, Event as Ev, Job, Alumni } from '../hooks/useInitialData'

export default function AppRoutes({
  isAdmin,
  alumni,
  filtered,
  jobs,
  events,
  apiMode,
  servicesFiltered,
  svcDetail,
  svcQuery,
  svcCategory,
  onSvcQueryChange,
  onSvcCategoryChange,
  dirQuery,
  onDirQueryChange,
  setRoute,
  setEvents,
  setContactOpen,
  setLoginOpen,
  openService,
}: {
  isAdmin: boolean
  alumni: Alumni[]
  filtered: Alumni[]
  jobs: Job[]
  events: Ev[]
  apiMode: 'db' | 'memory'
  servicesFiltered: Service[]
  svcDetail: Service | null
  svcQuery: string
  svcCategory: 'All' | 'Career' | 'Community' | 'Benefits' | 'Support'
  onSvcQueryChange: (v: string) => void
  onSvcCategoryChange: (c: 'All' | 'Career' | 'Community' | 'Benefits' | 'Support') => void
  dirQuery: string
  onDirQueryChange: (v: string) => void
  setRoute: (r: any) => void
  setEvents: (next: Ev[]) => void
  setContactOpen: (v: boolean) => void
  setLoginOpen: (v: boolean) => void
  openService: (id: string) => void
}) {
  return (
    <Routes>
      <Route
        path="/"
        element={<Dashboard onNavigate={(r) => setRoute(r)} featured={alumni.slice(0,6).map(a => ({ id: a.id, name: a.name, role: a.role, company: a.company }))} />}
      />
      <Route
        path="/services"
        element={
          <Services
            services={servicesFiltered}
            query={svcQuery}
            onQueryChange={onSvcQueryChange}
            category={svcCategory}
            onCategoryChange={onSvcCategoryChange}
            onOpenService={openService}
          />
        }
      />
      <Route
        path="/service"
        element={
          svcDetail ? (
            <ServiceDetail
              service={svcDetail}
              onBack={() => setRoute('services')}
              onOpenLogin={() => setLoginOpen(true)}
            />
          ) : (
            <Services
              services={servicesFiltered}
              query={svcQuery}
              onQueryChange={onSvcQueryChange}
              category={svcCategory}
              onCategoryChange={onSvcCategoryChange}
              onOpenService={openService}
            />
          )
        }
      />
      <Route path="/directory" element={<Directory alumni={filtered} query={dirQuery} onQueryChange={onDirQueryChange} />} />
      <Route path="/events" element={<Events />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route
        path="/career"
        element={
          <CareerSupport
            jobs={jobs}
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
      <Route path="/mentorship" element={<Mentorship />} />
      <Route path="/admin" element={isAdmin ? (
        <Admin events={events} jobs={jobs} alumniCount={alumni.length} onEventsChanged={(next)=>setEvents(next)} dataMode={apiMode} />
      ) : (
        <div className="rounded-2xl bg-white p-6 text-slate-900">
          <div className="text-xl font-semibold">Unauthorized</div>
          <div className="mt-2 text-sm text-slate-600">Please sign in as admin to access this page.</div>
          <div className="mt-3">
            <button className="rounded-full bg-white ring-1 ring-slate-200 px-3 py-1 text-sm" onClick={() => setLoginOpen(true)}>Sign In</button>
          </div>
        </div>
      )} />
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
                  <button className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-2 text-sm">Back</button>
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
                  <button className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-2 text-sm">Back</button>
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
  )
}

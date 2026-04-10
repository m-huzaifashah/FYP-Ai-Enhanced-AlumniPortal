import React from 'react'
import { Button, Card } from '../ui'

export default function Contact({ onOpenMessage }: { onOpenMessage: () => void }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Card className="p-8 lg:col-span-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-2xl font-bold text-primary">Contact Us</div>
            <p className="text-primary mt-2 text-lg">Riphah International University Alumni Relations</p>
          </div>
          <Button variant="brand" onClick={onOpenMessage} className="shadow-lg px-6 py-2.5">Send a Message</Button>
        </div>
        
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-light-section p-5 ring-1 ring-secondary transition-all hover:shadow-md hover:ring-secondary">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white mb-3 shadow-md">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Address</div>
            <div className="mt-1 text-sm font-medium text-primary">Sector I-14, Islamabad</div>
          </div>
          
          <div className="rounded-xl bg-light-section p-5 ring-1 ring-secondary transition-all hover:shadow-md hover:ring-secondary">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white mb-3 shadow-md">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Mail Us</div>
            <div className="mt-1 text-sm font-medium text-primary">alumni@riphah.edu.pk</div>
          </div>
          
          <div className="rounded-xl bg-light-section p-5 ring-1 ring-secondary transition-all hover:shadow-md hover:ring-secondary">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white mb-3 shadow-md">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Telephone</div>
            <div className="mt-1 text-sm font-medium text-primary">(+92) 51 111 RIPHAH</div>
          </div>
        </div>
      </Card>
      <div className="rounded-2xl bg-white ring-1 ring-secondary overflow-hidden shadow-sm h-full min-h-[300px]">
        <iframe title="Location Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-full min-h-[300px]" src="https://www.google.com/maps?q=Riphah+International+University+Islamabad&output=embed" />
      </div>
    </section>
  )
}

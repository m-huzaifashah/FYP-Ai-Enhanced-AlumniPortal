import React from 'react'

export default function Contact({ onOpenMessage }: { onOpenMessage: () => void }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl backdrop-blur bg-white/70 ring-1 ring-slate-200 p-6 lg:col-span-2 text-slate-800">
        <div className="text-xl font-semibold">Contact Us</div>
        <p className="text-slate-600 mt-2">Riphah International University Alumni Relations</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white ring-1 ring-slate-200 p-4">
            <div className="text-xs text-slate-500">Address</div>
            <div className="text-sm font-medium text-slate-800">Sector I-14, Islamabad</div>
          </div>
          <div className="rounded-lg bg-white ring-1 ring-slate-200 p-4">
            <div className="text-xs text-slate-500">Mail Us</div>
            <div className="text-sm font-medium text-slate-800">alumni@riphah.edu.pk</div>
          </div>
          <div className="rounded-lg bg-white ring-1 ring-slate-200 p-4">
            <div className="text-xs text-slate-500">Telephone</div>
            <div className="text-sm font-medium text-slate-800">(+92) 51 111 RIPHAH</div>
          </div>
        </div>
        <button onClick={onOpenMessage} className="mt-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white">Send a Message</button>
      </div>
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
        <iframe title="Location Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-[320px]" src="https://www.google.com/maps?q=Riphah+International+University+Islamabad&output=embed" />
      </div>
    </section>
  )
}

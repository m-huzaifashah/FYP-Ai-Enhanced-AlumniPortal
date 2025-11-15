import React from 'react'

export default function Contact({ onOpenMessage }: { onOpenMessage: () => void }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
        <div className="text-xl font-semibold">Contact Us</div>
        <p className="text-slate-300 mt-2">Riphah International University Alumni Relations</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-800 p-4">
            <div className="text-sm text-slate-300">Address</div>
            <div className="text-sm">Sector I-14, Islamabad</div>
          </div>
          <div className="rounded-lg bg-slate-800 p-4">
            <div className="text-sm text-slate-300">Mail Us</div>
            <div className="text-sm">alumni@riphah.edu.pk</div>
          </div>
          <div className="rounded-lg bg-slate-800 p-4">
            <div className="text-sm text-slate-300">Telephone</div>
            <div className="text-sm">(+92) 51 111 RIPHAH</div>
          </div>
        </div>
        <button onClick={onOpenMessage} className="mt-4 rounded-md bg-[#0B4C72] px-3 py-2 text-sm">Send a Message</button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <iframe title="Location Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-[320px]" src="https://www.google.com/maps?q=Riphah+International+University+Islamabad&output=embed" />
      </div>
    </section>
  )
}


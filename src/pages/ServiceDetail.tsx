import React from 'react'

type Service = { id: string; title: string; description: string; category: 'Career' | 'Community' | 'Benefits' | 'Support' }

export default function ServiceDetail({ service, onBack, onOpenLogin }: { service: Service; onBack: () => void; onOpenLogin: () => void }) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl overflow-hidden bg-white/5 ring-1 ring-slate-800">
        <img src={`https://placehold.co/1200x400/0B4C72/FFFFFF?text=${encodeURIComponent(service.title)}`} alt={service.title} className="w-full h-56 object-cover" />
        <div className="p-6">
          <div className="text-2xl font-bold text-white">{service.title}</div>
          <p className="mt-2 text-slate-300">{service.description}</p>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={onBack} className="rounded-md bg-slate-800 px-3 py-2 text-sm">Back to Services</button>
            {service.id==='login' && (
              <button onClick={onOpenLogin} className="rounded-md bg-[#D29B2A] px-3 py-2 text-sm text-slate-900 font-medium">Open Login</button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}


import React from 'react'

type Service = { id: string; title: string; description: string; category: 'Career' | 'Community' | 'Benefits' | 'Support' }

export default function ServiceDetail({ service, onBack, onOpenLogin }: { service: Service; onBack: () => void; onOpenLogin: () => void }) {
  const SERVICE_IMAGES: Record<string, string> = {
    login: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    jobs: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    events: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    contact: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    spotlight: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    'give-back': 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    snapshot: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    advantage: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    email: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    network: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    faqs: 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
    'message-vc': 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png',
  }
  return (
    <section className="space-y-6">
      <div className="rounded-2xl overflow-hidden bg-white/5 ring-1 ring-slate-800">
        <img
          src={SERVICE_IMAGES[service.id] || SERVICE_IMAGES.login}
          alt={service.title}
          className="w-full h-56 object-contain bg-white"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/1200x400/0B4C72/FFFFFF?text=${encodeURIComponent(service.title)}` }}
        />
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

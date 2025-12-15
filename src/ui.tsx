import React, { useEffect, useRef, useState } from 'react'

export function Modal({ open, onClose, title, children, titleClassName = '' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; titleClassName?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-3 sm:p-4">
        <div className="relative w-full max-w-[92vw] sm:max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6 transition-all duration-300">
          <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-transform duration-200 hover:scale-105">
            <Icon name="close" />
          </button>
          <div className={`text-base sm:text-lg font-semibold pr-10 ${titleClassName}`}>{title}</div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function Counter({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      setV(Math.round(p * to))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return <span>{v.toLocaleString()}</span>
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setInView(true) })
    }, { threshold })
    obs.observe(node)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView(0.15)
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={(inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4') + ' transition-[opacity,transform] duration-700 ease-out'}>
      {children}
    </div>
  )
}

export function IconCard({ title, src, description, onClick }: { title: string; src: string; description?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer rounded-2xl overflow-hidden bg-slate-50 ring-1 ring-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
      <img
        src={src}
        alt={title}
        className="w-full h-48 md:h-56 object-contain rounded-t-2xl bg-slate-100"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/900x360/F1F5F9/0B4C72?text=${encodeURIComponent(title.split(' ')[0])}` }}
      />
      <div className="p-5 md:p-6 text-center">
        <div className="text-lg md:text-xl font-semibold text-slate-900">{title}</div>
        {description && (
          <p className="mt-2 text-sm md:text-base text-slate-700 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', className = '', disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'subtle' | 'brand' | 'outlineWhite'; className?: string; disabled?: boolean }) {
  const base = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition shadow-sm active:translate-y-[1px]'
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-[#304FFD] via-[#6D3CF7] to-[#00C2D2] text-white hover:brightness-105'
      : variant === 'outline'
      ? 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
      : variant === 'brand'
      ? 'bg-[#0B4C72] text-slate-900 hover:brightness-[1.05]'
      : variant === 'outlineWhite'
      ? 'bg-transparent text-white ring-2 ring-white hover:bg-white/10'
      : 'bg-white/70 text-slate-800 ring-1 ring-slate-200'
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${styles} transition-transform duration-150 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>{children}</button>
  )
}

export function Input({ value, onChange, placeholder, className = '' }: { value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; className?: string }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} className={`rounded-full bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-shadow duration-150 ${className}`} />
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white/70 ring-1 ring-slate-200 shadow-sm backdrop-blur-sm transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-lg ${className}`}>{children}</div>
}

export function IconButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-700 hover:ring-blue-400 shadow-sm transition-transform duration-150 hover:scale-[1.05] ${className}`}>{children}</button>
}

export function Icon({ name, className = '' }: { name: 'bell' | 'calendar' | 'close' | 'twitter' | 'linkedin' | 'facebook' | 'shield'; className?: string }) {
  const props = { width: 16, height: 16, fill: 'currentColor' }
  if (name === 'bell') return (
    <svg viewBox="0 0 24 24" {...props} className={className}><path d="M12 2a6 6 0 016 6v3.1l1.4 2.8c.2.4 0 .9-.5 1H5.1c-.5 0-.8-.6-.6-1l1.5-2.8V8a6 6 0 016-6zm0 20a2.5 2.5 0 01-2.2-1.4h4.4A2.5 2.5 0 0112 22z"/></svg>
  )
  if (name === 'calendar') return (
    <svg viewBox="0 0 24 24" {...props} className={className}><path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v13a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zm13 7H4v10a1 1 0 001 1h14a1 1 0 001-1V9z"/></svg>
  )
  if (name === 'close') return (
    <svg viewBox="0 0 24 24" {...props} className={className}><path d="M6.225 4.811L4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z"/></svg>
  )
  if (name === 'twitter') return (
    <svg viewBox="0 0 24 24" {...props} className={className}><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 00-7.27 3.89A12.1 12.1 0 013 5.15a4.27 4.27 0 001.32 5.7c-.65-.02-1.26-.2-1.8-.5v.05a4.28 4.28 0 003.42 4.19c-.62.17-1.27.2-1.9.07a4.28 4.28 0 003.99 2.97A8.56 8.56 0 012 19.54a12.07 12.07 0 0018.6-10.2c0-.18-.01-.36-.02-.54A8.74 8.74 0 0022.46 6z"/></svg>
  )
  if (name === 'linkedin') return (
    <svg viewBox="0 0 24 24" {...props} className={className}><path d="M4.98 3.5A2.5 2.5 0 102.5 6a2.5 2.5 0 002.48-2.5zM3 8h4v13H3V8zm7 0h3.7v1.8h.05A4.06 4.06 0 0118.5 8c3.46 0 4.1 2.28 4.1 5.25V21h-4v-6.3c0-1.5-.03-3.43-2.09-3.43-2.1 0-2.42 1.63-2.42 3.32V21h-4V8z"/></svg>
  )
  if (name === 'shield') return (
    <svg viewBox="0 0 24 24" {...props} className={className}><path d="M12 2l7 4v6c0 5-3.5 7.7-7 10-3.5-2.3-7-5-7-10V6l7-4zm0 3.1L7 6.8v5.1c0 3.9 2.6 6.2 5 7.8 2.4-1.6 5-3.9 5-7.8V6.8l-5-1.7z"/></svg>
  )
  return (
    <svg viewBox="0 0 24 24" {...props} className={className}><path d="M22 12a10 10 0 11-20 0 10 10 0 1120 0zm-6-4h-2v2H9v2h5v2h2v-2h2v-2h-2V8z"/></svg>
  )
}

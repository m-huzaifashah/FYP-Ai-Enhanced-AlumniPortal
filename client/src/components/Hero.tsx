import React, { useEffect, useState } from 'react'
import { Reveal } from '../ui'

export default function Hero({ onNavigate }: { onNavigate: (route: 'contact' | 'events') => void; image?: string }) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] h-[600px] overflow-hidden -mt-8 mb-[-80px]">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ 
          backgroundImage: 'url(/hero.jpg)',
          transform: `translateY(${offset * 0.5}px)`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 backdrop-blur-[2px]" />
      </div>
      
      <div className="relative h-full flex items-center justify-center px-4 text-center text-white">
        <div className="max-w-4xl pt-10">
          <Reveal>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-[#9CB3C9]">
              A New Day At Riphah <br />
              Meeting the Moment, Together
            </h1>
          </Reveal>
          
          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-3xl text-lg md:text-xl text-white/80 font-light leading-relaxed">
              Embark on a timeless voyage where cherished memories, lifelong friendships, and boundless opportunities converge. Welcome to our vibrant University Alumni Network, where the past meets the present, and the future unfolds before your eyes.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => onNavigate('contact')}
                className="group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B4C72] to-[#126496] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:shadow-blue-900/60 hover:-translate-y-1 hover:scale-105"
              >
                <span>About Us</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              <button 
                onClick={() => onNavigate('events')}
                className="group relative flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-md shadow-lg shadow-black/10 transition-all hover:bg-white/10 hover:-translate-y-1 hover:scale-105"
              >
                <span>All Events</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </Reveal>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
    </div>
  )
}

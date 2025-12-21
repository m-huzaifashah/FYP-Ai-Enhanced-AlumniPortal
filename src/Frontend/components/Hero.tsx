import React, { useEffect, useState } from 'react'
import { Reveal } from '../../ui'

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
          // To use your own image:
          // 1. Save your image as 'riphah-monument.jpg' in the 'public' folder
          // 2. Change the line below to: backgroundImage: 'url(/riphah-monument.jpg)',
          backgroundImage: 'url(/hero.jpg)',
          transform: `translateY(${offset * 0.5}px)`
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
      <div className="relative h-full flex items-center justify-center px-4 text-center text-white">
        <div className="max-w-4xl">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              A New Day At Riphah Meeting<br />
              the Moment, Together
            </h1>
          </Reveal>
          
          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-white/90 font-light leading-relaxed">
              Embark on a timeless voyage where cherished memories, lifelong friendships, and boundless opportunities converge. Welcome to our vibrant University Alumni Network, where the past meets the present, and the future unfolds before your eyes.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => onNavigate('contact')}
                className="group relative flex items-center gap-2 rounded-lg bg-[#0B4C72] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[#093c5a] hover:shadow-lg hover:shadow-blue-900/20"
              >
                About Us
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              <button 
                onClick={() => onNavigate('events')}
                className="group relative flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                All Events
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </Reveal>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F0F6FF] to-transparent" />
    </div>
  )
}

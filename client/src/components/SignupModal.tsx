import React, { useState } from 'react'
import { Modal } from '../ui'
import { postSignup } from '../api'

export default function SignupModal({ open, onClose, suName, setSuName, suEmail, setSuEmail, suPassword, setSuPassword, suConfirm, setSuConfirm, suRole, setSuRole, suSecret, setSuSecret, suError, suSuccess, setSuError, setSuSuccess, onOpenLogin }: { open: boolean; onClose: () => void; suName: string; setSuName: (v: string) => void; suEmail: string; setSuEmail: (v: string) => void; suPassword: string; setSuPassword: (v: string) => void; suConfirm: string; setSuConfirm: (v: string) => void; suRole: 'student' | 'admin' | 'alumni'; setSuRole: (v: 'student' | 'admin' | 'alumni') => void; suSecret: string; setSuSecret: (v: string) => void; suError: string; suSuccess: string; setSuError: (v: string) => void; setSuSuccess: (v: string) => void; onOpenLogin: () => void }) {
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const emailOk = /.+@.+\..+/.test(suEmail)
    const passOk = suPassword.length >= 6 && suPassword === suConfirm
    const nameOk = suName.trim().length >= 2
    if (!nameOk || !emailOk || !passOk) { setSuError('Fill all fields correctly'); setSuSuccess(''); return }
    // if (suRole === 'admin' && !suSecret) { setSuError('Admin secret required'); return }
    setSuError('')
    setLoading(true)
    try {
      await postSignup({ name: suName, email: suEmail, password: suPassword, role: suRole, secret: suSecret })
      try { localStorage.setItem('email', suEmail) } catch {}
      setSuSuccess('Account created. You can sign in now.')
    } catch (e: any) {
      setSuError(e?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Account" titleClassName="text-center w-full">
      <div className="space-y-4 pt-2">
        <p className="text-center text-sm text-white/60 -mt-3 mb-2">Join the Riphah Alumni Network</p>

        {suError && <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {suError}
        </div>}
        {suSuccess && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {suSuccess}
        </div>}
        
        <div className="bg-white/10 p-1.5 rounded-2xl grid grid-cols-2 gap-1 mb-6 ring-1 ring-white/10">
          {(['student', 'alumni'] as const).map(r => (
             <button
               key={r}
               type="button"
               onClick={() => setSuRole(r)}
               className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                 suRole === r 
                   ? 'bg-white text-[#1e3a8a] shadow-xl scale-[1.02] ring-1 ring-white/20' 
                   : 'text-white/60 hover:bg-white/10 hover:text-white'
               }`}
             >
               <span className="capitalize">{r}</span>
             </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <input value={suName} onChange={e=>setSuName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all shadow-inner" placeholder="Full Name" />
          </div>
          
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <input value={suEmail} onChange={e=>setSuEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all shadow-inner" placeholder="Email Address" />
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input value={suPassword} onChange={e=>setSuPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all shadow-inner" placeholder="Create Password" type="password" />
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input value={suConfirm} onChange={e=>setSuConfirm(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all shadow-inner" placeholder="Confirm Password" type="password" />
          </div>
        </div>

        <button onClick={submit} disabled={loading} className="w-full mt-6 rounded-2xl bg-white px-4 py-4 text-sm font-black uppercase tracking-widest text-[#1e3a8a] shadow-[0_20px_50px_rgba(30,58,138,0.3)] hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
             <span className="flex items-center justify-center gap-2">
               <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
               Creating Account...
             </span>
          ) : 'Create Account'}
        </button>
        <div className="text-xs text-white/40 text-center pt-4 font-medium">Already have an account? <button onClick={onOpenLogin} className="text-white font-bold hover:underline decoration-2">Sign In</button></div>
      </div>
    </Modal>
  )
}

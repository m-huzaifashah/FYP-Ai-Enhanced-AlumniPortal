import React, { useState } from 'react'
import { Modal } from '../../ui'
import { postSignup } from '../../api'

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
    <Modal open={open} onClose={onClose} title="Create Account" titleClassName="text-white text-xl">
      <div className="space-y-4">
        <p className="text-slate-400 text-sm text-center -mt-2 mb-2">Join the Riphah Alumni Network</p>

        {suError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {suError}
        </div>}
        {suSuccess && <div className="rounded-lg bg-green-500/10 border border-green-500/20 text-green-200 text-sm px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {suSuccess}
        </div>}
        
        <div className="bg-slate-800/50 p-1 rounded-xl grid grid-cols-2 gap-1 mb-4">
          {(['student', 'alumni'] as const).map(r => (
             <button
               key={r}
               type="button"
               onClick={() => setSuRole(r)}
               className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                 suRole === r 
                   ? 'bg-[#0B4C72] text-white shadow-lg' 
                   : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
             >
               <span className="capitalize">{r}</span>
             </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#0B4C72] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <input value={suName} onChange={e=>setSuName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0B4C72] focus:ring-1 focus:ring-[#0B4C72] transition-all" placeholder="Full Name" />
          </div>
          
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#0B4C72] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <input value={suEmail} onChange={e=>setSuEmail(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0B4C72] focus:ring-1 focus:ring-[#0B4C72] transition-all" placeholder="Email Address" />
          </div>

          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#0B4C72] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input value={suPassword} onChange={e=>setSuPassword(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0B4C72] focus:ring-1 focus:ring-[#0B4C72] transition-all" placeholder="Password" type="password" />
          </div>

          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#0B4C72] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input value={suConfirm} onChange={e=>setSuConfirm(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0B4C72] focus:ring-1 focus:ring-[#0B4C72] transition-all" placeholder="Confirm Password" type="password" />
          </div>
        </div>

        <button onClick={submit} disabled={loading} className="w-full mt-2 rounded-xl bg-gradient-to-r from-[#0B4C72] to-[#1e6b9c] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <div className="text-sm text-slate-400 text-center pt-2">Already have an account? <button onClick={onOpenLogin} className="text-[#3b8fd9] hover:text-[#5baaf0] font-medium hover:underline transition-colors">Sign In</button></div>
      </div>
    </Modal>
  )
}

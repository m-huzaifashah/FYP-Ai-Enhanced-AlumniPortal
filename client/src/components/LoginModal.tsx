import React, { useMemo, useState } from 'react'
import { postLogin } from '../api'
import { Modal } from '../ui'

export default function LoginModal({ open, onClose, loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginRole, setLoginRole, loginError, setLoginError, onGoForgot, onGoSignup, onLoggedIn }: { open: boolean; onClose: () => void; loginEmail: string; setLoginEmail: (v: string) => void; loginPassword: string; setLoginPassword: (v: string) => void; loginRole: 'student' | 'admin' | 'alumni'; setLoginRole: (v: 'student' | 'admin' | 'alumni') => void; loginError: string; setLoginError: (v: string) => void; onGoForgot: () => void; onGoSignup: () => void; onLoggedIn?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const email = loginEmail.trim()
  const pass = loginPassword
  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), [email])
  const passOk = useMemo(() => pass.length >= 6, [pass])
  const canSubmit = emailOk && passOk && !loading

  const submit = async () => {
    if (!emailOk) { setLoginError('Enter a valid email'); return }
    if (!passOk) { setLoginError('Enter 6+ char password'); return }
    setLoginError('')
    setLoading(true)
    try {
      const { token, user } = await postLogin(email, pass)
      if (user.role !== loginRole) {
        throw new Error(`This account is not a ${loginRole} account.`)
      }
      try { localStorage.setItem('token', token) } catch {}
      try { localStorage.setItem('role', user.role) } catch {}
      try { localStorage.setItem('email', user.email) } catch {}
      onLoggedIn && onLoggedIn()
      onClose()
    } catch (e: any) {
      setLoginError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { if (!loading) onClose() }} title="Sign In" titleClassName="text-center w-full">
      <div className="space-y-4 sm:space-y-5 pt-2">
        <p className="text-center text-sm text-white/60 -mt-3 mb-2">Access your Riphah Alumni account</p>
        
        {loginError && <div className="rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {loginError}
        </div>}
        
        <div className="bg-primary/5 p-1 rounded-xl grid grid-cols-3 gap-1 mb-4">
          {(['student', 'alumni', 'admin'] as const).map(r => (
             <button
               key={r}
               type="button"
               onClick={() => setLoginRole(r)}
               className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                 loginRole === r 
                   ? 'bg-slate-100 text-primary shadow-lg scale-[1.02]' 
                   : 'text-white/50 hover:bg-white/10 hover:text-white'
               }`}
             >
               <span className="capitalize">{r}</span>
             </button>
          ))}
        </div>

        <div className="space-y-3.5">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <input
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              className="w-full rounded-xl border border-secondary bg-white pl-10 pr-4 py-3 text-sm text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Email Address"
            />
          </div>
          
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              className="w-full rounded-xl border border-secondary bg-white pl-10 pr-12 py-3 text-sm text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Password"
              type={show ? 'text' : 'password'}
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary/60 hover:text-primary transition-colors"
            >{show ? 'HIDE' : 'SHOW'}</button>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <button onClick={onGoForgot} className="text-xs font-medium text-white/60 hover:text-white hover:underline transition-all">Forgot Password?</button>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit}
          className={(canSubmit ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02]' : 'bg-primary/40 cursor-not-allowed') + ' w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] mt-2'}
        >
          {loading ? (
             <span className="flex items-center justify-center gap-2">
               <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
               Signing In...
             </span>
          ) : 'Sign In'}
        </button>

        <div className="text-xs text-white/60 text-center pt-2">
          Don't have an account? <button onClick={onGoSignup} className="text-white font-bold hover:underline">Create Account</button>
        </div>
      </div>
    </Modal>
  )
}

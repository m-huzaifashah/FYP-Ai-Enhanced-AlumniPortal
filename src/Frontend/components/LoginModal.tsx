import React, { useMemo, useState } from 'react'
import { postLogin } from '../../api'
import { Modal } from '../../ui'

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
    <Modal open={open} onClose={() => { if (!loading) onClose() }} title="Login" titleClassName="text-white">
      <div className="space-y-2 sm:space-y-3">
        {loginError && <div className="rounded-md bg-red-900/40 text-red-200 text-sm px-3 py-2">{loginError}</div>}
        
        <div className="flex gap-2 justify-center pb-4">
          {(['student', 'alumni', 'admin'] as const).map(r => (
             <button
               key={r}
               type="button"
               onClick={() => setLoginRole(r)}
               className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                 loginRole === r 
                   ? 'bg-[#D29B2A] text-slate-900 shadow-lg scale-105' 
                   : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
               }`}
             >
               <span className="capitalize">{r}</span>
             </button>
          ))}
        </div>

        <input
          value={loginEmail}
          onChange={e => setLoginEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-white/70"
          placeholder="Email"
        />
        <div className="relative">
          <input
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-sm text-white placeholder-white/70"
            placeholder="Password"
            type={show ? 'text' : 'password'}
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/80 underline"
          >{show ? 'Hide' : 'Show'}</button>
        </div>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className={(canSubmit ? 'hover:bg-[#c18c21]' : 'opacity-60 cursor-not-allowed') + ' w-full rounded-md bg-[#D29B2A] px-4 py-2 text-sm font-medium text-slate-900'}
        >{loading ? 'Signing In…' : 'Sign In'}</button>
        <div className="mt-2 text-center sm:text-right text-xs">
          <button onClick={onGoForgot} className="underline text-white">Forgot Password?</button>
        </div>
        <div className="text-xs text-slate-400 text-center">No account? <button onClick={onGoSignup} className="underline">Sign Up</button></div>
      </div>
    </Modal>
  )
}

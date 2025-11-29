import React from 'react'
import { Modal } from '../ui'

export default function LoginModal({ open, onClose, loginEmail, setLoginEmail,
  loginPassword, setLoginPassword, loginError, setLoginError, onGoForgot,
  onGoSignup }: {
    open: boolean; onClose: () => void; loginEmail: string;
    setLoginEmail: (v: string) => void; loginPassword: string;
    setLoginPassword: (v: string) => void; loginError: string;
    setLoginError: (v: string) => void; onGoForgot: () => void; onGoSignup: () => void
  }) {
  return (
    <Modal open={open} onClose={onClose} title="Login" titleClassName="text-white">
      <div className="space-y-3">
        {loginError && <div className="rounded-md bg-red-900/40 text-red-200 text-sm px-3 py-2">{loginError}</div>}
        <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-white/70" placeholder="Email" />
        <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-white/70" placeholder="Password" type="password" />
        <button onClick={() => {
          const ok = /.+@.+\..+/.test(loginEmail) && loginPassword.length >= 6
          if (!ok) { setLoginError('Enter a valid email and 6+ char password'); return }
          setLoginError('')
          onClose()
        }} className="w-full rounded-md bg-[#D29B2A] hover:bg-[#c18c21] px-4 py-2 text-sm font-medium text-slate-900">Sign In</button>
        <div className="mt-2 text-right text-xs">
          <button onClick={onGoForgot} className="underline text-white">Forgot Password?</button>
        </div>
        <div className="text-xs text-slate-400 text-center">No account? <button onClick={onGoSignup} className="underline">Sign Up</button></div>
      </div>
    </Modal>
  )
}

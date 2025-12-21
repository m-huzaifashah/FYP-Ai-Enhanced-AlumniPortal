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
    if (suRole === 'admin' && !suSecret) { setSuError('Admin secret required'); return }
    setSuError('')
    setLoading(true)
    try {
      await postSignup({ name: suName, email: suEmail, password: suPassword, role: suRole === 'alumni' ? undefined : suRole, secret: suSecret })
      try { localStorage.setItem('email', suEmail) } catch {}
      setSuSuccess('Account created. You can sign in now.')
    } catch (e: any) {
      setSuError(e?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Sign Up">
      <div className="space-y-3">
        {suError && <div className="rounded-md bg-red-900/40 text-red-200 text-sm px-3 py-2">{suError}</div>}
        {suSuccess && <div className="rounded-md bg-green-900/30 text-green-200 text-sm px-3 py-2">{suSuccess}</div>}
        
        <div className="flex gap-2 justify-center pb-4">
          {(['student', 'alumni', 'admin'] as const).map(r => (
             <button
               key={r}
               type="button"
               onClick={() => setSuRole(r)}
               className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                 suRole === r 
                   ? 'bg-[#0B4C72] text-white shadow-lg scale-105' 
                   : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
               }`}
             >
               <span className="capitalize">{r}</span>
             </button>
          ))}
        </div>

        <input value={suName} onChange={e=>setSuName(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Full Name" />
        <input value={suEmail} onChange={e=>setSuEmail(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Email" />
        <input value={suPassword} onChange={e=>setSuPassword(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Password" type="password" />
        <input value={suConfirm} onChange={e=>setSuConfirm(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Confirm Password" type="password" />
        
        {suRole === 'admin' && (
           <input value={suSecret} onChange={e=>setSuSecret(e.target.value)} className="w-full rounded-md border border-red-900 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Admin Secret Key" type="password" />
        )}

        <button onClick={submit} disabled={loading} className="w-full rounded-md bg-[#0B4C72] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Account'}
        </button>
        <div className="text-xs text-slate-400 text-center">Already have an account? <button onClick={onOpenLogin} className="underline">Login</button></div>
      </div>
    </Modal>
  )
}

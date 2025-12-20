import React from 'react'
import { Modal } from '../../ui'

export default function SignupModal({ open, onClose, suName, setSuName, suEmail, setSuEmail, suPassword, setSuPassword, suConfirm, setSuConfirm, suError, suSuccess, setSuError, setSuSuccess, onOpenLogin }: { open: boolean; onClose: () => void; suName: string; setSuName: (v: string) => void; suEmail: string; setSuEmail: (v: string) => void; suPassword: string; setSuPassword: (v: string) => void; suConfirm: string; setSuConfirm: (v: string) => void; suError: string; suSuccess: string; setSuError: (v: string) => void; setSuSuccess: (v: string) => void; onOpenLogin: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Sign Up">
      <div className="space-y-3">
        {suError && <div className="rounded-md bg-red-900/40 text-red-200 text-sm px-3 py-2">{suError}</div>}
        {suSuccess && <div className="rounded-md bg-green-900/30 text-green-200 text-sm px-3 py-2">{suSuccess}</div>}
        <input value={suName} onChange={e=>setSuName(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Full Name" />
        <input value={suEmail} onChange={e=>setSuEmail(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Email" />
        <input value={suPassword} onChange={e=>setSuPassword(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Password" type="password" />
        <input value={suConfirm} onChange={e=>setSuConfirm(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Confirm Password" type="password" />
        <button onClick={() => {
          const emailOk = /.+@.+\..+/.test(suEmail)
          const passOk = suPassword.length >= 6 && suPassword === suConfirm
          const nameOk = suName.trim().length >= 2
          if (!nameOk || !emailOk || !passOk) { setSuError('Fill all fields correctly'); setSuSuccess(''); return }
          setSuError('')
          setSuSuccess('Account created. You can sign in now.')
        }} className="w-full rounded-md bg-[#0B4C72] px-4 py-2 text-sm font-medium">Create Account</button>
        <div className="text-xs text-slate-400 text-center">Already have an account? <button onClick={onOpenLogin} className="underline">Login</button></div>
      </div>
    </Modal>
  )
}

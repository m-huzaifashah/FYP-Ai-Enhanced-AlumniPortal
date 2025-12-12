import React, { useState } from 'react'
import { postSignup, postLogin } from '../api'

export default function Signup({ onOpenLogin, onBack, onOpenForgot }: { onOpenLogin: () => void; onBack: () => void; onOpenForgot: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const RIU_LOGO = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'

  const submit = async () => {
    const emailOk = /.+@.+\..+/.test(email)
    const passOk = password.length >= 6 && password === confirm
    const nameOk = name.trim().length >= 2
    if (!nameOk || !emailOk || !passOk) { setError('Fill all fields correctly'); setSuccess(''); return }
    setError('')
    try {
      const payload: any = { name: name.trim(), email: email.trim(), password, role: 'student' }
      const data = await postSignup(payload)
      try {
        const { token, user } = await postLogin(email.trim(), password)
        try { localStorage.setItem('token', token) } catch {}
        try { localStorage.setItem('role', user.role) } catch {}
        setSuccess('Account created and signed in.')
      } catch (e) {
        setSuccess('Account created. You can sign in now.')
      }
    } catch (e: any) {
      setError(e?.message || 'Signup failed')
      setSuccess('')
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="relative rounded-2xl border border-slate-800 bg-white text-slate-900 shadow">
        <button
          aria-label="Close"
          onClick={onBack}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          ✕
        </button>
        <div className="grid lg:grid-cols-2">
          <div className="p-8">
            <div className="flex items-center gap-3">
              <img src={RIU_LOGO} alt="Riphah International University" className="h-12 w-auto" />
              <div className="text-xl font-semibold">Riphah Alumni Portal</div>
            </div>
            <div className="mt-6 text-sm" />
            <div className="mt-6 space-y-3">
              {error && <div className="rounded-md bg-red-100 text-red-700 text-sm px-3 py-2">{error}</div>}
              {success && <div className="rounded-md bg-green-100 text-green-700 text-sm px-3 py-2">{success}</div>}
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Full Name" />
              <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="your@email.com" />
              <input value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Enter Password" type="password" />
              <input value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Confirm Password" type="password" />
              <div className="text-right text-sm">
                <button onClick={onOpenForgot} className="text-[#0B4C72]">Forgot Password ?</button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button onClick={onOpenLogin} className="flex-1 rounded-md bg-[#0B4C72] px-4 py-2 text-sm font-medium text-white">Login</button>
                <button onClick={submit} className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white">Register</button>
              </div>
            </div>
          </div>
          <div className="hidden lg:block p-8">
            <div className="h-full grid place-items-center">
              <img src="/public/signup.png" alt="Signup Illustration" className="w-full h-auto rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

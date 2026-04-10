import React, { useState } from 'react'

export default function Forgot({ onBack }: { onBack: () => void }) {
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState('')
  const send = () => {
    const ok = /.+@.+\..+/.test(username) || username.trim().length >= 3
    if (!ok) { setStatus('Enter a valid email or username'); return }
    setStatus('OTP sent to your email')
  }
  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-primary bg-white shadow">
        <div className="rounded-t-2xl bg-primary px-6 py-8 text-center">
          <div className="text-5xl">?</div>
          <div className="mt-2 text-2xl font-bold">FORGOT PASSWORD</div>
          <div className="text-primary">ALUMNI PORTAL</div>
        </div>
        <div className="p-8">
          <div className="text-sm mb-1">User Name</div>
          <div className="flex items-center rounded-md border border-secondary bg-white">
            <div className="px-3 text-primary">👤</div>
            <input
              value={username}
              onChange={e=>setUsername(e.target.value)}
              placeholder="Enter User Name e.g. test@something.com"
              className="w-full px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          {status && <div className={"mt-3 rounded-md px-3 py-2 text-sm " + (status.includes('OTP') ? 'bg-primary text-primary' : 'bg-accent text-accent')}>{status}</div>}
          <div className="mt-6 flex items-center gap-4">
            <button onClick={send} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary">Send OTP to Email</button>
            <button onClick={onBack} className="text-primary">Go back</button>
          </div>
        </div>
      </div>
    </section>
  )
}

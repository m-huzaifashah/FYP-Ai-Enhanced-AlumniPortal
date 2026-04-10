import React, { useState } from 'react'
import { Modal } from '../ui'
import { postContact } from '../api'

export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const canSend = name.trim().length >= 2 && /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(email) && message.trim().length >= 4 && !loading
  const send = async () => {
    if (!canSend) return
    setStatus('')
    setLoading(true)
    try {
      await postContact({ name, email, message })
      setStatus('Sent')
      setName(''); setEmail(''); setMessage('')
      onClose()
    } catch (e: any) {
      setStatus(e?.message || 'Failed to send')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Send a Message" titleClassName="text-center w-full">
      <div className="space-y-4 pt-2">
        <p className="text-center text-sm text-white/60 -mt-3 mb-2">Have a question? We'd love to hear from you.</p>
        
        {status && <div className={(status==='Sent' ? 'bg-secondary/10 text-primary' : 'bg-accent/10 text-accent') + ' rounded-lg text-sm px-4 py-3 border border-white/5'}>{status}</div>}
        
        <div className="space-y-3">
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl border border-secondary bg-white px-4 py-3 text-sm text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="Full Name" />
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-secondary bg-white px-4 py-3 text-sm text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="Email Address" />
          <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full rounded-xl border border-secondary bg-white px-4 py-3 text-sm text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="Your Message..." rows={4} />
        </div>

        <button onClick={send} disabled={!canSend} className={(canSend ? 'bg-primary hover:bg-primary/95 shadow-lg shadow-primary/10 hover:scale-[1.02]' : 'bg-primary/40 cursor-not-allowed') + ' w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]'}>{loading ? 'Sending Message…' : 'Send Message'}</button>
      </div>
    </Modal>
  )
}

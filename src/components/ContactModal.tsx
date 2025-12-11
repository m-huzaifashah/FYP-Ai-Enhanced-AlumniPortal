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
    <Modal open={open} onClose={onClose} title="Send a Message">
      <div className="space-y-3">
        {status && <div className={(status==='Sent' ? 'bg-green-900/40 text-green-200' : 'bg-red-900/40 text-red-200') + ' rounded-md text-sm px-3 py-2'}>{status}</div>}
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Name" />
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Email" />
        <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Message" rows={4} />
        <button onClick={send} disabled={!canSend} className={(canSend ? '' : 'opacity-60 cursor-not-allowed') + ' w-full rounded-md bg-[#0B4C72] px-4 py-2 text-sm font-medium'}>{loading ? 'Sending…' : 'Send'}</button>
      </div>
    </Modal>
  )
}

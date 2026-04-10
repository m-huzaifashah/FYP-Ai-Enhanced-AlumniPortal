import React, { useState } from 'react'
import { Modal } from '../ui'
import { createTicket } from '../api'

export default function TicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Issue')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = title.trim().length >= 4 && description.trim().length >= 10 && !loading

  const submit = async () => {
    if (!canSubmit) return
    setStatus('')
    setLoading(true)
    try {
      await createTicket({ title, description, type })
      setStatus('Success')
      setTitle('')
      setDescription('')
      setType('Issue')
      setTimeout(() => onClose(), 1500)
    } catch (e: any) {
      setStatus(e?.message || 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Raise a Support Ticket" titleClassName="text-center w-full">
      <div className="space-y-5 pt-4">
        <p className="text-center text-sm text-white/60 -mt-4 mb-2">Need help? Submit a ticket and our team will get back to you.</p>
        {status && (
          <div className={(status === 'Success' ? 'bg-secondary text-primary border-green-200' : 'bg-accent text-accent border-red-200') + ' rounded-md border px-4 py-3 text-sm'}>
            {status === 'Success' ? 'Your ticket has been submitted successfully.' : status}
          </div>
        )}
        
        <div>
          <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Category / Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-xl bg-white px-4 py-2.5 text-sm text-primary border border-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm appearance-none">
            <option value="Issue">Technical Issue / Bug</option>
            <option value="Request">Feature Request or Access</option>
            <option value="Other">Other Inquiry</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Summary</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl bg-white px-4 py-3 text-sm text-primary border border-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all" placeholder="Brief summary of your issue" />
        </div>

        <div>
          <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Detailed Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl bg-white px-4 py-3 text-sm text-primary border border-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all" placeholder="Please provide as much detail as possible..." rows={4} />
        </div>

        <button onClick={submit} disabled={!canSubmit} className={(canSubmit ? 'bg-primary hover:bg-primary/95 shadow-lg shadow-primary/20 hover:scale-[1.02]' : 'bg-primary/40 cursor-not-allowed') + ' w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] mt-2'}>
          {loading ? 'Submitting Ticket...' : 'Submit Support Ticket'}
        </button>
      </div>
    </Modal>
  )
}

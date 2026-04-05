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
    <Modal open={open} onClose={onClose} title="Raise a Support Ticket">
      <div className="space-y-4">
        {status && (
          <div className={(status === 'Success' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200') + ' rounded-md border px-4 py-3 text-sm'}>
            {status === 'Success' ? 'Your ticket has been submitted successfully.' : status}
          </div>
        )}
        
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-full bg-white px-4 py-2 text-sm text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm appearance-none">
            <option value="Issue">Technical Issue / Bug</option>
            <option value="Request">Feature Request or Access</option>
            <option value="Other">Other Inquiry</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Summary</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-full bg-white px-4 py-2 text-sm text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" placeholder="Brief summary of your issue" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Detailed Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" placeholder="Please provide as much detail as possible..." rows={4} />
        </div>

        <button onClick={submit} disabled={!canSubmit} className={(canSubmit ? '' : 'opacity-50 cursor-not-allowed') + ' w-full rounded-full bg-[#1669bb] px-4 py-2 text-sm font-medium text-white hover:bg-[#125a9e] transition-colors mt-2 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-600'}>
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </Modal>
  )
}

import React from 'react'
import { Modal } from '../ui'

export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Send a Message">
      <div className="space-y-3">
        <input className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Name" />
        <input className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Email" />
        <textarea className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Message" rows={4} />
        <button className="w-full rounded-md bg-[#0B4C72] px-4 py-2 text-sm font-medium">Send</button>
      </div>
    </Modal>
  )
}

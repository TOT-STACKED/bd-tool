import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateOutreach, useUpdateOutreach } from '../../hooks/useOutreach'
import { useQueryClient } from '@tanstack/react-query'
import { PIPELINE_STAGES } from '../../lib/constants'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Input from '../ui/Input'

export default function OutreachModal({ companyId, contacts = [], record, onClose }) {
  const isEdit = !!record
  const [form, setForm] = useState({
    stage: record?.stage || 'identified',
    activity_type: record?.activity_type || 'note',
    contact_id: record?.contact_id || '',
    owner: record?.owner || '',
    notes: record?.notes || '',
    next_action: record?.next_action || '',
    next_action_date: record?.next_action_date?.split('T')[0] || '',
  })

  const create = useCreateOutreach()
  const update = useUpdateOutreach()
  const qc = useQueryClient()

  async function handleSubmit(e) {
    e.preventDefault()
    const data = { ...form, company_id: companyId, contact_id: form.contact_id || null }
    if (isEdit) {
      await update.mutateAsync({ id: record.id, data })
    } else {
      await create.mutateAsync(data)
    }
    qc.invalidateQueries({ queryKey: ['company', companyId] })
    onClose()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Activity' : 'Log Activity'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
              <Select value={form.stage} onChange={e => set('stage', e.target.value)} className="w-full">
                {PIPELINE_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Activity type</label>
              <Select value={form.activity_type} onChange={e => set('activity_type', e.target.value)} className="w-full">
                <option value="note">Note</option>
                <option value="email">Email</option>
                <option value="linkedin">LinkedIn</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
              </Select>
            </div>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact (optional)</label>
              <Select value={form.contact_id} onChange={e => set('contact_id', e.target.value)} className="w-full">
                <option value="">No specific contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.title}</option>)}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Owner</label>
            <Input value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Your name / initials" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="What happened? Key takeaways…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Next action</label>
              <Input value={form.next_action} onChange={e => set('next_action', e.target.value)} placeholder="e.g. Send deck" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due date</label>
              <Input type="date" value={form.next_action_date} onChange={e => set('next_action_date', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? 'Save changes' : 'Log activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

import ContactCard from './ContactCard'

const ORDER = ['c-suite', 'vp', 'director', 'head']

export default function StakeholderGrid({ contacts = [] }) {
  if (!contacts.length) return (
    <p className="text-sm text-gray-400 py-4">No contacts added yet</p>
  )

  const sorted = [...contacts].sort((a, b) =>
    ORDER.indexOf(a.seniority) - ORDER.indexOf(b.seniority)
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map(c => <ContactCard key={c.id} contact={c} />)}
    </div>
  )
}

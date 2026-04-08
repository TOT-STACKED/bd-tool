import { Mail, Phone, Linkedin } from 'lucide-react'
import { SENIORITY_LEVELS } from '../../lib/constants'

export default function ContactCard({ contact }) {
  const seniority = SENIORITY_LEVELS.find(s => s.value === contact.seniority)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-medium text-gray-900 text-sm">{contact.full_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{contact.title}</p>
        </div>
        {seniority && (
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium shrink-0 ${seniority.color}`}>
            {seniority.label}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {contact.email && (
          <a href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-sky-600 bg-gray-50 px-2 py-1 rounded">
            <Mail className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{contact.email}</span>
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-sky-600 bg-gray-50 px-2 py-1 rounded">
            <Phone className="w-3 h-3" />
            {contact.phone}
          </a>
        )}
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
            <Linkedin className="w-3 h-3" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

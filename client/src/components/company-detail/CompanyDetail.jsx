import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExternalLink, Linkedin, Globe } from 'lucide-react'
import { formatCurrency, formatDate, fteBand } from '../../lib/utils'
import { SECTORS, FUNDING_STAGES } from '../../lib/constants'
import TriggerFeed from '../triggers/TriggerFeed'
import StakeholderGrid from './StakeholderGrid'
import OutreachTimeline from './OutreachTimeline'
import Badge from '../ui/Badge'

const TABS = ['Overview', 'Stakeholders', 'Triggers', 'Pipeline']

export default function CompanyDetail({ company, contacts, triggers, outreach }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'Overview'

  const sector = SECTORS.find(s => s.value === company.sector)
  const fundingStage = FUNDING_STAGES.find(f => f.value === company.funding_stage)

  function setTab(tab) {
    setSearchParams({ tab })
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              {sector && (
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sector.color}`}>
                  {sector.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span>{fteBand(company.fte_min, company.fte_max)} FTE</span>
              <span>{company.hq_country} HQ</span>
              {fundingStage && <span>{fundingStage.label} · {formatCurrency(company.last_funding_amount_usd)}</span>}
              {company.last_funding_date && <span>Raised {formatDate(company.last_funding_date)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sky-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {company.linkedin_url && (
              <a href={company.linkedin_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 text-sm">
          <div><span className="text-gray-400">Signals</span> <span className="font-semibold ml-1">{company.trigger_count || 0}</span></div>
          <div><span className="text-gray-400">Contacts</span> <span className="font-semibold ml-1">{contacts.length}</span></div>
          <div><span className="text-gray-400">Activities</span> <span className="font-semibold ml-1">{outreach.length}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-8 py-4 sm:py-6">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-medium text-gray-900 mb-4">Recent Signals</h3>
              <TriggerFeed companyId={company.id} limit={5} showCompany={false} />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-medium text-gray-900 mb-4">Key Stakeholders</h3>
              <StakeholderGrid contacts={contacts.slice(0, 4)} />
            </div>
          </div>
        )}

        {activeTab === 'Stakeholders' && (
          <StakeholderGrid contacts={contacts} />
        )}

        {activeTab === 'Triggers' && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-2xl">
            <TriggerFeed companyId={company.id} limit={50} showCompany={false} />
          </div>
        )}

        {activeTab === 'Pipeline' && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-2xl">
            <OutreachTimeline outreach={outreach} companyId={company.id} contacts={contacts} />
          </div>
        )}
      </div>
    </div>
  )
}

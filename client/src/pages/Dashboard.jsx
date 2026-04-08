import { Link } from 'react-router-dom'
import { Building2, Zap, Kanban, TrendingUp } from 'lucide-react'
import { useCompanies } from '../hooks/useCompanies'
import { useTriggers } from '../hooks/useTriggers'
import { useOutreach } from '../hooks/useOutreach'
import TriggerFeed from '../components/triggers/TriggerFeed'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { PIPELINE_STAGES } from '../lib/constants'

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: companiesData } = useCompanies()
  const { data: triggersData } = useTriggers({ limit: 5 })
  const { data: triggers7d } = useTriggers({ since: since7d, limit: 200 })
  const { data: outreachData } = useOutreach()

  const companies = companiesData?.data || []
  const outreach = outreachData?.data || []
  const recentTriggers = triggers7d?.data || []

  const activeDeals = outreach.filter(o => !['closed_won', 'closed_lost', 'identified'].includes(o.stage)).length
  const pipelineCounts = PIPELINE_STAGES.slice(0, 5).map(s => ({
    ...s,
    count: outreach.filter(o => o.stage === s.value).length
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">BD Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Hospo SaaS & Payments scale-ups · US HQ · 50–500 FTE</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Target Companies" value={companies.length} sub="In watchlist" icon={Building2} color="bg-sky-50 text-sky-600" />
        <StatCard label="Signals this week" value={recentTriggers.length} sub="Funding, hires & jobs" icon={Zap} color="bg-green-50 text-green-600" />
        <StatCard label="Active pipeline" value={activeDeals} sub="Open BD conversations" icon={Kanban} color="bg-purple-50 text-purple-600" />
        <StatCard label="Total signals" value={companies.reduce((s, c) => s + (c.trigger_count || 0), 0)} sub="All time" icon={TrendingUp} color="bg-orange-50 text-orange-600" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trigger feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Live Signal Feed</h2>
                <span className="text-xs text-gray-400">Auto-refreshes every 15s</span>
              </div>
            </CardHeader>
            <CardBody>
              <TriggerFeed limit={12} />
            </CardBody>
          </Card>
        </div>

        {/* Pipeline summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Pipeline</h2>
            </CardHeader>
            <CardBody className="space-y-2">
              {pipelineCounts.map(s => (
                <div key={s.value} className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
                    {s.label}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{s.count}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <Link to="/pipeline" className="text-xs text-sky-600 hover:underline">
                  View full pipeline →
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Top Targets</h2>
            </CardHeader>
            <CardBody className="space-y-2">
              {companies.slice(0, 5).map(co => (
                <Link key={co.id} to={`/companies/${co.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-md transition-colors">
                  <span className="text-sm text-gray-800">{co.name}</span>
                  <span className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
                    {co.trigger_count} ⚡
                  </span>
                </Link>
              ))}
              <div className="pt-2 border-t border-gray-100 mt-1">
                <Link to="/companies" className="text-xs text-sky-600 hover:underline">
                  View all companies →
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

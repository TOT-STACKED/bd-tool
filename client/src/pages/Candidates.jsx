import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, RefreshCw, Search, ExternalLink, CheckCircle, AlertCircle, User } from 'lucide-react'
import { Card, CardBody } from '../components/ui/Card'

const SENIORITY_LABEL = { 'c-suite': 'C-Suite', vp: 'VP', director: 'Director', head: 'Head of', manager: 'Manager', other: 'Other' }
const SENIORITY_COLOR = { 'c-suite': 'bg-purple-100 text-purple-700', vp: 'bg-blue-100 text-blue-700', director: 'bg-indigo-100 text-indigo-700', head: 'bg-teal-100 text-teal-700', manager: 'bg-gray-100 text-gray-600', other: 'bg-gray-100 text-gray-500' }
const STATUS_COLOR = { available: 'bg-green-100 text-green-700', contacted: 'bg-yellow-100 text-yellow-700', in_process: 'bg-blue-100 text-blue-700', placed: 'bg-purple-100 text-purple-700', not_interested: 'bg-gray-100 text-gray-500' }
const STATUS_LABEL = { available: 'Available', contacted: 'Contacted', in_process: 'In Process', placed: 'Placed', not_interested: 'Not Interested' }

export default function Candidates() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [seniority, setSeniority] = useState('')
  const [status, setStatus] = useState('')

  // Debounce search so typing doesn't re-render and lose focus
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', debouncedSearch, seniority, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (seniority) params.set('seniority', seniority)
      if (status) params.set('status', status)
      const res = await fetch(`/api/candidates?${params}`)
      return res.json()
    },
    keepPreviousData: true,
  })

  const candidates = data?.data || []
  const total = data?.total || 0

  async function handleCSV(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) { setImportError('Please upload a .csv file'); return }
    setImporting(true); setImportResult(null); setImportError(null)
    try {
      const text = await file.text()
      const res = await fetch('/api/import/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Import failed')
      setImportResult(d)
      qc.invalidateQueries(['candidates'])
    } catch (err) {
      setImportError(err.message)
    } finally {
      setImporting(false)
    }
  }

  async function updateStatus(id, newStatus) {
    await fetch(`/api/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    qc.invalidateQueries(['candidates'])
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{total} senior sales leaders ready to place</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => handleCSV(e.target.files[0])} />
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">{importResult.created} added · {importResult.updated} updated · {importResult.skipped} skipped</p>
        </div>
      )}
      {importError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{importError}</p>
        </div>
      )}

      {/* Drop zone (when empty) */}
      {total === 0 && !isLoading && (
        <div
          className={`mb-6 border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleCSV(e.dataTransfer.files[0]) }}
        >
          {importing ? (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="font-medium">Importing candidates…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Upload className="w-10 h-10" />
              <p className="text-lg font-medium text-gray-600">Drop your Clay CSV here</p>
              <p className="text-sm">Expects: Full Name, Job Title, Company Name, LinkedIn URL, Email</p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, company, title…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select value={seniority} onChange={e => setSeniority(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All levels</option>
            {Object.entries(SENIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}

      {/* Candidate list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                    {c.full_name?.charAt(0) || <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.full_name}</p>
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.title}</p>
                    {c.current_company && <p className="text-xs text-gray-400 truncate">@ {c.current_company}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.seniority && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SENIORITY_COLOR[c.seniority] || 'bg-gray-100 text-gray-500'}`}>{SENIORITY_LABEL[c.seniority] || c.seniority}</span>}
                  {c.location && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{c.location}</span>}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <select
                    value={c.status || 'available'}
                    onChange={e => updateStatus(c.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-500'}`}
                  >
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {c.email && <a href={`mailto:${c.email}`} className="text-xs text-indigo-600 hover:text-indigo-800 truncate max-w-[120px]">{c.email}</a>}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {total > 0 && candidates.length === 0 && (
        <div className="text-center py-12 text-gray-400">No candidates match your filters</div>
      )}
    </div>
  )
}

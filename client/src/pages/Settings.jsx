import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, AlertCircle, PlayCircle, RefreshCw, Upload, FileText } from 'lucide-react'
import { api } from '../lib/api'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { timeAgo } from '../lib/utils'

export default function Settings() {
  const [runningJob, setRunningJob] = useState(null)
  const [lastJobResult, setLastJobResult] = useState(null)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvResult, setCsvResult] = useState(null)
  const [csvError, setCsvError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  async function handleCSV(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) { setCsvError('Please upload a .csv file'); return }
    setCsvImporting(true)
    setCsvResult(null)
    setCsvError(null)
    try {
      const text = await file.text()
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setCsvResult(data)
    } catch (err) {
      setCsvError(err.message)
    } finally {
      setCsvImporting(false)
    }
  }

  const { data: scraperData, refetch: refetchScrapers } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: api.getScraperStatus,
    refetchInterval: 10_000,
  })

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 30_000,
  })

  const runScraper = useMutation({
    mutationFn: (scraper) => api.runScraper(scraper),
    onSuccess: async (data) => {
      setRunningJob(data.jobId)
      // Poll for completion
      let attempts = 0
      const poll = async () => {
        attempts++
        try {
          const result = await fetch(`/api/scraper/run/${data.jobId}`).then(r => r.json())
          if (result.status === 'done' || result.status === 'error' || attempts > 20) {
            setRunningJob(null)
            setLastJobResult(result)
            refetchScrapers()
          } else {
            setTimeout(poll, 1000)
          }
        } catch {
          setRunningJob(null)
        }
      }
      setTimeout(poll, 1000)
    }
  })

  const scrapers = scraperData?.scrapers || []
  const isServerUp = !!health?.ok

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Scraper status, integrations, and configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server status */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">System Status</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Server</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isServerUp ? 'text-green-600' : 'text-red-600'}`}>
                {isServerUp ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {isServerUp ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Slack</span>
              <span className="text-xs text-yellow-600">Configure SLACK_WEBHOOK_URL in .env</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">HubSpot</span>
              <span className="text-xs text-yellow-600">Configure HUBSPOT_API_KEY in .env</span>
            </div>
          </CardBody>
        </Card>

        {/* Scraper controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Scrapers</h2>
              {lastJobResult && (
                <span className={`text-xs ${lastJobResult.status === 'done' ? 'text-green-600' : 'text-red-600'}`}>
                  Last run: {lastJobResult.results_count ?? 0} signal{lastJobResult.results_count !== 1 ? 's' : ''} added
                </span>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {scrapers.map(s => (
                <div key={s.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{s.name} scraper</p>
                    <p className="text-xs text-gray-400">
                      {s.last_run ? `Last run ${timeAgo(s.last_run)} · ${s.last_count ?? 0} signals` : 'Never run'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={runningJob !== null}
                    onClick={() => runScraper.mutate(s.name)}
                  >
                    {runningJob ? (
                      <><RefreshCw className="w-3 h-3 animate-spin" /> Running…</>
                    ) : (
                      <><PlayCircle className="w-3 h-3" /> Run now</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              variant="secondary"
              disabled={runningJob !== null}
              onClick={() => runScraper.mutate('all')}
            >
              {runningJob ? 'Running…' : 'Run all scrapers'}
            </Button>
          </CardBody>
        </Card>

        {/* CSV Import */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Import Companies (CSV)</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-4">
              Upload a CSV with columns: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">company_name, sector, hq_country, website, linkedin_url, fte_min, fte_max, funding_stage, amount_usd, funding_date</code>
            </p>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleCSV(e.dataTransfer.files[0]) }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleCSV(e.target.files[0])}
              />
              {csvImporting ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm">Importing…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm font-medium text-gray-600">Drop CSV here or click to upload</p>
                  <p className="text-xs">Existing companies will be updated, new ones created</p>
                </div>
              )}
            </div>

            {/* Result */}
            {csvResult && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Import complete</p>
                  <p>{csvResult.created} created · {csvResult.updated} updated · {csvResult.skipped} skipped</p>
                </div>
              </div>
            )}
            {csvError && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800">{csvError}</p>
              </div>
            )}

            {/* Download template */}
            <div className="mt-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <a
                href="data:text/csv;charset=utf-8,company_name,sector,hq_country,website,linkedin_url,fte_min,fte_max,funding_stage,amount_usd,funding_date%0AExample Co,hospo-saas,US,https://example.com,https://linkedin.com/company/example,100,200,series-b,5000000,2024-01-01"
                download="bd_import_template.csv"
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Download template CSV
              </a>
            </div>
          </CardBody>
        </Card>

        {/* Config guide */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Configuration</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600 mb-3">Edit <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env</code> in the project root to enable integrations:</p>
            <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-300 space-y-1">
              <p><span className="text-gray-500"># Slack — paste your Incoming Webhook URL</span></p>
              <p>SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...</p>
              <p className="mt-2"><span className="text-gray-500"># HubSpot — Private App access token</span></p>
              <p>HUBSPOT_API_KEY=pat-na1-...</p>
              <p className="mt-2"><span className="text-gray-500"># Crunchbase (Phase 2)</span></p>
              <p>CRUNCHBASE_API_KEY=your_key_here</p>
            </div>
            <p className="text-xs text-gray-400 mt-3">Restart the server after changing .env values.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useCompanies } from '../hooks/useCompanies'
import CompanyFilters from '../components/companies/CompanyFilters'
import CompanyTable from '../components/companies/CompanyTable'

export default function Companies() {
  const [filters, setFilters] = useState({})
  const { data, isLoading } = useCompanies(filters)
  const companies = data?.data || []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Target Companies</h1>
        <p className="text-sm text-gray-500 mt-1">{data?.total || 0} companies in your watchlist</p>
      </div>

      <div className="mb-4">
        <CompanyFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <CompanyTable companies={companies} isLoading={isLoading} />
      </div>
    </div>
  )
}

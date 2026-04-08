import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCompany } from '../hooks/useCompanies'
import CompanyDetail from '../components/company-detail/CompanyDetail'
import Spinner from '../components/ui/Spinner'

export default function CompanyPage() {
  const { id } = useParams()
  const { data, isLoading, error } = useCompany(id)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>
  )

  if (error || !data?.company) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Company not found</p>
      <Link to="/companies" className="text-sky-600 text-sm mt-2 inline-block hover:underline">← Back to companies</Link>
    </div>
  )

  return (
    <div>
      <div className="px-8 py-4 bg-white border-b border-gray-100">
        <Link to="/companies" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-3.5 h-3.5" /> All companies
        </Link>
      </div>
      <CompanyDetail
        company={data.company}
        contacts={data.contacts || []}
        triggers={data.triggers || []}
        outreach={data.outreach || []}
      />
    </div>
  )
}

import CompanyRow from './CompanyRow'
import Spinner from '../ui/Spinner'

const HEADERS = ['Company', 'Sector', 'FTE', 'Funding', 'Signals', 'Last Raise', '']

export default function CompanyTable({ companies = [], isLoading }) {
  if (isLoading) return (
    <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
  )

  if (!companies.length) return (
    <div className="text-center py-16 text-gray-400 text-sm">No companies match your filters</div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {HEADERS.map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {companies.map(co => <CompanyRow key={co.id} company={co} />)}
        </tbody>
      </table>
    </div>
  )
}

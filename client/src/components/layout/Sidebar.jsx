import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Kanban, Settings, Target, X, Users } from 'lucide-react'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/candidates', icon: Users, label: 'Candidates' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ onClose }) {
  return (
    <aside className="w-56 h-screen bg-gray-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-700">
        <Target className="w-5 h-5 text-sky-400 mr-2" />
        <span className="font-semibold text-sm tracking-tight flex-1">BD Intelligence</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 -mr-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-sky-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">Hospo SaaS & Payments</p>
        <p className="text-xs text-gray-600 mt-0.5">US HQ · 50–500 FTE</p>
      </div>
    </aside>
  )
}

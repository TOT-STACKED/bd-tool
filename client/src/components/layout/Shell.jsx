import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Kanban, Settings, Target, Menu } from 'lucide-react'
import { cn } from '../../lib/utils'
import Sidebar from './Sidebar'

const mobileLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Shell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-10">
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-gray-900 flex items-center px-4 shrink-0 gap-3">
          <Target className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="font-semibold text-sm text-white tracking-tight flex-1">BD Intelligence</span>
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-gray-400 hover:text-white p-1 -mr-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page content — extra bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30 safe-area-bottom">
          {mobileLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs',
                isActive ? 'text-sky-600' : 'text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

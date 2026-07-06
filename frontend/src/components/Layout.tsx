import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearTokens } from '../api/auth'

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Expenses', icon: '📋' },
]

export default function Layout() {
  const navigate = useNavigate()

  const logout = () => {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="h-screen flex flex-col sm:flex-row bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full sm:w-56 sm:h-full shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-gray-200 flex sm:flex-col justify-between overflow-y-auto">
        <div>
          <div className="px-5 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">SmartExpense</span>
          </div>
          <nav className="flex sm:flex-col gap-1 p-2">
            {nav.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <span>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full text-left text-sm text-gray-400 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

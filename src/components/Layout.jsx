import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = {
  vendor: [
    { to: '/vendor',          label: 'Dashboard' },
    { to: '/vendor/profile',  label: 'My Profile' },
    { to: '/vendor/location', label: 'My Location' },
    { to: '/vendor/status',   label: 'Applications' },
  ],
  community_manager: [
    { to: '/manager', label: 'Dashboard' },
    { to: '/manager/vendors', label: 'My Vendors' },
    { to: '/manager/map', label: 'Vendor Map' },
    { to: '/manager/community', label: 'My Community' },
  ],
  admin: [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/communities', label: 'Communities' },
    { to: '/admin/managers', label: 'Managers' },
    { to: '/admin/vendors', label: 'Vendors' },
  ],
}

const roleLabels = {
  vendor: 'Vendor',
  community_manager: 'Community Manager',
  admin: 'Administrator',
}

const roleBadgeColors = {
  vendor: 'bg-blue-100 text-blue-700',
  community_manager: 'bg-green-100 text-green-700',
  admin: 'bg-teal-100 text-teal-700',
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = user ? (navLinks[user.role] || []) : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Speak2Vendors" className="h-8 w-auto" />
          </Link>

          {/* Nav — always visible */}
          {user && (
            <nav className="flex items-center gap-0.5 overflow-x-auto">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.to ||
                    (link.to !== '/' && link.to !== '/vendor' && link.to !== '/manager' && link.to !== '/admin' && location.pathname.startsWith(link.to))
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          {user ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${roleBadgeColors[user.role]}`}>
                {roleLabels[user.role]}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 shrink-0">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100">
                Sign in
              </Link>
              <Link to="/signup" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        © {new Date().getFullYear()} VendorHub — Senior Living Partner Portal
      </footer>
    </div>
  )
}

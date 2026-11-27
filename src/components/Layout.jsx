import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Nav icons (single source so desktop + mobile match) ───────────────────────
const ICONS = {
  home: <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
  chat: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />,
  search: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />,
  map: <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />,
  building: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />,
  user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  doc: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />,
  pin: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />,
  grid: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />,
  briefcase: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 6.006a2.18 2.18 0 0 1-.75.332 48.08 48.08 0 0 1-15 0 2.18 2.18 0 0 1-.75-.332m16.5 0v-5.25m-16.5 5.25a2.18 2.18 0 0 1-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />,
}

const navLinks = {
  vendor: [
    { to: '/vendor',                label: 'Dashboard',      icon: 'home' },
    { to: '/vendor/profile',        label: 'My Profile',     icon: 'user' },
    { to: '/vendor/communications', label: 'Communications', icon: 'chat' },
    { to: '/vendor/status',         label: 'Applications',   icon: 'doc' },
    { to: '/vendor/location',       label: 'My Location',    icon: 'pin' },
  ],
  community_manager: [
    { to: '/manager',                label: 'Dashboard',      icon: 'home' },
    { to: '/manager/communications', label: 'Communications', icon: 'chat' },
    { to: '/manager/vendors',        label: 'My Vendors',     icon: 'users' },
    { to: '/manager/find-vendors',   label: 'Find Vendors',   icon: 'search' },
    { to: '/manager/map',            label: 'Vendor Map',     icon: 'map' },
    { to: '/manager/community',      label: 'My Community',   icon: 'building' },
  ],
  admin: [
    { to: '/admin',             label: 'Overview',    icon: 'grid' },
    { to: '/admin/communities', label: 'Communities', icon: 'building' },
    { to: '/admin/managers',    label: 'Managers',    icon: 'users' },
    { to: '/admin/vendors',     label: 'Vendors',     icon: 'briefcase' },
    { to: '/admin/content',     label: 'Content',     icon: 'doc' },
  ],
}

const roleLabels = {
  vendor: 'Vendor',
  community_manager: 'Community Manager',
  admin: 'Administrator',
}

const roleBadgeColors = {
  vendor: 'bg-white/15 text-blue-100',
  community_manager: 'bg-green-500/20 text-green-200',
  admin: 'bg-white/15 text-blue-100',
}

function NavIcon({ name, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

function isActive(pathname, to) {
  const roots = ['/', '/vendor', '/manager', '/admin']
  if (pathname === to) return true
  if (roots.includes(to)) return false
  return pathname.startsWith(to)
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const links = user ? (navLinks[user.role] || []) : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0d3f73] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
            <img src="/logo.png" alt="Vendor Hub" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav — icon + label */}
          {user && (
            <nav className="hidden lg:flex items-center gap-0.5">
              {links.map((link) => {
                const active = isActive(location.pathname, link.to)
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <NavIcon name={link.icon} className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right side */}
          {user ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${roleBadgeColors[user.role]}`}>
                {roleLabels[user.role]}
              </span>
              <button
                onClick={handleLogout}
                className="hidden lg:inline text-xs text-blue-200 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Sign out
              </button>
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white hover:bg-white/15 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />}
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex gap-2 shrink-0">
              <Link to="/signin" className="text-sm text-blue-100 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10">
                Sign in
              </Link>
              <Link to="/signup" className="text-sm bg-white text-[#0d3f73] font-semibold px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu panel */}
        {user && menuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0d3f73] shadow-xl">
            <nav className="max-w-6xl mx-auto px-3 py-3 space-y-1">
              {links.map((link) => {
                const active = isActive(location.pathname, link.to)
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition-colors ${
                      active ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <NavIcon name={link.icon} className="w-5 h-5 flex-shrink-0" />
                    {link.label}
                  </Link>
                )
              })}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-blue-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            © {new Date().getFullYear()} Vendor Hub — Senior Living Partner Portal
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            {/* Legal links */}
            <div className="flex items-center gap-4 text-xs">
              <a href="https://www.speak2family.com/terms" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#1a73c8] transition-colors">
                Terms of Service
              </a>
              <a href="https://www.speak2family.com/privacy-policy" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#1a73c8] transition-colors">
                Privacy Policy
              </a>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/speak2family" target="_blank" rel="noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-[#1a73c8] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/speak2family/" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-[#1a73c8] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/speak2-family" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-[#1a73c8] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

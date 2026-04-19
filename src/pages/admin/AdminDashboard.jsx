import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCommunities, getUsers, getApplications } from '../../utils/storage'

function StatCard({ label, value, color, to }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  )
}

export default function AdminDashboard() {
  const [communities, setCommunities] = useState([])
  const [users, setUsers] = useState([])
  const [applications, setApplications] = useState([])

  useEffect(() => {
    async function load() {
      const [comms, usrs, apps] = await Promise.all([
        getCommunities(),
        getUsers(),
        getApplications(),
      ])
      setCommunities(comms)
      setUsers(usrs)
      setApplications(apps)
    }
    load()
  }, [])

  const managers = users.filter((u) => u.role === 'community_manager')
  const vendors = users.filter((u) => u.role === 'vendor')
  const pending = applications.filter((a) => a.status === 'pending')

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage communities, managers, and monitor vendor activity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Communities" value={communities.length} color="text-blue-600" to="/admin/communities" />
        <StatCard label="Managers" value={managers.length} color="text-green-600" to="/admin/managers" />
        <StatCard label="Vendors" value={vendors.length} color="text-teal-600" to="/admin/vendors" />
        <StatCard label="Pending applications" value={pending.length} color="text-amber-600" to="/admin/communities" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/communities" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Manage Communities</h2>
          </div>
          <p className="text-sm text-gray-500">
            Add or edit senior living communities, set locations on the map, and configure care levels.
          </p>
        </Link>

        <Link to="/admin/managers" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Manage Managers</h2>
          </div>
          <p className="text-sm text-gray-500">
            Create community manager accounts and assign them to specific communities.
          </p>
        </Link>
      </div>

      {/* Recent communities */}
      {communities.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Communities</h2>
          <div className="space-y-2">
            {communities.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.address}</p>
                </div>
                <div className="flex flex-wrap gap-1 hidden sm:flex">
                  {c.careLevels?.slice(0, 2).map((cl) => (
                    <span key={cl} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cl}</span>
                  ))}
                  {(c.careLevels?.length || 0) > 2 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{c.careLevels.length - 2}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

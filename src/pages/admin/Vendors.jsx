import { useState, useEffect } from 'react'
import { getUsers, getApplications, getCommunities } from '../../utils/storage'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusConfig = {
  pending:  { label: 'Pending', bg: 'bg-amber-100',  text: 'text-amber-800' },
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-800' },
  denied:   { label: 'Denied',  bg: 'bg-red-100',    text: 'text-red-800' },
}

export default function VendorsAdmin() {
  const [vendors, setVendors] = useState([])
  const [applications, setApplications] = useState([])
  const [communities, setCommunities] = useState([])

  useEffect(() => {
    setVendors(getUsers().filter((u) => u.role === 'vendor'))
    setApplications(getApplications())
    setCommunities(getCommunities())
  }, [])

  const communityMap = Object.fromEntries(communities.map((c) => [c.id, c]))

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-500 mt-0.5">{vendors.length} registered vendor{vendors.length !== 1 ? 's' : ''}</p>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No vendors registered yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((vendor) => {
            const vendorApps = applications.filter((a) => a.vendorId === vendor.id)
            const approved = vendorApps.filter((a) => a.status === 'approved')
            const pending = vendorApps.filter((a) => a.status === 'pending')
            return (
              <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-teal-700">
                      {vendor.name?.charAt(0)?.toUpperCase() || 'V'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(vendor.createdAt)}</p>

                    {vendorApps.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {vendorApps.map((app) => {
                          const cfg = statusConfig[app.status] || statusConfig.pending
                          const community = communityMap[app.communityId]
                          return (
                            <div key={app.id} className="flex items-center gap-2 text-xs">
                              <span className={`px-1.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                                {cfg.label}
                              </span>
                              <span className="text-gray-500 truncate">
                                {app.businessName}{community ? ` → ${community.name}` : ''}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    {approved.length > 0 && (
                      <p className="text-xs text-green-700 font-medium">{approved.length} approved</p>
                    )}
                    {pending.length > 0 && (
                      <p className="text-xs text-amber-700 font-medium">{pending.length} pending</p>
                    )}
                    {vendorApps.length === 0 && (
                      <p className="text-xs text-gray-400">No applications</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

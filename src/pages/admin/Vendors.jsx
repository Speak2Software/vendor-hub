import { useState, useEffect } from 'react'
import { getUsers, getApplications, getCommunities, getReviewsForVendor } from '../../utils/storage'
import StarRating from '../../components/StarRating'

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
  const [reviewsByVendor, setReviewsByVendor] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const [usrs, apps, comms] = await Promise.all([getUsers(), getApplications(), getCommunities()])
      const vendorList = usrs.filter((u) => u.role === 'vendor')
      setVendors(vendorList)
      setApplications(apps)
      setCommunities(comms)
      // Fetch reviews for all vendors in parallel
      const reviewResults = await Promise.all(vendorList.map((v) => getReviewsForVendor(v.id)))
      const byVendor = Object.fromEntries(vendorList.map((v, i) => [v.id, reviewResults[i]]))
      setReviewsByVendor(byVendor)
    }
    load()
  }, [])

  const communityMap = Object.fromEntries(communities.map((c) => [c.id, c]))

  const q = search.trim().toLowerCase()
  const filtered = q
    ? vendors.filter((v) => {
        const businessNames = applications.filter((a) => a.vendorId === v.id).map((a) => a.businessName)
        return [v.name, v.email, ...businessNames].some((s) => s?.toLowerCase().includes(q))
      })
    : vendors

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-500 mt-0.5">{vendors.length} registered vendor{vendors.length !== 1 ? 's' : ''}</p>
      </div>

      {vendors.length > 0 && (
        <div className="relative mb-4">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or business…"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent bg-white"
          />
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No vendors registered yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No vendors match "{search}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((vendor) => {
            const vendorApps = applications.filter((a) => a.vendorId === vendor.id)
            const approved = vendorApps.filter((a) => a.status === 'approved')
            const pending = vendorApps.filter((a) => a.status === 'pending')
            const vendorReviews = reviewsByVendor[vendor.id] || []
            const ratedReviews = vendorReviews.filter((r) => r.rating > 0)
            const avgRating = ratedReviews.length
              ? Math.round((ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length) * 10) / 10
              : null
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
                    {avgRating ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating rating={Math.round(avgRating)} />
                        <span className="text-[11px] text-amber-600 font-medium">{avgRating} avg · {ratedReviews.length} review{ratedReviews.length !== 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(vendor.createdAt)}</p>
                    )}

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

import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getCommunity, getVendorProfiles, getApplicationsForCommunity, haversineDistance,
} from '../../utils/storage'
import { normalizeLocations } from '../../utils/vendorLocations'
import { SERVICE_CATEGORIES, categoryIcon } from '../../utils/serviceCategories'

const STATUS_META = {
  approved: { label: 'Approved',        badge: 'bg-emerald-100 text-emerald-700' },
  pending:  { label: 'Pending review',  badge: 'bg-amber-100 text-amber-700' },
  denied:   { label: 'Denied',          badge: 'bg-red-100 text-red-700' },
  revoked:  { label: 'Revoked',         badge: 'bg-red-100 text-red-700' },
  none:     { label: 'Not yet applied', badge: 'bg-[#deeef9] text-[#1a73c8]' },
}

const DISTANCE_OPTIONS = [
  { value: 'any', label: 'Any distance' },
  { value: 10,    label: 'Within 10 mi' },
  { value: 25,    label: 'Within 25 mi' },
  { value: 50,    label: 'Within 50 mi' },
  { value: 100,   label: 'Within 100 mi' },
]

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All vendors' },
  { value: 'none',     label: 'Not yet applied' },
  { value: 'pending',  label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
]

export default function FindVendors() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [community, setCommunity] = useState(null)
  const [vendors, setVendors]     = useState([])
  const [apps, setApps]           = useState([])
  const [loaded, setLoaded]       = useState(false)

  const [q, setQ]                     = useState('')
  const [category, setCategory]       = useState(searchParams.get('category') || '')
  const [maxDistance, setMaxDistance] = useState('any')
  const [status, setStatus]           = useState('all')

  // A category arriving in the URL means the manager came from a coverage gap.
  const fromCoverage = Boolean(searchParams.get('category'))

  useEffect(() => {
    async function load() {
      if (!user?.communityId) { setLoaded(true); return }
      const [comm, vps, applications] = await Promise.all([
        getCommunity(user.communityId),
        getVendorProfiles(),
        getApplicationsForCommunity(user.communityId),
      ])
      setCommunity(comm)
      setVendors(vps)
      setApps(applications)
      setLoaded(true)
    }
    load()
  }, [user?.communityId])

  useEffect(() => {
    setCategory(searchParams.get('category') || '')
  }, [searchParams])

  // ── Enrich each vendor with distance + their application status here ───────
  const enriched = useMemo(() => {
    const appByVendor = Object.fromEntries(apps.map((a) => [a.vendorId, a]))
    return vendors.map((v) => {
      const locs = normalizeLocations(v)
      let distanceMiles = null
      if (community?.location && locs.length) {
        const d = Math.min(...locs.map((l) =>
          haversineDistance(community.location.lat, community.location.lng, l.lat, l.lng)
        ))
        distanceMiles = Math.round(d * 10) / 10
      }
      const app = appByVendor[v.userId] || null
      return {
        ...v,
        locationCount: locs.length,
        distanceMiles,
        app,
        status: app ? app.status : 'none',
        displayName: v.businessName || v.name || 'Unnamed vendor',
      }
    })
  }, [vendors, apps, community])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return enriched
      .filter((v) => {
        if (category && v.serviceCategory !== category) return false
        if (status !== 'all' && v.status !== status) return false
        if (maxDistance !== 'any') {
          if (v.distanceMiles == null || v.distanceMiles > maxDistance) return false
        }
        if (needle) {
          const hay = [
            v.businessName, v.name, v.serviceCategory,
            v.servicesOffered, v.businessDescription, v.email,
          ].filter(Boolean).join(' ').toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      })
      .sort((a, b) => {
        // Nearest first; vendors with no location sink to the bottom.
        if (a.distanceMiles == null && b.distanceMiles == null) {
          return a.displayName.localeCompare(b.displayName)
        }
        if (a.distanceMiles == null) return 1
        if (b.distanceMiles == null) return -1
        return a.distanceMiles - b.distanceMiles
      })
  }, [enriched, q, category, maxDistance, status])

  const activeFilters = (category ? 1 : 0) + (maxDistance !== 'any' ? 1 : 0) + (status !== 'all' ? 1 : 0) + (q.trim() ? 1 : 0)

  function clearFilters() {
    setQ(''); setCategory(''); setMaxDistance('any'); setStatus('all')
    setSearchParams({}, { replace: true })
  }

  if (!user?.communityId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">You are not assigned to a community yet.</p>
          <p className="text-gray-400 text-xs mt-1">Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  const selectCls = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a73c8]'

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0d3f73] via-[#135aa0] to-[#1a73c8]">
        <div className="max-w-4xl mx-auto px-4 pt-7 pb-7 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Find Vendors</h1>
            <p className="text-blue-100 text-sm mt-0.5">Search every vendor on Vendor Hub and invite them to serve your community</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-7 space-y-4">

        {/* Coverage-gap context banner */}
        {fromCoverage && category && (
          <div className="bg-[#eef6fd] border border-[#b3d4ed] rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">{categoryIcon(category)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0d3f73]">Filling a coverage gap: {category}</p>
              <p className="text-xs text-[#135aa0] mt-0.5">
                You don't have an approved vendor in this service area yet. Here's who's available.
              </p>
            </div>
          </div>
        )}

        {/* ── Search + filters ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by business name, service, or what they offer…"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73c8]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              <option value="">All service areas</option>
              {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={maxDistance} onChange={(e) => setMaxDistance(e.target.value === 'any' ? 'any' : Number(e.target.value))} className={selectCls}>
              {DISTANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400">
            {loaded
              ? <>Showing <span className="font-bold text-gray-700">{filtered.length}</span> of {enriched.length} vendors</>
              : 'Loading vendors…'}
          </p>
        </div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        {loaded && filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-12 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm font-semibold text-gray-600">No vendors match your search</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Try widening the distance or clearing filters. You can also print a recruitment flyer to
              attract new vendors to your community.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-xs text-blue-600 font-semibold hover:underline">
                  Clear filters
                </button>
              )}
              <Link to="/manager/communications?tab=flyer" className="text-xs text-blue-600 font-semibold hover:underline">
                Print a recruitment flyer →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((v) => {
              const meta = STATUS_META[v.status] || STATUS_META.none
              return (
                <div key={v.userId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    {/* Logo / icon */}
                    <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-xl overflow-hidden">
                      {v.logoUrl
                        ? <img src={v.logoUrl} alt="" className="w-full h-full object-contain" />
                        : categoryIcon(v.serviceCategory)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">{v.displayName}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {v.serviceCategory
                          ? <>{categoryIcon(v.serviceCategory)} {v.serviceCategory}</>
                          : <span className="italic text-gray-400">No service area set</span>}
                        {v.yearsInBusiness && <> · {v.yearsInBusiness} yrs in business</>}
                      </p>

                      {(v.servicesOffered || v.businessDescription) && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {v.servicesOffered || v.businessDescription}
                        </p>
                      )}

                      <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-gray-400">
                        {v.distanceMiles != null ? (
                          <span>📍 {v.distanceMiles} mi away</span>
                        ) : (
                          <span className="italic">No location set</span>
                        )}
                        {v.locationCount > 1 && <span>· {v.locationCount} locations</span>}
                        {(v.contactEmail || v.email) && <span>· {v.contactEmail || v.email}</span>}
                      </div>
                    </div>

                    {/* Link through to the full application when there is one */}
                    {v.app && (
                      <Link
                        to={`/manager/application/${v.app.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline flex-shrink-0 whitespace-nowrap"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Map cross-link */}
        <div className="text-center pt-1">
          <Link to="/manager/map" className="text-xs text-blue-600 font-semibold hover:underline">
            Prefer a map view? Open the Vendor Map →
          </Link>
        </div>
      </div>
    </div>
  )
}

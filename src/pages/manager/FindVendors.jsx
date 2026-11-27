import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getCommunity, getVendorProfiles, getApplicationsForCommunity, haversineDistance,
} from '../../utils/storage'
import { normalizeLocations } from '../../utils/vendorLocations'
import { SERVICE_CATEGORIES, categoryIcon } from '../../utils/serviceCategories'
import InviteVendorModal from './InviteVendorModal'
import PageLoader from '../../components/PageLoader'
import { stripTags } from '../../components/RichTextEditor'

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
  const [invitee, setInvitee]         = useState(null)

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
  }, [enriched, q, category, maxDistance])

  // Vendor count per service category — drives the picker tiles.
  const categoryCounts = useMemo(() => {
    const counts = {}
    enriched.forEach((v) => {
      if (v.serviceCategory) counts[v.serviceCategory] = (counts[v.serviceCategory] || 0) + 1
    })
    return counts
  }, [enriched])

  const activeFilters = (category ? 1 : 0) + (maxDistance !== 'any' ? 1 : 0) + (q.trim() ? 1 : 0)

  function clearFilters() {
    setQ(''); setCategory(''); setMaxDistance('any')
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

  if (!loaded) return <PageLoader label="Loading vendors…" />

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#0d3f73] via-[#135aa0] to-[#1a73c8]">
        <div className="max-w-4xl mx-auto px-4 pt-7 pb-7 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Find Vendors</h1>
            <p className="text-blue-100 text-sm mt-0.5">Pick the kind of vendor you need, then invite them to your community</p>
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

        {/* ── Step 1: choose the service you need ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">What kind of vendor are you looking for?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* All vendors */}
            <button
              onClick={() => { setCategory(''); setSearchParams({}, { replace: true }) }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                category === ''
                  ? 'border-[#1a73c8] bg-[#eef6fd] ring-1 ring-[#1a73c8]'
                  : 'border-gray-200 bg-white hover:border-[#9cc4e8]'
              }`}
            >
              <span className="text-xl flex-shrink-0">🗂️</span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold truncate ${category === '' ? 'text-[#0d3f73]' : 'text-gray-700'}`}>All vendors</span>
                <span className="block text-[11px] text-gray-400">{enriched.length} total</span>
              </span>
            </button>

            {SERVICE_CATEGORIES.map((c) => {
              const count = categoryCounts[c] || 0
              const selected = category === c
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-[#1a73c8] bg-[#eef6fd] ring-1 ring-[#1a73c8]'
                      : count === 0
                        ? 'border-gray-100 bg-gray-50 opacity-60 hover:opacity-100'
                        : 'border-gray-200 bg-white hover:border-[#9cc4e8]'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{categoryIcon(c)}</span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold truncate ${selected ? 'text-[#0d3f73]' : 'text-gray-700'}`}>{c}</span>
                    <span className="block text-[11px] text-gray-400">{count === 0 ? 'None yet' : `${count} available`}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Search by name + distance ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Or search by vendor name…"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73c8]"
            />
          </div>
          <div className="relative sm:w-48 flex-shrink-0">
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value === 'any' ? 'any' : Number(e.target.value))}
              className="w-full appearance-none border border-gray-200 rounded-xl pl-3 pr-9 py-2.5 text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a73c8]"
            >
              {DISTANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* ── Results heading ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-sm font-bold text-gray-800">
            {category || 'All'} vendors
            <span className="text-gray-400 font-semibold"> · {filtered.length}</span>
          </p>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="text-xs text-blue-600 font-semibold hover:underline">
              Reset
            </button>
          )}
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
                          {stripTags(v.servicesOffered) || v.businessDescription}
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

                    {/* Actions — no invite for vendors already approved or in progress */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {v.status !== 'approved' && v.status !== 'pending' && (
                        <button
                          onClick={() => setInvitee(v)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1a73c8] hover:bg-[#135aa0] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          Invite
                        </button>
                      )}
                      {v.app && (
                        <Link
                          to={`/manager/application/${v.app.id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                      )}
                    </div>
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

      {invitee && (
        <InviteVendorModal
          vendor={invitee}
          community={community}
          onClose={() => setInvitee(null)}
        />
      )}
    </div>
  )
}

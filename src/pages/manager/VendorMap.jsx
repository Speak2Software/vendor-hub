import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  MapContainer, TileLayer, Marker, Circle, Popup, Tooltip, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../context/AuthContext'
import {
  getCommunity,
  getVendorProfiles,
  getApplicationsForCommunity,
  getReviewsForCommunity,
  haversineDistance,
} from '../../utils/storage'
import StarRating from '../../components/StarRating'

// ── Icons ────────────────────────────────────────────────────────────────────
function makeVendorIcon(status) {
  const colors = {
    approved: '#16a34a',
    pending:  '#f59e0b',
    none:     '#6366f1',
  }
  const bg = colors[status] || colors.none
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;
      background:${bg};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      cursor:pointer;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function makeVendorIconLarge(status) {
  const colors = { approved: '#16a34a', pending: '#f59e0b', none: '#6366f1' }
  const bg = colors[status] || colors.none
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;
      background:${bg};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 3px 12px rgba(0,0,0,0.4);
      cursor:pointer;
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

const communityIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:26px;height:26px;
    background:#2563eb;
    border:3px solid white;
    border-radius:6px;
    box-shadow:0 3px 10px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;
  ">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

// ── Map helpers ───────────────────────────────────────────────────────────────
function FlyTo({ lat, lng, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1 })
  }, [lat, lng, zoom])
  return null
}

const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 75, 100]

const STATUS_META = {
  approved: { label: 'Approved',         dot: 'bg-green-500',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  pending:  { label: 'Pending',          dot: 'bg-amber-400',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
  none:     { label: 'No application',   dot: 'bg-indigo-400', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all',      label: 'All',            dot: null },
  { value: 'approved', label: 'Approved',        dot: 'bg-green-500' },
  { value: 'pending',  label: 'Pending',         dot: 'bg-amber-400' },
  { value: 'none',     label: 'No Application',  dot: 'bg-indigo-400' },
]

const SERVICE_ICONS = {
  'Medical / Healthcare': '🏥',
  'Transportation': '🚐',
  'Food & Nutrition Services': '🍽️',
  'Housekeeping & Laundry': '🧹',
  'Maintenance & Facilities': '🔧',
  'Personal Care & Grooming': '💆',
  'Physical / Occupational Therapy': '🤸',
  'Mental Health & Counseling': '🧠',
  'Entertainment & Activities': '🎭',
  'Technology & Telehealth': '💻',
  'Financial Services': '💼',
  'Legal Services': '⚖️',
  'Insurance': '📋',
  'Staffing & Workforce': '👥',
  'Pharmacy & Medical Supplies': '💊',
  'Other': '📦',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VendorMap() {
  const { user } = useAuth()
  const filterBarRef = useRef(null)

  const [community,      setCommunity]      = useState(null)
  const [radius,         setRadius]         = useState(25)
  const [vendorsInRange, setVendorsInRange] = useState([])
  const [reviewByApp,    setReviewByApp]    = useState({})
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [hoveredId,      setHoveredId]      = useState(null)
  const [panelOpen,      setPanelOpen]      = useState(false)

  // ── Filter state ─────────────────────────────────────────────────────────
  const [statusFilter,     setStatusFilter]     = useState('all')       // 'all' | 'approved' | 'pending' | 'none'
  const [activeCategories, setActiveCategories] = useState(new Set())   // empty = all shown

  const mapCenter = community?.location || { lat: 39.5, lng: -98.35 }

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (!user?.communityId) return
      const comm = await getCommunity(user.communityId)
      setCommunity(comm)
      if (!comm?.location) return

      const [applications, vendorProfiles, revs] = await Promise.all([
        getApplicationsForCommunity(user.communityId),
        getVendorProfiles(),
        getReviewsForCommunity(user.communityId),
      ])
      setReviewByApp(Object.fromEntries(revs.map((r) => [r.appId, r])))
      const appByVendor = Object.fromEntries(applications.map((a) => [a.vendorId, a]))

      const enriched = vendorProfiles
        .map((vp) => {
          const dist = haversineDistance(
            comm.location.lat, comm.location.lng,
            vp.location.lat, vp.location.lng,
          )
          const app    = appByVendor[vp.userId] || null
          const status = app ? app.status : 'none'
          return {
            id:            vp.userId,
            name:          vp.name,
            email:         vp.email,
            profile:       vp,
            app,
            status,
            distanceMiles: Math.round(dist * 10) / 10,
          }
        })

      setVendorsInRange(enriched.filter((v) => v.distanceMiles <= radius))
    }
    load()
  }, [user?.communityId, radius])

  // ── Filter helpers ────────────────────────────────────────────────────────
  // All categories present within the current radius
  const availableCategories = [...new Set(
    vendorsInRange.map((v) => v.app?.serviceCategory).filter(Boolean)
  )].sort()

  function toggleCategory(cat) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
    // Deselect vendor if it no longer matches
    if (selectedVendor) {
      const selCat = selectedVendor.app?.serviceCategory
      const nextActive = new Set(activeCategories)
      nextActive.has(cat) ? nextActive.delete(cat) : nextActive.add(cat)
      if (nextActive.size > 0 && selCat && !nextActive.has(selCat)) {
        setSelectedVendor(null)
        setPanelOpen(false)
      }
    }
  }

  function clearFilters() {
    setActiveCategories(new Set())
    setStatusFilter('all')
  }

  // ── Derived displayed vendors ─────────────────────────────────────────────
  const displayedVendors = vendorsInRange.filter((v) => {
    const catOk    = activeCategories.size === 0 || (v.app?.serviceCategory && activeCategories.has(v.app.serviceCategory))
    const statusOk = statusFilter === 'all' || v.status === statusFilter
    return catOk && statusOk
  })

  const approvedCount = displayedVendors.filter((v) => v.status === 'approved').length
  const pendingCount  = displayedVendors.filter((v) => v.status === 'pending').length
  const noAppCount    = displayedVendors.filter((v) => v.status === 'none').length

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + activeCategories.size
  const isFiltered = activeFilterCount > 0

  function handleSelectVendor(vendor) {
    setSelectedVendor(vendor)
    setPanelOpen(true)
  }

  function handleClosePanel() {
    setSelectedVendor(null)
    setPanelOpen(false)
  }

  const radiusMeters = radius * 1609.34

  if (!user?.communityId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-gray-500 text-sm">No community assigned. Contact your administrator.</p>
      </div>
    )
  }

  if (community && !community.location) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-6 text-center">
        <div>
          <p className="text-gray-700 font-medium">Community location not set</p>
          <p className="text-gray-500 text-sm mt-1">Ask your administrator to pin this community on the map.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Filter toolbar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 shadow-sm z-20">
        {/* Row 1 — Status + summary */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">Status</span>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const count = opt.value === 'all'
                ? vendorsInRange.length
                : vendorsInRange.filter((v) => v.status === opt.value).length
              const active = statusFilter === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value)
                    if (selectedVendor && opt.value !== 'all' && selectedVendor.status !== opt.value) {
                      setSelectedVendor(null)
                      setPanelOpen(false)
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {opt.dot && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white' : opt.dot}`} />
                  )}
                  {opt.label}
                  <span className={`text-[11px] font-bold px-1 rounded ${
                    active ? 'bg-white/20 text-white' : 'text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Spacer + active filter summary + clear */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {isFiltered && (
              <>
                <span className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-800">{displayedVendors.length}</span> of {vendorsInRange.length} vendors
                </span>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Clear all
                </button>
              </>
            )}
            {!isFiltered && (
              <span className="text-xs text-gray-400">
                {vendorsInRange.length} vendor{vendorsInRange.length !== 1 ? 's' : ''} within {radius} mi
              </span>
            )}
          </div>
        </div>

        {/* Row 2 — Service type chips */}
        <div ref={filterBarRef} className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">Service</span>

          {availableCategories.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No vendors with applications in range</span>
          ) : (
            <>
              {/* "All types" pill */}
              <button
                onClick={() => setActiveCategories(new Set())}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 transition-all ${
                  activeCategories.size === 0
                    ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                All types
              </button>

              {/* Divider */}
              <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

              {/* Per-category chips */}
              {availableCategories.map((cat) => {
                const isActive = activeCategories.has(cat)
                const count = vendorsInRange.filter((v) => v.app?.serviceCategory === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : activeCategories.size > 0
                          ? 'bg-white text-gray-400 border-gray-200 opacity-60 hover:opacity-90 hover:border-teal-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  >
                    <span>{SERVICE_ICONS[cat] || '📦'}</span>
                    <span>{cat}</span>
                    <span className={`text-[11px] font-bold ${isActive ? 'text-teal-100' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Map + detail panel ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">

        {/* ── MAP column ────────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {community?.location && (
              <FlyTo lat={community.location.lat} lng={community.location.lng} zoom={11} />
            )}

            {/* Community marker */}
            {community?.location && (
              <Marker position={[community.location.lat, community.location.lng]} icon={communityIcon}>
                <Tooltip permanent direction="top" offset={[0, -16]} opacity={1}>
                  <span className="text-xs font-semibold">{community.name}</span>
                </Tooltip>
              </Marker>
            )}

            {/* Radius circle */}
            {community?.location && (
              <Circle
                center={[community.location.lat, community.location.lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#2563eb', fillColor: '#3b82f6',
                  fillOpacity: 0.08, weight: 2, dashArray: '6 4',
                }}
              />
            )}

            {/* Vendor markers */}
            {displayedVendors.map((vendor) => {
              const isSelected = selectedVendor?.id === vendor.id
              const isHovered  = hoveredId === vendor.id
              const icon = (isSelected || isHovered)
                ? makeVendorIconLarge(vendor.status)
                : makeVendorIcon(vendor.status)
              const businessName = vendor.app?.businessName || vendor.name
              const category = vendor.app?.serviceCategory || '—'

              return (
                <Marker
                  key={vendor.id}
                  position={[vendor.profile.location.lat, vendor.profile.location.lng]}
                  icon={icon}
                  eventHandlers={{
                    click:     () => handleSelectVendor(vendor),
                    mouseover: () => setHoveredId(vendor.id),
                    mouseout:  () => setHoveredId(null),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                    <div className="text-xs">
                      <p className="font-semibold leading-snug">{businessName}</p>
                      <p className="text-gray-500">{SERVICE_ICONS[category] || '📦'} {category}</p>
                    </div>
                  </Tooltip>
                </Marker>
              )
            })}
          </MapContainer>

          {/* ── Radius control overlay ──────────────────────────────────────── */}
          <div className="absolute top-3 left-3 z-[1000] bg-white rounded-xl shadow-md border border-gray-200 p-3 w-52">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">Search radius</p>
              <span className="text-xs font-bold text-blue-600">{radius} mi</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                    radius === r
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* ── Stats overlay ──────────────────────────────────────────────── */}
          <div className="absolute top-3 right-3 z-[1000] bg-white rounded-xl shadow-md border border-gray-200 p-3 min-w-[130px]">
            <p className="text-xs font-semibold text-gray-600 mb-1.5">
              {isFiltered ? `Filtered · ${radius} mi` : `Within ${radius} mi`}
            </p>
            {[
              { count: approvedCount, label: 'Approved',        dot: 'bg-green-500' },
              { count: pendingCount,  label: 'Pending',         dot: 'bg-amber-400' },
              { count: noAppCount,    label: 'No application',  dot: 'bg-indigo-400' },
            ].map(({ count, label, dot }) => (
              <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-xs text-gray-700 flex-1">{label}</span>
                <span className="text-xs font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>

          {/* ── Legend ─────────────────────────────────────────────────────── */}
          <div className="absolute bottom-4 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow border border-gray-200 px-3 py-2 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 border-2 border-white shadow-sm flex-shrink-0" style={{ borderRadius: 4 }} />
              <span className="text-gray-600">Your community</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm flex-shrink-0" />
              <span className="text-gray-600">Approved vendor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm flex-shrink-0" />
              <span className="text-gray-600">Pending application</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-400 border-2 border-white shadow-sm flex-shrink-0" />
              <span className="text-gray-600">Not yet applied</span>
            </div>
          </div>

          {/* Mobile tap hint */}
          {!selectedVendor && (
            <div className="md:hidden absolute bottom-4 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow border border-gray-200 px-3 py-2 text-xs text-gray-500">
              Tap a pin for details
            </div>
          )}
        </div>

        {/* ── DETAIL PANEL ──────────────────────────────────────────────────── */}
        <div
          className={`
            bg-white border-t md:border-t-0 md:border-l border-gray-200 md:w-80 lg:w-96
            overflow-y-auto flex-shrink-0 z-10
            transition-all duration-300
            ${selectedVendor
              ? 'md:block fixed md:static bottom-0 left-0 right-0 max-h-[60vh] md:max-h-full rounded-t-2xl md:rounded-none shadow-2xl md:shadow-none'
              : 'hidden md:flex md:items-center md:justify-center'
            }
          `}
        >
          {!selectedVendor ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Select a vendor</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Click any pin on the map to view vendor details
              </p>
            </div>
          ) : (
            <VendorDetail vendor={selectedVendor} communityId={user.communityId} review={selectedVendor?.app ? reviewByApp[selectedVendor.app.id] : null} onClose={handleClosePanel} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vendor Detail Panel ───────────────────────────────────────────────────────
function VendorDetail({ vendor, communityId, review, onClose }) {
  const { app, profile, status, distanceMiles } = vendor
  const meta       = STATUS_META[status] || STATUS_META.none
  const businessName = app?.businessName || vendor.name
  const category   = app?.serviceCategory || null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-start gap-3 z-10">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
          {SERVICE_ICONS[category] || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{businessName}</p>
          {category && <p className="text-xs text-gray-500 mt-0.5">{category}</p>}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <span className="text-xs text-gray-400">{distanceMiles} mi away</span>
            {review?.rating > 0 && (
              <div className="flex items-center gap-1">
                <StarRating rating={review.rating} />
                <span className="text-[11px] text-amber-600 font-medium">{review.rating}/5</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Service radius */}
        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2.5">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <p className="text-xs text-blue-700">
            Serves up to <span className="font-semibold">{profile.serviceRadiusMiles} miles</span> from their location
          </p>
        </div>

        {/* Application details */}
        {app ? (
          <>
            {/* Contact */}
            <Section title="Contact Information">
              <Row icon="👤" value={app.contactName} />
              <Row icon="✉️" value={app.contactEmail} />
              <Row icon="📞" value={app.contactPhone} />
              {app.businessAddress && <Row icon="📍" value={app.businessAddress} />}
            </Section>

            {/* Business */}
            {(app.yearsInBusiness || app.businessDescription) && (
              <Section title="About the Business">
                {app.yearsInBusiness && (
                  <p className="text-xs text-gray-500 mb-2">
                    <span className="font-medium text-gray-700">{app.yearsInBusiness} year{app.yearsInBusiness !== '1' ? 's' : ''}</span> in business
                  </p>
                )}
                {app.businessDescription && (
                  <p className="text-xs text-gray-600 leading-relaxed">{app.businessDescription}</p>
                )}
              </Section>
            )}

            {/* Services */}
            {app.servicesOffered && (
              <Section title="Services Offered">
                <p className="text-xs text-gray-600 leading-relaxed">{app.servicesOffered}</p>
              </Section>
            )}

            {/* Compliance */}
            {(app.licenseInfo || app.insuranceProvider) && (
              <Section title="Compliance">
                {app.licenseInfo          && <Row label="License"  value={app.licenseInfo} />}
                {app.insuranceProvider    && <Row label="Insurer"  value={app.insuranceProvider} />}
                {app.insurancePolicyNumber && <Row label="Policy #" value={app.insurancePolicyNumber} />}
                {app.insuranceExpiration  && <Row label="Expires"  value={app.insuranceExpiration} />}
              </Section>
            )}

            {/* Submitted date */}
            <p className="text-xs text-gray-400 text-center pb-1">
              Applied {formatDate(app.submittedAt)}
            </p>

            {/* CTA */}
            <Link
              to={`/manager/application/${app.id}`}
              className="block w-full text-center py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {status === 'pending' ? 'Review application →' : 'View full application →'}
            </Link>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No application yet</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              This vendor is in your service area but hasn't applied to your community.
            </p>
            <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2.5 text-left">
              <Row icon="✉️" value={vendor.email} />
              <Row icon="📍" value={`${distanceMiles} mi from your community`} />
              <Row icon="🗺️" value={`Covers up to ${profile.serviceRadiusMiles} mi`} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      {icon  && <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>}
      {label && <span className="text-xs text-gray-500 flex-shrink-0 w-16">{label}</span>}
      <span className="text-xs text-gray-800 leading-relaxed">{value}</span>
    </div>
  )
}

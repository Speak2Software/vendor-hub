import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../context/AuthContext'
import { getVendorProfile, saveVendorProfile, getCommunities, haversineDistance } from '../../utils/storage'
import { geocodeAddress } from '../../utils/geocode'
import { normalizeLocations, newLocationId } from '../../utils/vendorLocations'
import { useToast } from '../../components/Toast'

const activeIcon = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#1a73c8;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const inactiveIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#7fb0dd;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const communityIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], map.getZoom()) }, [lat, lng, map])
  return null
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng) } })
  return null
}

const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 75, 100]

const STEPS = [
  { num: 1, label: 'Set Location', active: true },
  { num: 2, label: 'Apply', active: false },
  { num: 3, label: 'Get Approved', active: false },
]

const DEFAULT_CENTER = { lat: 33.4484, lng: -112.074 }

function makeLocation(overrides = {}) {
  return {
    id: newLocationId(),
    label: 'Location',
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    serviceRadiusMiles: 25,
    ...overrides,
  }
}

export default function VendorLocation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [locations, setLocations] = useState([makeLocation({ label: 'Main location' })])
  const [activeId, setActiveId] = useState(null)
  const [geoStatus, setGeoStatus] = useState('idle')
  const [saved, setSaved] = useState(false)
  const [communities, setCommunities] = useState([])
  const [nearbyCommunities, setNearbyCommunities] = useState([])
  const [isNewVendor, setIsNewVendor] = useState(false)

  const [addrQuery, setAddrQuery] = useState('')
  const [addrStatus, setAddrStatus] = useState('idle') // idle | loading | found | notfound

  const active = locations.find((l) => l.id === activeId) || locations[0]

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [profile, comms] = await Promise.all([
        getVendorProfile(user.id),
        getCommunities(),
      ])
      setIsNewVendor(!profile)
      const existing = normalizeLocations(profile)
      if (existing.length) {
        const withIds = existing.map((l) => ({ ...l, id: l.id || newLocationId() }))
        setLocations(withIds)
        setActiveId(withIds[0].id)
      } else {
        const first = makeLocation({ label: 'Main location' })
        setLocations([first])
        setActiveId(first.id)
        requestGeo(first.id)
      }
      setCommunities(comms)
    }
    load()
  }, [user.id])

  // ── Nearby communities: union across all locations' service areas ────────────
  useEffect(() => {
    const nearby = communities.filter((c) => {
      if (!c.location) return false
      return locations.some((l) =>
        haversineDistance(l.lat, l.lng, c.location.lat, c.location.lng) <= l.serviceRadiusMiles
      )
    })
    setNearbyCommunities(nearby)
  }, [locations, communities])

  // ── Mutators ────────────────────────────────────────────────────────────────
  function updateLocation(id, patch) {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function setActiveCoords(lat, lng) {
    if (!active) return
    updateLocation(active.id, { lat, lng })
  }

  function addLocation() {
    const map = active || DEFAULT_CENTER
    // Offset slightly so the new pin doesn't stack exactly on the active one.
    const loc = makeLocation({
      label: `Location ${locations.length + 1}`,
      lat: map.lat + 0.02,
      lng: map.lng + 0.02,
      serviceRadiusMiles: active?.serviceRadiusMiles || 25,
    })
    setLocations((prev) => [...prev, loc])
    setActiveId(loc.id)
    setAddrQuery('')
    setAddrStatus('idle')
  }

  function removeLocation(id) {
    setLocations((prev) => {
      const next = prev.filter((l) => l.id !== id)
      if (id === activeId && next.length) setActiveId(next[0].id)
      return next
    })
  }

  function requestGeo(targetId) {
    const id = targetId || active?.id
    if (!navigator.geolocation) { setGeoStatus('denied'); return }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => { updateLocation(id, { lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus('success') },
      () => setGeoStatus('denied'),
    )
  }

  async function handleAddressSearch(e) {
    e?.preventDefault()
    const addr = addrQuery.trim()
    if (!addr || !active) return
    setAddrStatus('loading')
    try {
      const loc = await geocodeAddress(addr)
      if (loc) {
        updateLocation(active.id, { lat: loc.lat, lng: loc.lng })
        setAddrStatus('found')
      } else {
        setAddrStatus('notfound')
      }
    } catch {
      setAddrStatus('notfound')
    }
  }

  async function handleSave() {
    if (!locations.length) { toast.error('Add at least one location.'); return }
    try {
      await saveVendorProfile({
        userId: user.id,
        locations: locations.map((l) => ({
          id: l.id,
          label: l.label?.trim() || 'Location',
          lat: l.lat,
          lng: l.lng,
          serviceRadiusMiles: l.serviceRadiusMiles,
        })),
      })
      toast.success(locations.length > 1 ? 'Locations & radii saved' : 'Location & radius saved')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      toast.error(err.message || 'Failed to save locations.')
    }
  }

  const center = active || DEFAULT_CENTER

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Onboarding progress bar ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {isNewVendor && (
            <div className="mb-4 bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] rounded-xl px-4 py-3 text-white">
              <p className="text-sm font-bold">👋 Welcome to Vendor Hub, {user.name?.split(' ')[0]}!</p>
              <p className="text-xs text-blue-100 mt-0.5">Complete these 3 steps to start connecting with senior living communities in your area.</p>
            </div>
          )}

          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    step.active
                      ? 'bg-[#1a73c8] border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {step.num}
                  </div>
                  <span className={`text-[11px] font-semibold mt-1 ${step.active ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px w-full bg-gray-200 mb-4 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Step 1 card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Step 1 — Set Your Business Locations</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add every location you serve from. Each one has its own service radius.
                </p>
              </div>
              <button
                onClick={() => requestGeo()}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                Use my location
              </button>
            </div>
          </div>

          {/* Address search — applies to the active location */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
              Editing: <span className="text-blue-600">{active?.label || 'Location'}</span>
            </p>
            <form onSubmit={handleAddressSearch} className="flex gap-2">
              <input
                type="text"
                value={addrQuery}
                onChange={(e) => { setAddrQuery(e.target.value); setAddrStatus('idle') }}
                placeholder="Type this location's address — e.g. 305 W Van Buren St, Phoenix, AZ"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent bg-white placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={addrStatus === 'loading' || !addrQuery.trim()}
                className="px-4 py-2 bg-[#1a73c8] text-white rounded-lg text-sm font-semibold hover:bg-[#135aa0] disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {addrStatus === 'loading' ? 'Finding…' : 'Find'}
              </button>
            </form>
            {addrStatus === 'found' && (
              <p className="text-xs text-green-600 mt-1.5">📍 Address found — the pin has been placed. Drag it to fine-tune if needed.</p>
            )}
            {addrStatus === 'notfound' && (
              <p className="text-xs text-amber-600 mt-1.5">Couldn't find that address. Try adding city and state, or click the map to place the pin manually.</p>
            )}
          </div>

          {/* Map — shows every location; active pin is draggable */}
          <div className="relative" style={{ height: '340px' }}>
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap lat={center.lat} lng={center.lng} />
              <MapClickHandler onClick={setActiveCoords} />

              {locations.map((l) => {
                const isActive = l.id === active?.id
                return (
                  <Fragment key={l.id}>
                    <Marker
                      position={[l.lat, l.lng]}
                      icon={isActive ? activeIcon : inactiveIcon}
                      draggable={isActive}
                      eventHandlers={{
                        click: () => setActiveId(l.id),
                        dragend: (e) => {
                          const pos = e.target.getLatLng()
                          updateLocation(l.id, { lat: pos.lat, lng: pos.lng })
                        },
                      }}
                    >
                      <Popup>
                        <strong>{l.label || 'Location'}</strong><br />
                        <span className="text-xs text-gray-500">
                          {isActive ? 'Drag to adjust · ' : ''}{l.serviceRadiusMiles} mi radius
                        </span>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[l.lat, l.lng]}
                      radius={l.serviceRadiusMiles * 1609.34}
                      pathOptions={{
                        color: isActive ? '#1a73c8' : '#7fb0dd',
                        fillColor: isActive ? '#3b82f6' : '#7fb0dd',
                        fillOpacity: isActive ? 0.12 : 0.06,
                        weight: isActive ? 2 : 1,
                      }}
                    />
                  </Fragment>
                )
              })}

              {communities.map((c) => (
                c.location && (
                  <Marker key={c.id} position={[c.location.lat, c.location.lng]} icon={communityIcon}>
                    <Popup>
                      <strong>{c.name}</strong><br />
                      <span className="text-xs text-gray-500">{c.address}</span>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>

            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow border border-gray-200 px-2.5 py-2 text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1a73c8] border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-600">Active location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#7fb0dd] border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-600">Other locations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-600">Communities</span>
              </div>
            </div>
          </div>

          {/* Location list */}
          <div className="px-4 py-4 space-y-3">
            {locations.map((l, idx) => {
              const isActive = l.id === active?.id
              return (
                <div
                  key={l.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    isActive ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveId(l.id)}
                      title="Edit this location on the map"
                      className={`w-3 h-3 rounded-full flex-shrink-0 border-2 border-white shadow ${
                        isActive ? 'bg-[#1a73c8] ring-2 ring-blue-300' : 'bg-[#7fb0dd]'
                      }`}
                    />
                    <input
                      type="text"
                      value={l.label}
                      onFocus={() => setActiveId(l.id)}
                      onChange={(e) => updateLocation(l.id, { label: e.target.value })}
                      placeholder={`Location ${idx + 1}`}
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent bg-white"
                    />
                    {!isActive && (
                      <button
                        onClick={() => setActiveId(l.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 flex-shrink-0"
                      >
                        Edit on map
                      </button>
                    )}
                    {locations.length > 1 && (
                      <button
                        onClick={() => removeLocation(l.id)}
                        title="Remove location"
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex-shrink-0">Radius</span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {RADIUS_OPTIONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => updateLocation(l.id, { serviceRadiusMiles: r })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                            l.serviceRadiusMiles === r
                              ? 'bg-[#1a73c8] text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                      <span className="text-[11px] text-gray-400 self-center ml-0.5">mi</span>
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              onClick={addLocation}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-blue-600 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add another location
            </button>

            {/* Nearby communities callout */}
            {nearbyCommunities.length > 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-emerald-600 text-base mt-0.5">🏘️</span>
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    {nearbyCommunities.length} communit{nearbyCommunities.length === 1 ? 'y' : 'ies'} across your service areas
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-snug">
                    {nearbyCommunities.map((c) => c.name).join(' · ')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                <p className="text-xs text-amber-800">No communities found in your service areas. Try increasing a radius or adding a location.</p>
              </div>
            )}

            <button
              onClick={handleSave}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1a73c8] text-white hover:bg-[#135aa0] shadow-sm'
              }`}
            >
              {saved ? '✓ Saved!' : locations.length > 1 ? `Save ${locations.length} Locations` : 'Save Location & Radius'}
            </button>
          </div>
        </div>

        {/* ── Step 2 CTA card ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#1a73c8] to-[#0d3f73] rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base">Next: Apply to Communities</h3>
              <p className="text-blue-100 text-xs mt-1 leading-relaxed">
                Once your locations are set, submit your vendor application to senior living communities in your service areas. It only takes a few minutes.
              </p>
              <button
                onClick={() => navigate('/vendor/apply')}
                className="mt-3 inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow"
              >
                Continue to Application
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Step 3 preview card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm opacity-60">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-extrabold text-sm flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-500">Get Approved & Start Earning</h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Community managers review your application and reach out. Once approved, you're listed as a preferred vendor.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../context/AuthContext'
import { getVendorProfile, saveVendorProfile, getCommunities, haversineDistance } from '../../utils/storage'
import { geocodeAddress } from '../../utils/geocode'

const vendorIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const communityIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], map.getZoom()) }, [lat, lng, map])
  return null
}

function DraggableMarker({ position, onChange }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat, e.latlng.lng) },
  })
  return (
    <Marker
      position={position}
      icon={vendorIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          const pos = e.target.getLatLng()
          onChange(pos.lat, pos.lng)
        },
      }}
    >
      <Popup>Your business location<br /><span className="text-xs text-gray-500">Drag to adjust</span></Popup>
    </Marker>
  )
}

const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 75, 100]

const STEPS = [
  { num: 1, label: 'Set Location', active: true, done: false },
  { num: 2, label: 'Apply', active: false, done: false },
  { num: 3, label: 'Get Approved', active: false, done: false },
]

export default function VendorLocation() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [lat, setLat] = useState(33.4484)
  const [lng, setLng] = useState(-112.074)
  const [radius, setRadius] = useState(25)
  const [geoStatus, setGeoStatus] = useState('idle')
  const [saved, setSaved] = useState(false)
  const [communities, setCommunities] = useState([])
  const [nearbyCommunities, setNearbyCommunities] = useState([])

  const [isNewVendor, setIsNewVendor] = useState(false)

  const [addrQuery, setAddrQuery] = useState('')
  const [addrStatus, setAddrStatus] = useState('idle') // idle | loading | found | notfound

  async function handleAddressSearch(e) {
    e?.preventDefault()
    const addr = addrQuery.trim()
    if (!addr) return
    setAddrStatus('loading')
    try {
      const loc = await geocodeAddress(addr)
      if (loc) {
        setLat(loc.lat)
        setLng(loc.lng)
        setAddrStatus('found')
      } else {
        setAddrStatus('notfound')
      }
    } catch {
      setAddrStatus('notfound')
    }
  }

  useEffect(() => {
    async function load() {
      const [profile, comms] = await Promise.all([
        getVendorProfile(user.id),
        getCommunities(),
      ])
      setIsNewVendor(!profile)
      if (profile) {
        setLat(profile.location.lat)
        setLng(profile.location.lng)
        setRadius(profile.serviceRadiusMiles)
      } else {
        requestGeo()
      }
      setCommunities(comms)
    }
    load()
  }, [user.id])

  useEffect(() => {
    const nearby = communities.filter((c) => {
      if (!c.location) return false
      return haversineDistance(lat, lng, c.location.lat, c.location.lng) <= radius
    })
    setNearbyCommunities(nearby)
  }, [lat, lng, radius, communities])

  function requestGeo() {
    if (!navigator.geolocation) { setGeoStatus('denied'); return }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGeoStatus('success') },
      () => setGeoStatus('denied'),
    )
  }

  async function handleSave() {
    await saveVendorProfile({ userId: user.id, location: { lat, lng }, serviceRadiusMiles: radius })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const radiusMeters = radius * 1609.34

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Onboarding progress bar ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Welcome message for new vendors */}
          {isNewVendor && (
            <div className="mb-4 bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] rounded-xl px-4 py-3 text-white">
              <p className="text-sm font-bold">👋 Welcome to VendorHub, {user.name?.split(' ')[0]}!</p>
              <p className="text-xs text-blue-100 mt-0.5">Complete these 3 steps to start connecting with senior living communities in your area.</p>
            </div>
          )}

          {/* Step indicators */}
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
                {i < STEPS.length - 1 && (
                  <div className="h-px w-full bg-gray-200 mb-4 mx-1" />
                )}
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
                <h2 className="text-sm font-bold text-gray-900">Step 1 — Set Your Business Location</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {geoStatus === 'loading' ? 'Detecting your location…' :
                   geoStatus === 'success' ? 'Location detected — drag the pin to fine-tune if needed.' :
                   geoStatus === 'denied' ? 'Location access denied — tap the map to place your pin manually.' :
                   'Drag the pin or click the map to mark your business location.'}
                </p>
              </div>
              <button
                onClick={requestGeo}
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

          {/* Address search */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <form onSubmit={handleAddressSearch} className="flex gap-2">
              <input
                type="text"
                value={addrQuery}
                onChange={(e) => { setAddrQuery(e.target.value); setAddrStatus('idle') }}
                placeholder="Type your business address — e.g. 305 W Van Buren St, Phoenix, AZ"
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

          {/* Map — fixed height, not full-screen */}
          <div className="relative" style={{ height: '320px' }}>
            <MapContainer
              center={[lat, lng]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap lat={lat} lng={lng} />
              <DraggableMarker position={[lat, lng]} onChange={(la, ln) => { setLat(la); setLng(ln) }} />
              <Circle
                center={[lat, lng]}
                radius={radiusMeters}
                pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.12, weight: 2 }}
              />
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

            {/* Map legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow border border-gray-200 px-2.5 py-2 text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1a73c8] border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-600">Your location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-600">Communities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400 opacity-60 border border-blue-500 flex-shrink-0" />
                <span className="text-gray-600">Service area</span>
              </div>
            </div>
          </div>

          {/* Radius + save controls */}
          <div className="px-4 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Service Radius</label>
                <span className="text-sm font-bold text-blue-600">{radius} miles</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      radius === r
                        ? 'bg-[#1a73c8] text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {r} mi
                  </button>
                ))}
              </div>
            </div>

            {/* Nearby communities callout */}
            {nearbyCommunities.length > 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-emerald-600 text-base mt-0.5">🏘️</span>
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    {nearbyCommunities.length} communit{nearbyCommunities.length === 1 ? 'y' : 'ies'} in your service area
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-snug">
                    {nearbyCommunities.map((c) => c.name).join(' · ')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                <p className="text-xs text-amber-800">No communities found in this radius. Try increasing your service area.</p>
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
              {saved ? '✓ Location Saved!' : 'Save Location & Radius'}
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
                Once your location is set, submit your vendor application to senior living communities in your service area. It only takes a few minutes.
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

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getCommunities, saveCommunity, deleteCommunity, getUsers } from '../../utils/storage'
import { uploadImage } from '../../utils/uploadImage'
import { geocodeAddress } from '../../utils/geocode'
import { formatPhone } from '../../utils/formatPhone'
import { useToast } from '../../components/Toast'

const communityIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const pendingIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const CARE_LEVELS = [
  'Independent Living',
  'Assisted Living',
  'Memory Care',
  'Skilled Nursing',
  'Continuing Care Retirement Community (CCRC)',
  'Respite Care',
  'Adult Day Services',
]

const SIZES = [
  'Small (< 50 residents)',
  'Medium (50–150 residents)',
  'Large (150–300 residents)',
  'Very Large (300+ residents)',
]

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function RecenterMap({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.setView([location.lat, location.lng], 14)
  }, [location?.lat, location?.lng, map])
  return null
}

function MapPicker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  if (!position) return null
  return (
    <Marker position={[position.lat, position.lng]} icon={pendingIcon} draggable
      eventHandlers={{ dragend(e) { const p = e.target.getLatLng(); onChange(p.lat, p.lng) } }}>
      <Popup>Community location</Popup>
    </Marker>
  )
}

const blank = {
  name: '', address: '', contactPhone: '', description: '', careLevels: [],
  size: '', logoUrl: '', location: null, managerId: '',
}

export default function CommunitiesAdmin() {
  const toast = useToast()
  const [communities, setCommunities] = useState([])
  const [managers, setManagers] = useState([])
  const [editing, setEditing] = useState(null) // null = list, 'new' or id = form
  const [form, setForm] = useState(blank)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef()
  const [geoStatus, setGeoStatus] = useState('idle') // idle | loading | found | notfound
  const lastGeocoded = useRef('')
  const initialForm = useRef('')

  async function reload() {
    const [comms, usrs] = await Promise.all([getCommunities(), getUsers()])
    setCommunities(comms)
    setManagers(usrs.filter((u) => u.role === 'community_manager'))
  }

  useEffect(() => { reload() }, [])

  function startNew() {
    setForm({ ...blank })
    setLogoFile(null)
    setLogoPreview('')
    setGeoStatus('idle')
    lastGeocoded.current = ''
    initialForm.current = JSON.stringify({ ...blank })
    setEditing('new')
  }

  function startEdit(c) {
    setForm({ ...blank, ...c })
    setLogoFile(null)
    setLogoPreview(c.logoUrl || '')
    setGeoStatus('idle')
    lastGeocoded.current = c.address || ''
    initialForm.current = JSON.stringify({ ...blank, ...c })
    setEditing(c.id)
  }

  function handleBack() {
    const dirty = logoFile !== null || JSON.stringify(form) !== initialForm.current
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return
    setEditing(null)
  }

  async function handleAddressBlur() {
    const addr = form.address.trim()
    if (!addr || addr === lastGeocoded.current) return
    lastGeocoded.current = addr
    setGeoStatus('loading')
    try {
      const loc = await geocodeAddress(addr)
      if (loc) {
        setForm((f) => ({ ...f, location: loc }))
        setGeoStatus('found')
      } else {
        setGeoStatus('notfound')
      }
    } catch {
      setGeoStatus('notfound')
    }
  }

  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function removeLogo() {
    setLogoFile(null)
    setLogoPreview('')
    setForm((f) => ({ ...f, logoUrl: '' }))
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function toggleCareLevel(level) {
    setForm((f) => ({
      ...f,
      careLevels: f.careLevels.includes(level)
        ? f.careLevels.filter((l) => l !== level)
        : [...f.careLevels, level],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      setUploading(true)
      let finalLogoUrl = form.logoUrl
      if (logoFile) {
        finalLogoUrl = await uploadImage(logoFile)
      }
      await saveCommunity({ ...form, logoUrl: finalLogoUrl })
      toast.success(editing === 'new' ? 'Community added' : 'Community saved')
      setEditing(null)
      await reload()
    } catch (err) {
      toast.error(err.message || 'Failed to save community.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCommunity(id)
      toast.success('Community deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete community.')
    }
    setDeleteConfirm(null)
    await reload()
  }

  if (editing !== null) {
    return (
      <div className="max-w-2xl mx-auto p-4 py-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to communities
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">
            {editing === 'new' ? 'Add community' : 'Edit community'}
          </h1>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community name <span className="text-red-500">*</span></label>
              <input required type="text" value={form.name} onChange={update('name')} className={inputClass} placeholder="Sunrise Garden Senior Living" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
              <input required type="text" value={form.address} onChange={update('address')} onBlur={handleAddressBlur} className={inputClass} placeholder="123 Garden Way, Phoenix, AZ 85001" />
              {geoStatus === 'loading' && <p className="text-xs text-gray-400 mt-1">Locating address on map…</p>}
              {geoStatus === 'found' && <p className="text-xs text-green-600 mt-1">📍 Address located — pin placed on the map below.</p>}
              {geoStatus === 'notfound' && <p className="text-xs text-amber-600 mt-1">Couldn't find that address — click the map below to place the pin manually.</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <input type="tel" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: formatPhone(e.target.value) }))} className={inputClass} placeholder="(555) 000-0000" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={update('description')} className={inputClass} placeholder="A brief description of the community…" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Care levels</label>
              <div className="flex flex-wrap gap-2">
                {CARE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleCareLevel(level)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      form.careLevels.includes(level)
                        ? 'bg-[#1a73c8] text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community size</label>
              <select value={form.size} onChange={update('size')} className={inputClass}>
                <option value="">Select size…</option>
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Community logo</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75L7.409 10.59a2.25 2.25 0 0 1 3.182 0l1.641 1.642a2.25 2.25 0 0 0 3.182 0l2.909-2.909A2.25 2.25 0 0 1 21.75 9v6.75A2.25 2.25 0 0 1 19.5 18H4.5a2.25 2.25 0 0 1-2.25-2.25V15.75Z" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                    {logoPreview ? 'Change logo' : 'Upload logo'}
                  </button>
                  {logoPreview && (
                    <button type="button" onClick={removeLogo}
                      className="text-xs text-red-500 hover:text-red-700 text-left px-1">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign manager</label>
              <select value={form.managerId} onChange={update('managerId')} className={inputClass}>
                <option value="">No manager assigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>

            {/* Map picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Community location <span className="text-gray-400 font-normal">(set automatically from the address — click the map to adjust)</span>
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
                <MapContainer
                  center={form.location ? [form.location.lat, form.location.lng] : [39.5, -98.35]}
                  zoom={form.location ? 13 : 4}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap location={form.location} />
                  <MapPicker
                    position={form.location}
                    onChange={(lat, lng) => setForm((f) => ({ ...f, location: { lat, lng } }))}
                  />
                </MapContainer>
              </div>
              {form.location && (
                <p className="text-xs text-gray-500 mt-1">
                  {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 bg-[#1a73c8] text-white hover:bg-[#135aa0]"
            >
              {uploading ? 'Saving…' : editing === 'new' ? 'Add community' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? communities.filter((c) => {
        const manager = managers.find((m) => m.id === c.managerId)
        return [c.name, c.address, c.contactPhone, manager?.name]
          .some((v) => v?.toLowerCase().includes(q))
      })
    : communities

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Communities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{communities.length} senior living communities</p>
        </div>
        <button
          onClick={startNew}
          className="bg-[#1a73c8] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#135aa0] transition-colors"
        >
          + Add community
        </button>
      </div>

      {communities.length > 0 && (
        <div className="relative mb-4">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, address, phone, or manager…"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent bg-white"
          />
        </div>
      )}

      {communities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No communities yet. Add one to get started.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No communities match "{search}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const manager = managers.find((m) => m.id === c.managerId)
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{c.address}</p>
                    {c.contactPhone && <p className="text-xs text-gray-400 mt-0.5">📞 {c.contactPhone}</p>}
                    {c.size && <p className="text-xs text-gray-400 mt-0.5">{c.size}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.careLevels?.map((cl) => (
                        <span key={cl} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{cl}</span>
                      ))}
                    </div>
                    {manager && (
                      <p className="text-xs text-gray-400 mt-1.5">Manager: {manager.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete community?</h3>
            <p className="text-sm text-gray-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

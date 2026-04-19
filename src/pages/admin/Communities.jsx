import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getCommunities, saveCommunity, deleteCommunity, getUsers } from '../../utils/storage'
import { v4 as uuidv4 } from 'uuid'

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
  id: '', name: '', address: '', description: '', careLevels: [],
  size: '', logoUrl: '', location: null, managerId: '',
}

export default function CommunitiesAdmin() {
  const [communities, setCommunities] = useState([])
  const [managers, setManagers] = useState([])
  const [editing, setEditing] = useState(null) // null = list, 'new' or id = form
  const [form, setForm] = useState(blank)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saved, setSaved] = useState(false)

  function reload() {
    setCommunities(getCommunities())
    setManagers(getUsers().filter((u) => u.role === 'community_manager'))
  }

  useEffect(() => { reload() }, [])

  function startNew() {
    setForm({ ...blank, id: uuidv4() })
    setEditing('new')
  }

  function startEdit(c) {
    setForm({ ...c })
    setEditing(c.id)
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

  function handleSave(e) {
    e.preventDefault()
    saveCommunity(form)
    setSaved(true)
    setTimeout(() => { setSaved(false); setEditing(null); reload() }, 1000)
  }

  function handleDelete(id) {
    deleteCommunity(id)
    setDeleteConfirm(null)
    reload()
  }

  if (editing !== null) {
    return (
      <div className="max-w-2xl mx-auto p-4 py-6">
        <button
          onClick={() => setEditing(null)}
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
              <input required type="text" value={form.address} onChange={update('address')} className={inputClass} placeholder="123 Garden Way, Phoenix, AZ 85001" />
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
                        ? 'bg-blue-600 text-white border-blue-600'
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input type="url" value={form.logoUrl} onChange={update('logoUrl')} className={inputClass} placeholder="https://example.com/logo.png" />
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
                Community location <span className="text-gray-400 font-normal">(click map to set)</span>
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
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saved ? 'Saved!' : editing === 'new' ? 'Add community' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Communities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{communities.length} senior living communities</p>
        </div>
        <button
          onClick={startNew}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add community
        </button>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No communities yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {communities.map((c) => {
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

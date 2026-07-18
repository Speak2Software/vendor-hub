import { useState, useEffect, useRef } from 'react'
import { getUsers, getCommunities, createUser, updateUser } from '../../utils/storage'
import { useToast } from '../../components/Toast'

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ManagersAdmin() {
  const toast = useToast()
  const [managers, setManagers] = useState([])
  const [communities, setCommunities] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingManager, setEditingManager] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', communityId: '' })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const initialForm = useRef('')

  async function reload() {
    const [usrs, comms] = await Promise.all([getUsers(), getCommunities()])
    setManagers(usrs.filter((u) => u.role === 'community_manager'))
    setCommunities(comms)
  }

  useEffect(() => { reload() }, [])

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function startNew() {
    const f = { name: '', email: '', password: '', communityId: '' }
    setForm(f)
    initialForm.current = JSON.stringify(f)
    setEditingManager(null)
    setShowForm(true)
    setError('')
  }

  function startEdit(mgr) {
    const f = { name: mgr.name, email: mgr.email, password: '', communityId: mgr.communityId || '' }
    setForm(f)
    initialForm.current = JSON.stringify(f)
    setEditingManager(mgr)
    setShowForm(true)
    setError('')
  }

  function handleClose() {
    if (JSON.stringify(form) !== initialForm.current && !window.confirm('You have unsaved changes. Discard them?')) return
    setShowForm(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingManager) {
        const updates = { name: form.name, communityId: form.communityId }
        if (form.password) updates.password = form.password
        await updateUser(editingManager.id, updates)
        toast.success('Manager updated')
      } else {
        if (!form.password || form.password.length < 6) {
          setError('Password must be at least 6 characters.')
          return
        }
        await createUser({ name: form.name, email: form.email, password: form.password, role: 'community_manager', communityId: form.communityId })
        toast.success('Manager created')
      }
      await reload()
      setShowForm(false)
    } catch (err) {
      toast.error(err.message || 'Failed to save manager.')
    }
  }

  const communityMap = Object.fromEntries(communities.map((c) => [c.id, c]))

  const q = search.trim().toLowerCase()
  const filtered = q
    ? managers.filter((m) =>
        [m.name, m.email, communityMap[m.communityId]?.name]
          .some((v) => v?.toLowerCase().includes(q)))
    : managers

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Community Managers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{managers.length} manager{managers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={startNew} className="bg-[#1a73c8] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#135aa0] transition-colors">
          + Add manager
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              {editingManager ? 'Edit manager' : 'New community manager'}
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name <span className="text-red-500">*</span></label>
                <input required type="text" value={form.name} onChange={update('name')} className={inputClass} placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email {!editingManager && <span className="text-red-500">*</span>}</label>
                <input
                  required={!editingManager}
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  disabled={!!editingManager}
                  className={`${inputClass} ${editingManager ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                  placeholder="manager@community.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingManager ? <span className="text-gray-400 font-normal">(leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingManager}
                  value={form.password}
                  onChange={update('password')}
                  className={inputClass}
                  placeholder={editingManager ? 'Leave blank to keep' : 'Min. 6 characters'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to community</label>
                <select value={form.communityId} onChange={update('communityId')} className={inputClass}>
                  <option value="">No community assigned</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm bg-[#1a73c8] text-white hover:bg-[#135aa0] font-medium">
                {editingManager ? 'Save changes' : 'Create manager'}
              </button>
            </div>
          </form>
        </div>
      )}

      {managers.length > 0 && (
        <div className="relative mb-4">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or community…"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent bg-white"
          />
        </div>
      )}

      {managers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No managers yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">No managers match "{search}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((mgr) => {
            const community = communityMap[mgr.communityId]
            return (
              <div key={mgr.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-green-700">
                      {mgr.name?.charAt(0)?.toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{mgr.name}</p>
                    <p className="text-xs text-gray-500">{mgr.email}</p>
                    {community ? (
                      <p className="text-xs text-blue-600 mt-1">{community.name}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">No community assigned</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(mgr.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => startEdit(mgr)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

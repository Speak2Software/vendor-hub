import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCommunity, saveCommunity } from '../../utils/storage'

const CARE_LEVEL_OPTIONS = [
  'Independent Living',
  'Assisted Living',
  'Memory Care',
  'Skilled Nursing',
  'Respite Care',
  'Continuing Care Retirement Community (CCRC)',
]

const SIZE_OPTIONS = [
  'Small (< 50 residents)',
  'Medium (50–150 residents)',
  'Large (150–300 residents)',
  'Very Large (300+ residents)',
]

const REQUIRED_FIELDS = ['name', 'address', 'description', 'size']

function computeCompleteness(form) {
  const filled = REQUIRED_FIELDS.filter((f) => Boolean(form[f]?.trim?.()))
  const contactBonus = [
    form.contactUrl?.trim(),
    form.contactEmail?.trim(),
    form.contactPhone?.trim(),
  ].filter(Boolean).length
  const total = REQUIRED_FIELDS.length + 3 // +3 for optional contact fields
  return Math.round(((filled.length + contactBonus) / total) * 100)
}

export default function CommunityProfile() {
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [form, setForm] = useState({
    name: '', address: '', description: '', size: '',
    careLevels: [],
    contactUrl: '', contactEmail: '', contactPhone: '',
    showUrl: false, showEmail: false, showPhone: false,
  })
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!user?.communityId) return
    const c = getCommunity(user.communityId)
    if (c) {
      setCommunity(c)
      setForm({
        name:        c.name        || '',
        address:     c.address     || '',
        description: c.description || '',
        size:        c.size        || '',
        careLevels:  c.careLevels  || [],
        contactUrl:  c.contactUrl  || '',
        contactEmail:c.contactEmail|| '',
        contactPhone:c.contactPhone|| '',
        showUrl:     c.showUrl     ?? false,
        showEmail:   c.showEmail   ?? false,
        showPhone:   c.showPhone   ?? false,
      })
    }
  }, [user?.communityId])

  function set(field, value) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  function toggleCareLevel(level) {
    setForm((p) => ({
      ...p,
      careLevels: p.careLevels.includes(level)
        ? p.careLevels.filter((l) => l !== level)
        : [...p.careLevels, level],
    }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())        errs.name        = 'Community name is required.'
    if (!form.address.trim())     errs.address     = 'Address is required.'
    if (!form.description.trim()) errs.description = 'Description is required.'
    if (!form.size)               errs.size        = 'Please select a community size.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    if (!community) return
    saveCommunity({
      ...community,
      ...form,
      updatedAt: new Date().toISOString(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const completeness = computeCompleteness(form)

  if (!user?.communityId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">You are not assigned to a community.</p>
          <p className="text-gray-400 text-xs mt-1">Contact your administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600">
        <div className="max-w-3xl mx-auto px-4 pt-7 pb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Community Profile</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {form.name || 'Your Community'}
              </h1>
              {form.address && (
                <p className="text-blue-200 text-sm mt-1">{form.address}</p>
              )}
            </div>
            {/* Completeness ring */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke={completeness === 100 ? '#34d399' : '#fff'}
                    strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - completeness / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{completeness}%</span>
                </div>
              </div>
              <p className="text-blue-200 text-[10px] font-medium">Complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-blue-200 text-xs font-medium">Profile completeness</p>
              {completeness === 100 && (
                <span className="text-emerald-300 text-xs font-bold flex items-center gap-1">
                  ✓ All fields complete
                </span>
              )}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completeness === 100 ? 'bg-emerald-400' : 'bg-white'
                }`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="max-w-3xl mx-auto px-4 py-7 space-y-6">

        {/* ── Basic Info ─────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-base">🏘️</div>
            <div>
              <h2 className="text-white font-bold text-sm">Community Information</h2>
              <p className="text-blue-100 text-xs">Basic details about your community</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Community Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Sunrise Garden Senior Living"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="1420 Sunrise Blvd, Phoenix, AZ 85006"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe your community — its culture, environment, and what makes it special..."
                rows={3}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Community Size <span className="text-red-400">*</span>
              </label>
              <select
                value={form.size}
                onChange={(e) => set('size', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                  errors.size ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <option value="">Select size…</option>
                {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.size && <p className="text-xs text-red-500 mt-1">{errors.size}</p>}
            </div>
          </div>
        </section>

        {/* ── Care Levels ───────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-base">🩺</div>
            <div>
              <h2 className="text-white font-bold text-sm">Care Levels Offered</h2>
              <p className="text-teal-100 text-xs">Select all care levels available at your community</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CARE_LEVEL_OPTIONS.map((level) => {
                const checked = form.careLevels.includes(level)
                return (
                  <label
                    key={level}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-teal-50 border-teal-300 text-teal-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-teal-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCareLevel(level)}
                      className="w-4 h-4 rounded accent-teal-600"
                    />
                    <span className="text-sm font-medium">{level}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Contact Information ───────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-base">📬</div>
            <div>
              <h2 className="text-white font-bold text-sm">Contact Information</h2>
              <p className="text-purple-100 text-xs">Add contact details and choose what vendors can see</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-xs text-purple-700 leading-relaxed">
                Use the checkboxes to control which contact details are visible to approved vendors on their dashboard.
              </p>
            </div>

            {/* Website URL */}
            <ContactField
              icon="🌐"
              label="Website URL"
              type="url"
              value={form.contactUrl}
              onChange={(v) => set('contactUrl', v)}
              placeholder="www.yourcommunitiy.com"
              showChecked={form.showUrl}
              onShowToggle={() => setForm((p) => ({ ...p, showUrl: !p.showUrl }))}
              showLabel="Show website to vendors"
            />

            {/* Email */}
            <ContactField
              icon="✉️"
              label="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={(v) => set('contactEmail', v)}
              placeholder="info@yourcommunity.com"
              showChecked={form.showEmail}
              onShowToggle={() => setForm((p) => ({ ...p, showEmail: !p.showEmail }))}
              showLabel="Show email to vendors"
            />

            {/* Phone */}
            <ContactField
              icon="📞"
              label="Phone Number"
              type="tel"
              value={form.contactPhone}
              onChange={(v) => set('contactPhone', v)}
              placeholder="(555) 000-0000"
              showChecked={form.showPhone}
              onShowToggle={() => setForm((p) => ({ ...p, showPhone: !p.showPhone }))}
              showLabel="Show phone to vendors"
            />
          </div>
        </section>

        {/* ── Save Button ────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pb-6">
          {saved ? (
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 flex items-center justify-center gap-3">
              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-emerald-800 font-semibold text-sm">Community profile saved!</p>
            </div>
          ) : (
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:from-blue-700 hover:to-teal-700 transition-all shadow-sm"
            >
              Save Community Profile
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// ── Contact Field Component ───────────────────────────────────────────────────
function ContactField({ icon, label, type, value, onChange, placeholder, showChecked, onShowToggle, showLabel }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">{icon} {label}</label>
      <div className="flex gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>
      <label className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
        showChecked && value?.trim()
          ? 'bg-violet-50 border-violet-300 text-violet-800'
          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-violet-200'
      }`}>
        <input
          type="checkbox"
          checked={showChecked}
          onChange={onShowToggle}
          disabled={!value?.trim()}
          className="w-4 h-4 rounded accent-violet-600 disabled:opacity-40"
        />
        <span className={!value?.trim() ? 'opacity-40' : ''}>{showLabel}</span>
        {showChecked && value?.trim() && (
          <span className="text-xs font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-full">Visible</span>
        )}
      </label>
    </div>
  )
}

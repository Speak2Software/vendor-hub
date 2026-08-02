import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCommunity, saveCommunity } from '../../utils/storage'
import { uploadImage } from '../../utils/uploadImage'
import { formatPhone } from '../../utils/formatPhone'
import { useToast } from '../../components/Toast'

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
  const toast = useToast()
  const [community, setCommunity] = useState(null)
  const [form, setForm] = useState({
    name: '', address: '', description: '', size: '',
    careLevels: [],
    contactUrl: '', contactEmail: '', contactPhone: '',
    showUrl: false, showEmail: false, showPhone: false,
    logoUrl: '',
  })
  const [errors, setErrors] = useState({})
  const [logoFile, setLogoFile]       = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      if (!user?.communityId) return
      const c = await getCommunity(user.communityId)
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
          logoUrl:     c.logoUrl     || '',
        })
      }
    }
    load()
  }, [user?.communityId])

  function set(field, value) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5 MB.'); return }
    setUploadError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function removeLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setForm((p) => ({ ...p, logoUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
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

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    if (!community) return

    let logoUrl = form.logoUrl
    if (logoFile) {
      setUploading(true)
      setUploadError('')
      try {
        logoUrl = await uploadImage(logoFile)
        setLogoFile(null)
        setLogoPreview(null)
      } catch (err) {
        setUploadError(err.message || 'Upload failed. Check Cloudinary env vars.')
        toast.error('Logo upload failed — profile not saved.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    try {
      await saveCommunity({
        ...community,
        ...form,
        logoUrl,
        updatedAt: new Date().toISOString(),
      })
      setForm((p) => ({ ...p, logoUrl }))
      toast.success('Community profile saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save community profile.')
    }
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
      <div className="bg-gradient-to-br from-[#0d3f73] via-[#135aa0] to-[#1a73c8]">
        <div className="max-w-3xl mx-auto px-4 pt-7 pb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {(logoPreview || form.logoUrl) && (
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={logoPreview || form.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                </div>
              )}
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Community Profile</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {form.name || 'Your Community'}
                </h1>
                {form.address && (
                  <p className="text-blue-200 text-sm mt-1">{form.address}</p>
                )}
              </div>
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

        {/* ── Logo Upload ────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-base">🖼️</div>
            <div>
              <h2 className="text-white font-bold text-sm">Community Logo</h2>
              <p className="text-indigo-100 text-xs">Shown on your dashboard and to approved vendors</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {logoPreview || form.logoUrl ? (
                    <img
                      src={logoPreview || form.logoUrl}
                      alt="Community logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 min-w-0">
                {logoFile ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                    </svg>
                    <span className="text-sm text-blue-700 font-medium truncate">{logoFile.name}</span>
                  </div>
                ) : null}

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a73c8] text-white rounded-xl text-sm font-semibold hover:bg-[#135aa0] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    {form.logoUrl || logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </button>

                  {(form.logoUrl || logoPreview) && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />

                <p className="text-xs text-gray-400 mt-2">PNG, JPG, SVG or WebP · Max 5 MB · Will be uploaded when you save</p>

                {uploadError && (
                  <p className="text-xs text-red-500 mt-2 font-medium">{uploadError}</p>
                )}
              </div>
            </div>
          </div>
        </section>

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
              onChange={(v) => set('contactPhone', formatPhone(v))}
              placeholder="(555) 000-0000"
              showChecked={form.showPhone}
              onShowToggle={() => setForm((p) => ({ ...p, showPhone: !p.showPhone }))}
              showLabel="Show phone to vendors"
            />
          </div>
        </section>

        {/* ── Vendor Recruitment Flyer → moved to Communications ───────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-base">📋</div>
            <div>
              <h2 className="text-white font-bold text-sm">Vendor Recruitment Flyer</h2>
              <p className="text-rose-100 text-xs">Now lives in Communications — with layouts, colors & live preview</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              The recruitment flyer moved to the Communications section, where you can now pick a
              layout and color scheme, edit every line of copy, and see a live preview of exactly
              what prints — the same tools vendors use for their flyers.
            </p>
            <Link
              to="/manager/communications?tab=flyer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-rose-700 hover:to-pink-600 transition-all shadow-sm"
            >
              Open Flyer Creator
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ── Save Button ────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pb-6">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white py-3.5 rounded-2xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Uploading logo…
              </>
            ) : 'Save Community Profile'}
          </button>
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

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCommunity, saveCommunity } from '../../utils/storage'
import { uploadImage } from '../../utils/uploadImage'

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
    logoUrl: '',
  })
  const [saved, setSaved] = useState(false)
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
        setUploading(false)
        return
      }
      setUploading(false)
    }

    await saveCommunity({
      ...community,
      ...form,
      logoUrl,
      updatedAt: new Date().toISOString(),
    })
    setForm((p) => ({ ...p, logoUrl }))
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
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
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
              onChange={(v) => set('contactPhone', v)}
              placeholder="(555) 000-0000"
              showChecked={form.showPhone}
              onShowToggle={() => setForm((p) => ({ ...p, showPhone: !p.showPhone }))}
              showLabel="Show phone to vendors"
            />
          </div>
        </section>

        {/* ── Vendor Recruitment Flyer ──────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-base">📋</div>
            <div>
              <h2 className="text-white font-bold text-sm">Vendor Recruitment Flyer</h2>
              <p className="text-rose-100 text-xs">Print a QR-code flyer for vendors to scan and apply</p>
            </div>
          </div>
          <div className="p-6 space-y-5">

            {/* Flyer preview */}
            <div className="flex justify-center">
              <div className="w-full max-w-xs rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-white text-center">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-700 to-teal-600 px-5 py-5">
                  {form.logoUrl && (
                    <div className="w-14 h-14 rounded-xl bg-white/20 border border-white/30 overflow-hidden mx-auto mb-3 flex items-center justify-center">
                      <img src={form.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                    </div>
                  )}
                  <p className="text-white font-extrabold text-base leading-tight">{form.name || 'Your Community'}</p>
                  {form.address && <p className="text-blue-200 text-xs mt-1 truncate">{form.address}</p>}
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                  <p className="text-gray-900 font-bold text-sm mb-1">Partner With Us as a Vendor</p>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">
                    Scan the code below to register and apply to serve our residents.
                  </p>

                  {/* QR code */}
                  <div className="inline-block bg-blue-50 border-2 border-blue-100 rounded-2xl p-3 mb-3">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Fwww.speak2vendors.com&color=1e40af&bgcolor=f0f7ff&margin=4"
                      alt="QR code"
                      className="w-24 h-24 block"
                    />
                  </div>

                  <p className="text-blue-700 text-xs font-bold">Scan to Apply</p>
                  <p className="text-blue-400 text-[11px]">www.speak2vendors.com</p>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-2">
                  <p className="text-gray-400 text-[10px]">Powered by Speak2Vendors</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              This flyer opens in a new window ready to print. Display it in your lobby or common areas so vendors can easily find and apply on Speak2Vendors.
            </p>

            <button
              type="button"
              onClick={() => {
                const esc = (s = '') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Fwww.speak2vendors.com&color=1e40af&bgcolor=f0f7ff&margin=10`
                const logoHtml = form.logoUrl
                  ? `<div class="logo-wrap"><img src="${form.logoUrl}" alt="" /></div>`
                  : ''
                const addressHtml = form.address
                  ? `<p class="subtitle">${esc(form.address)}</p>`
                  : ''
                const win = window.open('', '_blank', 'width=640,height=920')
                win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${esc(form.name || 'Community')} – Vendor Recruitment Flyer</title>
  <style>
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; box-sizing:border-box; margin:0; padding:0; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; background:#f3f4f6; display:flex; justify-content:center; padding:40px 20px; min-height:100vh; }
    .flyer { background:#fff; width:100%; max-width:480px; border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,0.18); overflow:hidden; }
    .header { background:linear-gradient(135deg,#1d4ed8,#0891b2); padding:32px 28px 28px; text-align:center; }
    .logo-wrap { width:70px; height:70px; border-radius:14px; background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.3); overflow:hidden; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; }
    .logo-wrap img { width:100%; height:100%; object-fit:contain; padding:4px; }
    .community-name { font-size:22px; font-weight:800; color:#fff; line-height:1.2; }
    .subtitle { font-size:12px; color:rgba(255,255,255,0.8); margin-top:6px; }
    .body { padding:28px; text-align:center; }
    .headline { font-size:19px; font-weight:700; color:#111827; margin-bottom:8px; }
    .desc { font-size:13px; color:#4b5563; line-height:1.65; margin-bottom:26px; }
    .qr-box { display:inline-block; background:#f0f7ff; border:2px solid #bfdbfe; border-radius:18px; padding:18px; margin-bottom:16px; }
    .qr-box img { display:block; width:200px; height:200px; }
    .scan-label { font-size:14px; font-weight:700; color:#1e40af; margin-top:10px; }
    .url-label { font-size:12px; color:#60a5fa; margin-top:3px; }
    .steps { text-align:left; background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:16px 18px; margin:20px 0 0; }
    .steps h3 { font-size:11px; font-weight:700; color:#0369a1; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; }
    .step { display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; }
    .step:last-child { margin-bottom:0; }
    .step-num { width:20px; height:20px; background:#0ea5e9; color:#fff; border-radius:50%; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
    .step-text { font-size:13px; color:#0c4a6e; line-height:1.45; }
    .footer { background:#f9fafb; border-top:1px solid #e5e7eb; padding:12px 28px; text-align:center; }
    .footer p { font-size:10px; color:#9ca3af; }
    @media print { body { padding:0; background:#fff; } .flyer { box-shadow:none; border-radius:0; max-width:100%; } }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      ${logoHtml}
      <div class="community-name">${esc(form.name || 'Our Community')}</div>
      ${addressHtml}
    </div>
    <div class="body">
      <h2 class="headline">Partner With Us as a Vendor</h2>
      <p class="desc">We are actively seeking trusted service providers to support our residents. Scan the QR code below to create your free vendor profile and apply.</p>
      <div class="qr-box">
        <img src="${qrUrl}" alt="QR code – scan to visit speak2vendors.com" />
        <p class="scan-label">Scan to Apply</p>
        <p class="url-label">www.speak2vendors.com</p>
      </div>
      <div class="steps">
        <h3>How it works</h3>
        <div class="step"><span class="step-num">1</span><span class="step-text">Scan the QR code or visit <strong>speak2vendors.com</strong></span></div>
        <div class="step"><span class="step-num">2</span><span class="step-text">Create a free vendor account and complete your profile</span></div>
        <div class="step"><span class="step-num">3</span><span class="step-text">Submit your application to <strong>${esc(form.name || 'our community')}</strong> for review</span></div>
      </div>
    </div>
    <div class="footer">
      <p>Powered by Speak2Vendors · speak2vendors.com</p>
    </div>
  </div>
  <script>setTimeout(function(){ window.print(); }, 500);</script>
</body>
</html>`)
                win.document.close()
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-500 text-white py-3.5 rounded-2xl text-sm font-bold hover:from-rose-700 hover:to-pink-600 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
              Print / Download Flyer
            </button>
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
              disabled={uploading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:from-blue-700 hover:to-teal-700 disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2"
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
